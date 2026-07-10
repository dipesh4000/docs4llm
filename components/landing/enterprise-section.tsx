"use client";

import {
  Activity,
  Building2,
  Cog,
  Database,
  KeyRound,
  type Lock,
  ShieldCheck,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EnterpriseFeature = {
  id: string;
  title: string;
  body: string;
  icon: typeof Lock;
};

const FEATURES: EnterpriseFeature[] = [
  {
    id: "self_hosted",
    title: "Self Hosted",
    body: "Deploy doc2mcp inside your own VPC. Your docs and your generated MCP servers never leave your perimeter.",
    icon: Building2,
  },
  {
    id: "private",
    title: "Private Deployments",
    body: "Single-tenant infrastructure on AWS, GCP, or Azure with bring-your-own-key encryption for every artifact.",
    icon: Database,
  },
  {
    id: "access",
    title: "Access Control",
    body: "SSO via SAML / OIDC, RBAC for projects + workspaces, and short-lived MCP tokens scoped to a specific team.",
    icon: KeyRound,
  },
  {
    id: "audit",
    title: "Audit Logs",
    body: "Every MCP query is logged with actor, tool, and document context — exportable to Datadog, Splunk, or S3.",
    icon: Activity,
  },
  {
    id: "team",
    title: "Team Workspaces",
    body: "Organize projects by team, share MCP servers across squads, and bill at the org level — no per-seat surprises.",
    icon: Users2,
  },
  {
    id: "pipelines",
    title: "Custom Pipelines",
    body: "Bring your own crawler, embedder, or post-processing step via webhook — doc2mcp orchestrates the rest.",
    icon: Cog,
  },
  {
    id: "analytics",
    title: "Usage Analytics",
    body: "See which tools your agents actually call, which docs are hot, and where retrieval quality is degrading.",
    icon: Activity,
  },
  {
    id: "security",
    title: "Enterprise Security",
    body: "SOC 2-ready controls, signed MCP token rotation, prompt-injection guards, and per-project secret isolation.",
    icon: ShieldCheck,
  },
];

export function EnterpriseSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative overflow-hidden border-border/40 border-y bg-gradient-to-b from-background via-background to-muted/10 py-20 sm:py-28 lg:py-32"
      id="enterprise"
      ref={sectionRef}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, currentColor 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-[10px] text-violet-700 uppercase tracking-[0.16em] dark:text-violet-300">
              <ShieldCheck className="size-3" />
              Enterprise
            </span>
            <h2
              className={cn(
                "mt-5 font-display text-3xl tracking-tight transition-all duration-700 sm:text-5xl lg:text-6xl",
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              )}
            >
              Enterprise-ready
              <br />
              <span className="text-[#4285f4] dark:text-[#8ab4f8] font-semibold">
                AI infrastructure.
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-base text-muted-foreground leading-relaxed sm:text-lg">
              The same MCP layer your engineers love — hardened with the
              controls, audit trails, and deployment options enterprise teams
              require.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button asChild className="h-11 rounded-full px-6" size="lg">
              <a
                href="https://calendly.com/doc2mcp/30min"
                rel="noopener noreferrer"
                target="_blank"
              >
                Talk to founders
              </a>
            </Button>
            <Button
              asChild
              className="h-11 rounded-full px-6"
              size="lg"
              variant="outline"
            >
              <Link href="/contact?topic=security">Security overview</Link>
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 grid grid-cols-1 gap-4 transition-all duration-700 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl transition-all hover:border-border hover:bg-card/60 sm:p-6"
                key={f.id}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-foreground/80 backdrop-blur">
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-4 font-display font-semibold text-base sm:text-lg">
                  {f.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {f.body}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-6">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            SOC 2 in progress
          </p>
          <span aria-hidden="true" className="hidden text-border sm:inline">
            ·
          </span>
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            GDPR-ready data handling
          </p>
          <span aria-hidden="true" className="hidden text-border sm:inline">
            ·
          </span>
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            EU + US regions
          </p>
        </div>
      </div>
    </section>
  );
}
