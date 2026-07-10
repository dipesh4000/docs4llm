/**
 * "Custom domain" card surfaced on the Settings page.
 */

"use client";

import { Check, Copy, Globe2, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  plan: string;
};

const REQUIRED_PLANS = new Set(["team", "enterprise"]);
const TARGET_HOST = "cname.doc2mcp.app";

const DNS_RECORDS = [
  {
    type: "CNAME",
    host: "mcp",
    value: TARGET_HOST,
    note: "Routes mcp.your-domain.com to doc2mcp's edge.",
  },
  {
    type: "TXT",
    host: "_doc2mcp",
    value: "doc2mcp-verify=<paste-from-support>",
    note: "One-time verification record we email after you request setup.",
  },
] as const;

export function CustomDomainCard({ plan }: Props) {
  const isEligible = REQUIRED_PLANS.has(plan);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, label: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(label);
        toast.success(`${label} copied`);
        setTimeout(() => setCopied(null), 1500);
      })
      .catch(() => {
        toast.error("Could not copy. Long-press to select instead.");
      });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe2 aria-hidden="true" className="size-4 text-foreground/80" />
          Custom domain
          <Badge variant={isEligible ? "default" : "secondary"}>
            {isEligible ? "Available on your plan" : "Team / Enterprise"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Serve your MCP from{" "}
          <code className="font-mono text-foreground">mcp.your-domain.com</code>{" "}
          instead of the default hostname.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="space-y-3">
          <Step n={1} title="Pick a hostname">
            We recommend{" "}
            <code className="font-mono text-foreground">
              mcp.your-domain.com
            </code>
            .
          </Step>
          <Step n={2} title="Add DNS records">
            <div className="mt-2 grid gap-2">
              {DNS_RECORDS.map((rec) => (
                <div
                  className="overflow-hidden rounded-xl border border-border/60 bg-muted/20"
                  key={`${rec.type}-${rec.host}`}
                >
                  <div className="grid gap-2 px-3 py-2.5 text-xs sm:grid-cols-[80px_1fr_auto] sm:items-center">
                    <span className="font-mono text-muted-foreground uppercase">
                      {rec.type}
                    </span>
                    <code className="truncate font-mono text-foreground">
                      <span className="text-muted-foreground">{rec.host}.</span>
                      your-domain.com → {rec.value}
                    </code>
                    <Button
                      className="h-7 px-2 text-xs"
                      onClick={() => copy(rec.value, `${rec.type} value`)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {copied === `${rec.type} value` ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span className="ml-1 hidden sm:inline">Copy</span>
                    </Button>
                  </div>
                  <p className="border-border/40 border-t bg-background/30 px-3 py-2 text-[11px] text-muted-foreground">
                    {rec.note}
                  </p>
                </div>
              ))}
            </div>
          </Step>
          <Step n={3} title="Request attachment">
            After DNS propagates, request setup or ask an admin to attach the
            domain at <code className="font-mono">/admin/domains</code>.
          </Step>
          <Step n={4} title="Update MCP config">
            Swap the host in <code className="font-mono">mcp.json</code>. Bearer
            token stays the same. See{" "}
            <a className="underline" href="/docs/custom-domains">
              custom domains docs
            </a>
            .
          </Step>
        </ol>

        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <div className="flex items-start gap-2">
            <Lock
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-foreground/80"
            />
            <p className="text-foreground/85 text-sm">
              {isEligible
                ? "Add DNS records, then request attachment."
                : "Upgrade to Team or Enterprise for custom domains."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" type="button" variant="outline">
              <a href="/contact?topic=Partnership%20%2F%20press&prefill=custom-domain">
                <Sparkles aria-hidden="true" className="mr-1.5 size-3.5" />
                Request setup
              </a>
            </Button>
            <Button asChild size="sm" type="button" variant="ghost">
              <a href="/docs/custom-domains">Docs</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 font-mono text-[11px] text-foreground/80">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display font-semibold text-sm">{title}</p>
        <div className="text-muted-foreground text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </li>
  );
}
