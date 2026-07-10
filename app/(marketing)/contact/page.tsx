import { Clock, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { CONTACT_EMAIL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact — doc2mcp",
  description:
    "Get in touch with the doc2mcp team for support, billing, partnership, or press enquiries.",
};

export default function ContactPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />
      <section className="relative mx-auto max-w-5xl px-6 pt-32 pb-24 lg:px-8">
        <div className="mb-12">
          <Link
            className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] hover:text-foreground"
            href="/"
          >
            ← back to doc2mcp
          </Link>
          <h1 className="mt-4 font-display font-bold text-4xl tracking-tight sm:text-5xl">
            Contact us
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-base leading-relaxed">
            Sales, support, billing, partnership, or press — fill out the form
            and we&apos;ll get back within one business day.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <ContactForm />

          <aside className="space-y-5">
            <InfoCard icon={Mail} title="Email us directly">
              <a
                className="text-foreground/85 text-sm underline hover:text-foreground"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
            </InfoCard>
            <InfoCard icon={Clock} title="Response time">
              <p className="text-foreground/85 text-sm">
                Within 1 business day (Mon–Fri, IST)
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Refunds typically processed in 7 business days.
              </p>
            </InfoCard>
            <InfoCard icon={MapPin} title="Operated from">
              <p className="text-foreground/85 text-sm">India</p>
              <p className="mt-1 text-muted-foreground text-xs">
                Indian users billed in INR; international users billed in USD.
              </p>
            </InfoCard>

            <div className="rounded-2xl border border-border/40 bg-background/40 p-5 text-sm">
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Legal
              </p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <Link
                    className="text-foreground/85 hover:text-foreground"
                    href="/terms-and-conditions"
                  >
                    Terms &amp; Conditions →
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-foreground/85 hover:text-foreground"
                    href="/privacy-policy"
                  >
                    Privacy Policy →
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-foreground/85 hover:text-foreground"
                    href="/refund-policy"
                  >
                    Refund &amp; Cancellation →
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
      <FooterSection />
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Mail;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
