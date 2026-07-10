"use client";

import { Calendar, Github, Heart, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Doc2McpLogo } from "@/components/doc2mcp/logo";
import { CONTACT_EMAIL } from "@/lib/config/site";

const PRODUCT_HUNT_URL =
  "https://www.producthunt.com/products/doc2mcp?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-doc2mcp";
const PRODUCT_HUNT_BADGE =
  "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1171095&theme=light&t=1781401698614";

const FEATURES_LINKS = [
  { label: "Chat", href: "/chat" },
  { label: "Demo", href: "/demo" },
  { label: "Capabilities", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
];

const RESOURCES_LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Quick start", href: "/docs/quickstart" },
  { label: "Architecture", href: "/docs/workflow" },
  { label: "Security", href: "/docs/security" },
];

const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Refund & Cancellation", href: "/refund-policy" },
  { label: "Contact us", href: "/contact" },
];

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/doc2mcp",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/doc2mcp",
    icon: Linkedin,
  },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        &lt;{title}&gt;
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              className="text-foreground/80 text-sm transition-colors hover:text-foreground"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FooterSection() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative overflow-hidden border-border/40 border-t bg-background pt-16 sm:pt-20">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-16">
          <div className="space-y-6">
            <Link className="inline-flex items-center gap-2" href="/">
              <Doc2McpLogo size={32} />
            </Link>
            <p className="max-w-xs text-muted-foreground text-sm leading-relaxed">
              The fastest way to turn any documentation into an MCP server your
              AI agents can read.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                    href={social.href}
                    key={social.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                aria-label="Book a 30-minute demo on Calendly"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3.5 text-foreground/80 text-xs transition-colors hover:border-border hover:text-foreground"
                href="https://calendly.com/doc2mcp/30min"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Calendar aria-hidden="true" className="size-3.5" />
                <span className="font-medium">Book a demo</span>
              </a>
              <a
                aria-label="Sponsor gautammanak1 on GitHub"
                className="group inline-flex h-9 items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3.5 text-muted-foreground hover:text-foreground text-xs transition-colors hover:bg-secondary/40"
                href="https://github.com/sponsors/gautammanak1"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Heart
                  aria-hidden="true"
                  className="size-3.5 text-[#4285f4] dark:text-[#8ab4f8] transition-transform group-hover:scale-110"
                  fill="currentColor"
                />
                <span className="font-medium">Sponsor on GitHub</span>
              </a>
            </div>

            <a
              aria-label="doc2mcp on Product Hunt"
              className="inline-block pt-2"
              href={PRODUCT_HUNT_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Image
                alt="doc2mcp - Paste a docs URL, get a hosted MCP server for AI agents | Product Hunt"
                height={54}
                src={PRODUCT_HUNT_BADGE}
                unoptimized
                width={250}
              />
            </a>
          </div>

          <FooterColumn links={FEATURES_LINKS} title="Features" />
          <FooterColumn links={RESOURCES_LINKS} title="Resources" />
          <FooterColumn links={LEGAL_LINKS} title="Legal" />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-border/40 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            © {currentYear} doc2mcp. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/80">
            <a
              className="hover:text-foreground"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            {" · Built by the "}
            <a
              className="font-medium text-foreground/90 underline decoration-foreground/20 decoration-dotted underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/60"
              href="https://www.linkedin.com/company/doc2mcp"
              rel="noopener noreferrer"
              target="_blank"
            >
              doc2mcp team
            </a>
          </p>
        </div>
      </div>

      <AnimatedWordmark />
    </footer>
  );
}

function AnimatedWordmark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mt-12 select-none overflow-hidden text-center"
    >
      <p className="-mb-4 footer-wordmark font-display font-bold leading-none tracking-tight text-[clamp(3rem,14vw,18rem)] sm:-mb-10 lg:-mb-16">
        doc2mcp
      </p>
      <style>{`
        .footer-wordmark {
          background-image: linear-gradient(
            110deg,
            color-mix(in oklab, var(--foreground) 8%, transparent) 0%,
            color-mix(in oklab, var(--foreground) 8%, transparent) 38%,
            #4285f4 50%,
            color-mix(in oklab, var(--foreground) 8%, transparent) 62%,
            color-mix(in oklab, var(--foreground) 8%, transparent) 100%
          );
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation:
            wordmark-sheen 5s linear infinite,
            wordmark-float 7s ease-in-out infinite;
        }
        .dark .footer-wordmark {
          background-image: linear-gradient(
            110deg,
            color-mix(in oklab, var(--foreground) 10%, transparent) 0%,
            color-mix(in oklab, var(--foreground) 10%, transparent) 38%,
            #8ab4f8 50%,
            color-mix(in oklab, var(--foreground) 10%, transparent) 62%,
            color-mix(in oklab, var(--foreground) 10%, transparent) 100%
          );
        }
        @keyframes wordmark-sheen {
          0% { background-position: 150% 50%; }
          100% { background-position: -50% 50%; }
        }
        @keyframes wordmark-float {
          0%, 100% {
            transform: translateY(0);
            filter: drop-shadow(0 0 0 rgba(66, 133, 244, 0));
          }
          50% {
            transform: translateY(-6px);
            filter: drop-shadow(0 12px 40px rgba(66, 133, 244, 0.18));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .footer-wordmark { animation: none; }
        }
      `}</style>
    </div>
  );
}
