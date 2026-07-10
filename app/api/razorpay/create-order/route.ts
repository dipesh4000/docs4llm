import { nanoid } from "nanoid";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  DEFAULT_CURRENCY,
  getMinAmount,
  getPlanPrice,
  isBillingCurrency,
  isBillingCycle,
  isPlanId,
  PLANS,
} from "@/lib/billing/plans";
import {
  getRazorpay,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay/client";

const bodySchema = z.object({
  plan: z.string(),
  cycle: z.string(),
  currency: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type === "guest") {
    return Response.json(
      { error: "Sign in to purchase a plan." },
      { status: 401 }
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!(isPlanId(parsed.plan) && isBillingCycle(parsed.cycle))) {
    return Response.json(
      { error: "Invalid plan or billing cycle" },
      { status: 400 }
    );
  }

  const currency =
    parsed.currency && isBillingCurrency(parsed.currency)
      ? parsed.currency
      : DEFAULT_CURRENCY;

  const planConfig = PLANS[parsed.plan];
  const amount = getPlanPrice(parsed.plan, currency, parsed.cycle);
  const minAmount = getMinAmount(currency);

  if (!isRazorpayConfigured()) {
    return Response.json(
      {
        error:
          "Payments are not configured yet. Add Razorpay keys in production and retry.",
      },
      { status: 503 }
    );
  }

  if (amount < minAmount) {
    return Response.json(
      {
        error: `Plan amount is below Razorpay's minimum of ${minAmount} ${currency === "USD" ? "cents" : "paise"}.`,
      },
      { status: 400 }
    );
  }

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency,
      // Razorpay's `receipt` field is capped at 40 chars.
      receipt: `d2m_${parsed.plan.slice(0, 4)}_${nanoid(10)}`.slice(0, 40),
      notes: {
        userId: session.user.id,
        email: session.user.email ?? "",
        plan: parsed.plan,
        cycle: parsed.cycle,
        currency,
      },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      plan: parsed.plan,
      cycle: parsed.cycle,
      planName: planConfig.name,
      userEmail: session.user.email ?? null,
      userName: session.user.name ?? null,
    });
  } catch (error) {
    const razorpayError = error as {
      statusCode?: number;
      error?: { code?: string; description?: string; reason?: string };
      message?: string;
    } | null;
    const description =
      razorpayError?.error?.description ??
      (error instanceof Error ? error.message : undefined);

    console.error("Razorpay create order error:", {
      currency,
      plan: parsed.plan,
      cycle: parsed.cycle,
      statusCode: razorpayError?.statusCode,
      code: razorpayError?.error?.code,
      reason: razorpayError?.error?.reason,
      description: description ?? "Unknown error",
    });

    // A 401/400 from Razorpay almost always means the live keys are missing or
    // invalid in this environment — surface that distinctly from card errors.
    if (razorpayError?.statusCode === 401) {
      return Response.json(
        {
          error:
            "Payment gateway rejected the request (invalid Razorpay keys). On production use live keys (rzp_live_*) from the Razorpay dashboard — test keys often fail here. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel, then redeploy.",
        },
        { status: 502 }
      );
    }

    return Response.json(
      {
        error:
          description ??
          (currency === "USD"
            ? "USD payments require International Payments to be enabled on your Razorpay account."
            : "Could not create payment order. Please try again."),
      },
      { status: currency === "USD" ? 400 : 502 }
    );
  }
}
