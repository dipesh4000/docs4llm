"use client";

import { Check, Copy, Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { InstallTargets } from "@/lib/marketplace/install";

function CopyButton({ value, label }: { value: string; label: string }) {
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
      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
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

function ConfigBlock({ json }: { json: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-background/60">
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11.5px] text-foreground/85 leading-relaxed">
        <code>{json}</code>
      </pre>
    </div>
  );
}

function BrandIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-background">
      <Image
        alt={alt}
        className="size-4 dark:invert"
        height={16}
        src={src}
        width={16}
      />
    </span>
  );
}

export function InstallPanel({ targets }: { targets: InstallTargets }) {
  return (
    <section className="mt-12">
      <h2 className="font-display font-semibold text-foreground text-xl tracking-tight">
        Install
      </h2>
      <p className="mt-1 text-muted-foreground text-sm">
        One click adds this MCP server to your editor. Works with Cursor and VS
        Code.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Cursor */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/40 p-5">
          <div className="flex items-center gap-3">
            <BrandIcon alt="Cursor" src="/icons/tools/cursor.svg" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">Cursor</h3>
              <p className="text-[12px] text-muted-foreground">
                Adds to Settings → MCP
              </p>
            </div>
          </div>

          <Button asChild className="group h-10 w-full gap-1.5 rounded-full">
            <a href={targets.cursorDeeplink}>
              <Download className="size-4" />
              Install in Cursor
            </a>
          </Button>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">
              Or paste into{" "}
              <code className="font-mono">~/.cursor/mcp.json</code>
            </span>
            <CopyButton label="Copy config" value={targets.cursorConfigJson} />
          </div>
          <ConfigBlock json={targets.cursorConfigJson} />
        </div>

        {/* VS Code */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/40 p-5">
          <div className="flex items-center gap-3">
            <BrandIcon alt="VS Code" src="/icons/tools/visualstudiocode.svg" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">VS Code</h3>
              <p className="text-[12px] text-muted-foreground">
                Opens the MCP install prompt
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="h-10 flex-1 gap-1.5 rounded-full">
              <a href={targets.vscodeDeeplink}>
                <Download className="size-4" />
                Install in VS Code
              </a>
            </Button>
            <Button
              asChild
              className="h-10 flex-1 gap-1.5 rounded-full"
              variant="outline"
            >
              <a href={targets.vscodeInsidersDeeplink}>Insiders</a>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">
              Or paste into <code className="font-mono">.vscode/mcp.json</code>
            </span>
            <CopyButton label="Copy config" value={targets.vscodeConfigJson} />
          </div>
          <ConfigBlock json={targets.vscodeConfigJson} />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-muted-foreground">
        Endpoint:{" "}
        <code className="font-mono text-foreground/80">
          {targets.endpointUrl}
        </code>
      </p>
    </section>
  );
}
