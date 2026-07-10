import type { Metadata } from "next";
import Link from "next/link";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { LegalPage } from "@/components/legal/legal-page";
import { CONTACT_EMAIL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy — doc2mcp",
  description:
    "How doc2mcp collects, uses, stores, and protects your personal data, documentation sources, and payment information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />
      <LegalPage
        intro="This Privacy Policy explains what information doc2mcp (operated by Gautam Manak) collects when you use our website, app, and APIs, how we use it, and what controls you have over it. We try to keep this short and human-readable — if anything is unclear, please contact us."
        lastUpdated="29 May 2026"
        sections={[
          {
            heading: "1. Who we are",
            body: (
              <p>
                doc2mcp (“we”, “us”, “our”) is a software-as-a-service product
                operated by Gautam Manak from India. You can reach us at{" "}
                <a
                  className="underline hover:text-foreground"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            ),
          },
          {
            heading: "2. Information we collect",
            body: (
              <>
                <p>We collect three categories of information:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Account data</strong> — email, name (optional), auth
                    provider tokens, hashed passwords (when applicable),
                    timestamps, and basic metadata.
                  </li>
                  <li>
                    <strong>Product data</strong> — documentation URLs you
                    submit, crawled pages, generated MCP servers, chat history,
                    attached images / PDFs, and usage counters.
                  </li>
                  <li>
                    <strong>Payment data</strong> — order IDs, payment IDs,
                    amounts, currency, and subscription status. Full card
                    numbers and CVV are handled exclusively by Razorpay and
                    never touch our servers.
                  </li>
                </ul>
              </>
            ),
          },
          {
            heading: "3. How we use your information",
            body: (
              <>
                <p>We use your data to:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Provide and operate the doc2mcp service.</li>
                  <li>
                    Run docs → MCP conversions, store generated artifacts, and
                    serve them back to you and your AI agents.
                  </li>
                  <li>
                    Authenticate you, prevent abuse, and enforce plan limits.
                  </li>
                  <li>
                    Send transactional emails (account confirmation, payment
                    receipts, security notices). We do not send marketing emails
                    without separate consent.
                  </li>
                  <li>Improve product quality and diagnose errors.</li>
                </ul>
              </>
            ),
          },
          {
            heading: "4. Sub-processors",
            body: (
              <>
                <p>
                  We use the following third-party processors. Each is bound by
                  its own privacy terms:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>Supabase</strong> — database, authentication, and
                    file storage.
                  </li>
                  <li>
                    <strong>Vercel</strong> — application hosting, edge network,
                    and analytics.
                  </li>
                  <li>
                    <strong>Razorpay</strong> — payment processing for paid
                    plans.
                  </li>
                  <li>
                    <strong>Google Gemini</strong> — the LLM provider that
                    powers chat, workflow inference, and image / PDF generation.
                  </li>
                </ul>
              </>
            ),
          },
          {
            heading: "5. Data retention",
            body: (
              <p>
                We retain account data while your account is active. You can
                delete your account by emailing us; on deletion we remove your
                personal data within 30 days, except where we are required to
                keep transaction records by Indian tax law (typically 7 years
                for invoices and payment records).
              </p>
            ),
          },
          {
            heading: "6. Your rights",
            body: (
              <p>
                You can access, correct, export, or delete your personal data by
                emailing{" "}
                <a
                  className="underline hover:text-foreground"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
                . We respond within 30 days. If you are in the EU / UK /
                California you also have the rights granted by GDPR / CCPA.
              </p>
            ),
          },
          {
            heading: "7. Security",
            body: (
              <p>
                Data is encrypted in transit (HTTPS) and at rest. Authentication
                uses Supabase Row-Level Security. We follow industry-standard
                practices but cannot guarantee absolute security; please use a
                strong, unique password.
              </p>
            ),
          },
          {
            heading: "8. Children",
            body: (
              <p>
                doc2mcp is not directed at children under 16. If you believe a
                child has provided us personal data, please contact us and we
                will remove it.
              </p>
            ),
          },
          {
            heading: "9. Changes to this policy",
            body: (
              <p>
                We may update this policy. Material changes will be communicated
                via email or an in-app notice at least 14 days before they take
                effect.
              </p>
            ),
          },
          {
            heading: "10. Contact",
            body: (
              <p>
                Questions? Email{" "}
                <a
                  className="underline hover:text-foreground"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                or use the{" "}
                <Link
                  className="underline hover:text-foreground"
                  href="/contact"
                >
                  contact form
                </Link>
                .
              </p>
            ),
          },
        ]}
        title="Privacy Policy"
      />
      <FooterSection />
    </main>
  );
}
