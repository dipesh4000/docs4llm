"use client";

import { Check, Copy, Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { InstallTargets } from "@/lib/marketplace/install";

function CopyConfigButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-foreground/5 px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-400" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

function BrandIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-foreground/5">
      <Image
        alt={alt}
        className="size-5 dark:invert"
        height={20}
        src={src}
        width={20}
      />
    </span>
  );
}

/**
 * One-click install panel for the conversion dashboard. Mirrors the
 * marketplace install experience: real Cursor / VS Code brand marks plus
 * deeplink buttons that open the editor and add the MCP server directly.
 */
export function InstallButtons({ targets }: { targets: InstallTargets }) {
  return (
    <section className="glass-card rounded-2xl border border-border/60 bg-foreground/[0.03] p-6">
      <div className="flex items-center gap-2">
        <Download className="size-4 text-violet-500 dark:text-violet-300" />
        <h2 className="font-display font-semibold text-xl text-foreground">
          Install in your editor
        </h2>
      </div>
      <p className="mt-1 text-muted-foreground text-sm">
        One click adds this MCP server to Cursor or VS Code — no manual config.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Cursor */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-foreground/[0.02] p-5">
          <div className="flex items-center gap-3">
            <BrandIcon alt="Cursor" src="/icons/tools/cursor.svg" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">Cursor</h3>
              <p className="text-[12px] text-muted-foreground">
                Opens Cursor → adds to Settings → MCP
              </p>
            </div>
          </div>

          <Button
            asChild
            className="h-10 w-full gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            <a href={targets.cursorDeeplink}>
              <Download className="size-4" />
              Install in Cursor
            </a>
          </Button>

          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[12px] text-muted-foreground">
              Or paste into{" "}
              <code className="font-mono">~/.cursor/mcp.json</code>
            </span>
            <CopyConfigButton label="Copy" value={targets.cursorConfigJson} />
          </div>
        </div>

        {/* VS Code */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-foreground/[0.02] p-5">
          <div className="flex items-center gap-3">
            <BrandIcon alt="VS Code" src="/icons/tools/visualstudiocode.svg" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">VS Code</h3>
              <p className="text-[12px] text-muted-foreground">
                Opens the VS Code MCP install prompt
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              asChild
              className="h-10 flex-1 gap-1.5 rounded-full bg-[#0098FF] text-white hover:bg-[#0098FF]/90"
            >
              <a href={targets.vscodeDeeplink}>
                <Download className="size-4" />
                Install in VS Code
              </a>
            </Button>
            <Button
              asChild
              className="h-10 flex-1 gap-1.5 rounded-full border-border"
              variant="outline"
            >
              <a href={targets.vscodeInsidersDeeplink}>Insiders</a>
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[12px] text-muted-foreground">
              Or paste into <code className="font-mono">.vscode/mcp.json</code>
            </span>
            <CopyConfigButton label="Copy" value={targets.vscodeConfigJson} />
          </div>
        </div>
      </div>
    </section>
  );
}
