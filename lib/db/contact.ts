import "server-only";

import { eq } from "drizzle-orm";
import { db } from "./client";
import { contactMessage } from "./schema";

export type ContactDeliveryStatus = "sent" | "failed" | "not_configured";

export async function createContactMessage({
  name,
  email,
  subject,
  orderId,
  message,
  ip,
  userAgent,
}: {
  name: string;
  email: string;
  subject?: string | null;
  orderId?: string | null;
  message: string;
  ip: string;
  userAgent?: string | null;
}) {
  const [saved] = await db
    .insert(contactMessage)
    .values({
      name,
      email,
      subject: subject ?? null,
      orderId: orderId ?? null,
      message,
      ip,
      userAgent: userAgent ?? null,
    })
    .returning({ id: contactMessage.id });

  return saved;
}

export async function updateContactMessageDelivery({
  id,
  status,
  reason,
}: {
  id: string;
  status: ContactDeliveryStatus;
  reason?: string | null;
}) {
  await db
    .update(contactMessage)
    .set({
      deliveryStatus: status,
      deliveryReason: reason ?? null,
      deliveredAt: status === "sent" ? new Date() : null,
    })
    .where(eq(contactMessage.id, id));
}
