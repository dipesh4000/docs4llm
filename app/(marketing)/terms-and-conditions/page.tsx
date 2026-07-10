import type { Metadata } from "next";
import Link from "next/link";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { LegalPage } from "@/components/legal/legal-page";
import { CONTACT_EMAIL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms & Conditions — doc2mcp",
  description:
    "The terms that govern your use of doc2mcp — accounts, plans, acceptable use, IP, liability, and governing law.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />
      <LegalPage
        intro="By creating a doc2mcp account or using our website, app, or APIs, you agree to these Terms & Conditions. Please read them carefully — they form a legally binding agreement between you and us."
        lastUpdated="29 May 2026"
        sections={[
          {
            heading: "1. The service",
            body: (
              <p>
                doc2mcp lets you convert public documentation URLs into Model
                Context Protocol (MCP) servers, chat with an AI model, and
                generate AI-ready artifacts such as images and PDFs. The service
                is provided “as is” and may evolve at any time.
              </p>
            ),
          },
          {
            heading: "2. Accounts",
            body: (
              <p>
                You must provide a working email and keep your credentials
                confidential. You are responsible for everything that happens
                under your account. You must be at least 16 years old to use
                doc2mcp.
              </p>
            ),
          },
          {
            heading: "3. Plans and billing",
            body: (
              <>
                <p>
                  Paid plans are sold as one-time Razorpay payments that unlock
                  a billing window (1, 6, or 12 months). Plans do not
                  auto-renew; when the window ends, your account reverts to the
                  Free plan unless you place a new order. See the{" "}
                  <Link
                    className="underline hover:text-foreground"
                    href="/refund-policy"
                  >
                    Refund &amp; Cancellation Policy
                  </Link>{" "}
                  for full details on refunds.
                </p>
                <p>
                  All amounts on the pricing page are shown in USD or INR.
                  Indian users are charged in INR; international users are
                  charged in USD where supported by Razorpay. Bank, FX, or
                  card-network fees are not refundable.
                </p>
              </>
            ),
          },
          {
            heading: "4. Acceptable use",
            body: (
              <>
                <p>You agree not to:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    Submit documentation URLs whose content infringes
                    third-party copyright, trademark, or trade-secret rights.
                  </li>
                  <li>
                    Use doc2mcp to crawl or attack any site you do not own or
                    have permission to crawl, or to circumvent robots.txt where
                    the site owner forbids automated access.
                  </li>
                  <li>
                    Generate hateful, harassing, illegal, sexually explicit, or
                    otherwise harmful content with our AI tools, including image
                    and PDF generation.
                  </li>
                  <li>
                    Reverse-engineer, scrape, or attempt to extract our model
                    weights, prompts, or other proprietary information.
                  </li>
                  <li>
                    Resell or sublicense the service without our prior written
                    consent.
                  </li>
                </ul>
                <p>
                  We may suspend or terminate accounts that violate these rules
                  without notice and without a refund.
                </p>
              </>
            ),
          },
          {
            heading: "5. Intellectual property",
            body: (
              <p>
                The doc2mcp software, brand, and original content are owned by
                us. Generated artifacts (MCP servers, summaries, images, PDFs)
                created from your input are yours to use commercially, subject
                to the rights of the underlying documentation sources you
                provide.
              </p>
            ),
          },
          {
            heading: "6. AI output disclaimer",
            body: (
              <p>
                AI output is generated by language and image models that may
                produce inaccurate, biased, or otherwise undesirable content.
                You are responsible for reviewing AI output before relying on
                it. doc2mcp is not a substitute for professional advice.
              </p>
            ),
          },
          {
            heading: "7. Availability",
            body: (
              <p>
                We aim for high availability but do not guarantee uninterrupted
                service. Scheduled maintenance, upstream provider outages
                (Vercel, Supabase, Razorpay, Google Gemini), or events beyond
                our reasonable control may cause downtime.
              </p>
            ),
          },
          {
            heading: "8. Limitation of liability",
            body: (
              <p>
                To the maximum extent permitted by Indian law, our aggregate
                liability arising out of or relating to the service in any
                12-month period is limited to the amount you paid us in that
                period. We are not liable for indirect, incidental, special, or
                consequential damages.
              </p>
            ),
          },
          {
            heading: "9. Termination",
            body: (
              <p>
                You can stop using doc2mcp at any time and delete your account
                by emailing us. We may suspend or terminate accounts that
                violate these terms or applicable law. Sections that by their
                nature should survive (IP, disclaimers, limitations, governing
                law) will survive termination.
              </p>
            ),
          },
          {
            heading: "10. Governing law",
            body: (
              <p>
                These terms are governed by the laws of India. Courts in
                Bengaluru, Karnataka have exclusive jurisdiction over any
                dispute arising out of or relating to these terms or the
                service.
              </p>
            ),
          },
          {
            heading: "11. Contact",
            body: (
              <p>
                Questions about these terms? Email{" "}
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
        title="Terms &amp; Conditions"
      />
      <FooterSection />
    </main>
  );
}
