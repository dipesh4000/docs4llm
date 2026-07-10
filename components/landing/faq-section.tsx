"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Faq = {
  id: string;
  q: string;
  a: string;
};

const FAQS: Faq[] = [
  {
    id: "what-is-mcp",
    q: "What is MCP?",
    a: "The Model Context Protocol is an open standard from Anthropic that lets AI agents (Cursor, Claude Desktop, Windsurf, OpenAI Agents) discover and call tools over a uniform JSON-RPC interface. doc2mcp produces fully compliant MCP servers your agents can connect to with a URL + Bearer token.",
  },
  {
    id: "how-it-works",
    q: "How does doc2mcp work?",
    a: "Paste a documentation URL. We crawl the site (Mintlify, Docusaurus, Swagger, GitBook, plain HTML — all supported), preserve code blocks, run an AI understanding pass that detects auth, workflows, and endpoint groups, and generate a hosted MCP server with semantic tools — typically in under 60 seconds.",
  },
  {
    id: "supported-clients",
    q: "Which AI tools are supported?",
    a: "Anything that speaks MCP — Cursor, Claude Desktop, VS Code, Windsurf, OpenAI Agents, Cline, Zed, and the broader MCP client ecosystem. We provide ready-to-paste config snippets for every major client in your project dashboard.",
  },
  {
    id: "private-docs",
    q: "Can I use private documentation?",
    a: "Yes. Pro and Team plans support private projects with authenticated crawling and per-MCP Bearer tokens. Enterprise customers can self-host doc2mcp inside their VPC with SSO, RBAC, and audit logging — your docs and tokens never leave your perimeter.",
  },
  {
    id: "updates",
    q: "How often are docs updated?",
    a: "Free plans run on-demand refreshes. Pro plans auto-resync every 24h, Team plans every 6h, and Enterprise plans support webhook-triggered instant updates. We use content-hash diffing so only changed pages get re-crawled.",
  },
  {
    id: "self-host",
    q: "Can enterprises self-host?",
    a: "Yes. We offer fully self-hosted deployments on AWS, GCP, or Azure with bring-your-own-key encryption, SSO via SAML/OIDC, audit logs, and custom retention policies. Reach out via the contact form to start a security review.",
  },
];

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32"
      id="faq"
      ref={sectionRef}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/8 blur-[120px] dark:bg-violet-500/15" />
      </div>

      <div className="relative mx-auto max-w-[800px] px-6">
        <div className="text-center">
          <span className="text-muted-foreground/60 text-xs font-mono tracking-wider uppercase">
            FAQ
          </span>
          <h2
            className={cn(
              "mt-4 font-display text-2xl font-semibold tracking-tight text-foreground transition-all duration-700 sm:text-4xl",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            Questions, answered.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm max-w-md mx-auto">
            Everything developers and teams ask before generating MCP servers.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-2.5">
          {FAQS.map((faq, i) => {
            const isOpen = openId === faq.id;
            return (
              <div
                className={cn(
                  "overflow-hidden rounded-xl border border-border/50 bg-card/45 backdrop-blur-md transition-all duration-300",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
                  isOpen
                    ? "border-border shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
                    : "hover:border-border/80"
                )}
                key={faq.id}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <button
                  aria-controls={`faq-panel-${faq.id}`}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  type="button"
                >
                  <span className="font-display font-medium text-foreground text-sm sm:text-base">
                    {faq.q}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground/60 transition-transform duration-300",
                      isOpen ? "rotate-180 text-foreground" : "rotate-0"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                  id={`faq-panel-${faq.id}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="px-5 pb-5 text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-muted-foreground text-xs">
          Still curious?{" "}
          <a
            className="font-medium text-foreground underline underline-offset-4 hover:text-[#4285f4] transition-colors"
            href="https://calendly.com/doc2mcp/30min"
            rel="noopener noreferrer"
            target="_blank"
          >
            Talk to the founders →
          </a>
        </p>
      </div>
    </section>
  );
}
