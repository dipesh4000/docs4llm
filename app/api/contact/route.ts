import { z } from "zod";
import { CONTACT_EMAIL } from "@/lib/config/site";
import {
  type ContactDeliveryStatus,
  createContactMessage,
  updateContactMessageDelivery,
} from "@/lib/db/contact";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().max(120).optional(),
  orderId: z.string().max(120).optional(),
  message: z.string().min(5).max(4000),
  /** Honeypot — bots tend to fill every input. Should be empty. */
  website: z.string().max(200).optional(),
});

type ContactPayload = z.infer<typeof bodySchema>;

type DeliveryResult = {
  delivered: boolean;
  status: ContactDeliveryStatus;
  reason?: string;
};

function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function deliverViaResend(
  payload: ContactPayload,
  ip: string
): Promise<DeliveryResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      delivered: false,
      status: "not_configured",
      reason: "RESEND_API_KEY not set",
    };
  }
  const from =
    process.env.RESEND_FROM ?? "doc2mcp contact <onboarding@resend.dev>";
  const to = process.env.CONTACT_INBOX ?? CONTACT_EMAIL;

  const subject = `[doc2mcp contact] ${payload.subject ?? "General question"} — ${payload.name}`;
  const text = [
    `From: ${payload.name} <${payload.email}>`,
    payload.subject ? `Subject: ${payload.subject}` : null,
    payload.orderId ? `Razorpay order: ${payload.orderId}` : null,
    `IP: ${ip}`,
    "",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return {
      delivered: false,
      status: "failed",
      reason: `resend ${res.status}: ${detail}`,
    };
  }
  return { delivered: true, status: "sent" };
}

export async function POST(request: Request) {
  let parsed: ContactPayload;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Please fill in name, email, and message." },
      { status: 400 }
    );
  }

  // Honeypot — silently accept but do nothing.
  if (parsed.website && parsed.website.length > 0) {
    return Response.json({ ok: true });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  let contactId: string;
  try {
    const saved = await createContactMessage({
      name: parsed.name,
      email: parsed.email,
      subject: parsed.subject ?? null,
      orderId: parsed.orderId ?? null,
      message: parsed.message,
      ip,
      userAgent,
    });
    contactId = saved.id;
  } catch (error) {
    console.error("[contact] failed to persist message:", error);
    return Response.json(
      { error: "Could not save your message. Please try again." },
      { status: 500 }
    );
  }

  // Keep a short log line for ops visibility. The full message is stored in
  // ContactMessage, so logs are no longer the source of truth.
  console.log("[contact] new message", {
    id: contactId,
    name: parsed.name,
    email: parsed.email,
    subject: parsed.subject ?? null,
    orderId: parsed.orderId ?? null,
    messagePreview: parsed.message.slice(0, 200),
    ip,
  });

  try {
    const delivery = await deliverViaResend(parsed, ip);
    try {
      await updateContactMessageDelivery({
        id: contactId,
        status: delivery.status,
        reason: delivery.reason ?? null,
      });
    } catch (error) {
      console.error("[contact] failed to update delivery status:", error);
    }
    if (!delivery.delivered) {
      console.warn("[contact] email not delivered:", delivery.reason);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[contact] delivery error:", error);
    try {
      await updateContactMessageDelivery({
        id: contactId,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    } catch (updateError) {
      console.error("[contact] failed to update delivery status:", updateError);
    }
    // Still return ok because the full message is already stored in Postgres.
    return Response.json({ ok: true });
  }
}
