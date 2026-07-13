"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FreePlan = {
  id: "free";
  name: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
};

const FREE_PLAN: FreePlan = {
  id: "free",
  name: "Free",
  tagline: "For trying docs4llm and one-off experiments.",
  features: [
    "Unlimited MCP conversions",
    "Unlimited pages per docs site",
    "Token-based remote MCP (Cursor + Claude)",
    "ask_documentation with AI",
    "Public projects · community support",
  ],
  ctaLabel: "Start free",
};

export function PricingSection({
  detailed = false,
  initiallyAuthenticated = false,
}: {
  detailed?: boolean;
  initiallyAuthenticated?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
    <section className="relative py-20 sm:py-28" id="pricing" ref={sectionRef}>
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-12 text-center sm:mb-16">
          <span className="text-muted-foreground/60 text-xs sm:text-sm font-mono tracking-wider uppercase">
            PRICING PLANS
          </span>
          <h2
            className={cn(
              "mt-4 font-display text-3xl font-semibold tracking-tight text-foreground transition-all duration-700 sm:text-4xl lg:text-5xl",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            )}
          >
            Documentation infrastructure for AI agents.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm max-w-xl mx-auto">
            For developers who want to generate and self-host MCPs — and for
            companies publishing official MCP infrastructure for their customers
            and AI agents. Token-based access, hosted endpoints, and custom
            domains included.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div
            className={cn(
              "relative flex flex-col gap-6 rounded-2xl border border-[#4285f4]/35 dark:border-[#8ab4f8]/35 bg-card/40 p-6 backdrop-blur-xl transition-all duration-500 shadow-[0_0_24px_rgba(66,133,244,0.06)]",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-6 opacity-0"
            )}
          >
            <div>
              <h3 className="font-display font-semibold text-foreground text-xl">
                {FREE_PLAN.name}
              </h3>
              <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                {FREE_PLAN.tagline}
              </p>
            </div>

            <div className="flex items-baseline gap-1 my-2">
              <span className="font-display font-bold text-4xl tracking-tight text-foreground">
                $0
              </span>
              <span className="text-muted-foreground text-xs">/ forever</span>
            </div>

            <ul className="flex flex-1 flex-col gap-2.5 text-xs">
              {FREE_PLAN.features.map((feature) => (
                <li className="flex items-start gap-2.5" key={feature}>
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[#4285f4]" />
                  <span className="text-muted-foreground leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <a
              className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] px-5 font-medium text-xs text-white hover:opacity-90 transition-all duration-300 active:scale-[0.98]"
              href="/register"
            >
              {FREE_PLAN.ctaLabel}
            </a>
          </div>
        </div>

        <p className="mt-12 text-center text-muted-foreground/60 text-[10px] font-mono uppercase tracking-wider">
          Unlimited MCP reads included · Conversions run once per docs portal ·
          Free for hackathon use.
        </p>
      </div>
    </section>
  );
}
