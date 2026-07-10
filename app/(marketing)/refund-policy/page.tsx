import type { Metadata } from "next";
import Link from "next/link";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { LegalPage } from "@/components/legal/legal-page";
import { CONTACT_EMAIL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — doc2mcp",
  description:
    "How refunds and cancellations work for doc2mcp paid plans on Razorpay.",
};

export default function RefundPolicyPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />
      <LegalPage
        contactNote={
          <p className="text-sm">
            To request a refund or cancellation, email{" "}
            <a
              className="underline hover:text-foreground"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>{" "}
            from the email address on your doc2mcp account, or fill out the{" "}
            <Link className="underline hover:text-foreground" href="/contact">
              contact form
            </Link>
            . Please include your Razorpay order id (visible in your dashboard
            under Billing).
          </p>
        }
        intro="We want you to be happy with doc2mcp. This page explains how cancellations and refunds work for our paid plans on Razorpay."
        lastUpdated="29 May 2026"
        sections={[
          {
            heading: "1. Free plan",
            body: (
              <p>
                The Free plan is free forever and does not require any payment —
                there is nothing to refund or cancel. You can stop using the
                service or delete your account at any time.
              </p>
            ),
          },
          {
            heading: "2. Paid plans (Starter / Pro / Team)",
            body: (
              <>
                <p>
                  Each paid plan is sold as a one-time Razorpay payment that
                  unlocks a billing window (1 month, 6 months, or 12 months).
                  Plans <strong>do not auto-renew</strong>; when the window
                  ends, your account automatically reverts to the Free plan
                  unless you place a new order.
                </p>
                <p>
                  Cancelling, in this context, simply means choosing not to
                  renew. There is no recurring charge to stop.
                </p>
              </>
            ),
          },
          {
            heading: "3. Refund window",
            body: (
              <>
                <p>We offer two refund paths:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Full refund within 7 days</strong> of purchase, if
                    you have used 5 or fewer paid conversions and have not
                    raised a Razorpay dispute / chargeback.
                  </li>
                  <li>
                    <strong>Pro-rated refund</strong> for the unused portion of
                    your billing window if doc2mcp is unavailable due to a
                    sustained outage on our side (more than 72 cumulative hours
                    of downtime within a 30-day window).
                  </li>
                </ul>
              </>
            ),
          },
          {
            heading: "4. Non-refundable charges",
            body: (
              <>
                <p>The following are non-refundable:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Conversions / API calls already consumed beyond the 5-call
                    threshold above.
                  </li>
                  <li>
                    Purchases where the account has been suspended for violating
                    our{" "}
                    <Link
                      className="underline hover:text-foreground"
                      href="/terms-and-conditions"
                    >
                      Terms &amp; Conditions
                    </Link>
                    .
                  </li>
                  <li>
                    Currency-conversion losses charged by your bank or card
                    network.
                  </li>
                </ul>
              </>
            ),
          },
          {
            heading: "5. How to request a refund",
            body: (
              <>
                <p>
                  Email{" "}
                  <a
                    className="underline hover:text-foreground"
                    href={`mailto:${CONTACT_EMAIL}`}
                  >
                    {CONTACT_EMAIL}
                  </a>{" "}
                  from your registered email with:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Your Razorpay order id (e.g. <code>order_XXXXXX</code>).
                  </li>
                  <li>The plan you purchased and the date.</li>
                  <li>A short reason for the request.</li>
                </ul>
                <p>
                  We acknowledge within 2 business days and process approved
                  refunds within 7 business days. The refunded amount is
                  credited back to the original payment method by Razorpay and
                  can take a further 5–10 business days to appear, depending on
                  your bank.
                </p>
              </>
            ),
          },
          {
            heading: "6. Chargebacks",
            body: (
              <p>
                Please contact us before raising a chargeback — most issues are
                resolved faster by email. Accounts with active chargebacks are
                temporarily suspended until the dispute is closed.
              </p>
            ),
          },
        ]}
        title="Refund &amp; Cancellation Policy"
      />
      <FooterSection />
    </main>
  );
}
