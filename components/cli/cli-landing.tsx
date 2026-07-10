"use client";

import {
  ArrowUpRight,
  Check,
  Copy,
  MessageSquare,
  Package,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

const NPM_PACKAGE_URL = "https://www.npmjs.com/package/doc2mcp";
const INSTALL_COMMAND = "npm install -g doc2mcp";

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1600);
      })
      .catch(() => {
        setCopiedKey(null);
      });
  }, []);
  return { copiedKey, copy };
}

function CommandPill({
  command,
  copied,
  onCopy,
}: {
  command: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      aria-label={`Copy ${command}`}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-zinc-950/90 px-4 py-3 text-left transition-colors hover:border-violet-500/40"
      onClick={onCopy}
      type="button"
    >
      <span className="flex items-center gap-2.5 font-mono text-sm text-zinc-100">
        <span className="text-violet-400">$</span>
        {command}
      </span>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-zinc-400 transition-colors group-hover:text-zinc-100">
        {copied ? (
          <Check className="size-3.5 text-emerald-400" strokeWidth={3} />
        ) : (
          <Copy className="size-3.5" />
        )}
      </span>
    </button>
  );
}

const COMMANDS = [
  {
    id: "login",
    command: "doc2mcp login",
    title: "Authenticate",
    desc: "Browser-based login — no API keys to copy around.",
  },
  {
    id: "convert",
    command: "doc2mcp https://docs.stripe.com",
    title: "Convert docs",
    desc: "Point at any docs URL and get a hosted, token-secured MCP.",
  },
  {
    id: "install",
    command: "doc2mcp install <id>",
    title: "Install into editors",
    desc: "Wire the MCP into Cursor, VS Code, Claude, or Windsurf.",
  },
  {
    id: "chat",
    command: "doc2mcp chat https://uagents.fetch.ai/docs",
    title: "Chat in terminal",
    desc: "Paste a docs URL, convert it, then ask questions in the same shell.",
  },
] as const;

const EDITORS = [
  { name: "Cursor", desc: "AI-powered editor" },
  { name: "VS Code", desc: "VS Code + Copilot" },
  { name: "Claude Desktop", desc: "Anthropic Claude" },
  { name: "Windsurf", desc: "Codeium Windsurf" },
  { name: "Cline", desc: "Autonomous coding" },
  { name: "Any MCP client", desc: "Open MCP transport" },
] as const;

export function CliHero() {
  const { copiedKey, copy } = useCopy();
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <a
            className="group inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-[10px] text-violet-700 uppercase tracking-[0.16em] transition-colors hover:bg-violet-500/15 dark:text-violet-300"
            href={NPM_PACKAGE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Package className="size-3" />
            CLI · available on npm
            <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <h1 className="mt-6 font-display font-semibold text-4xl text-foreground tracking-tight sm:text-6xl">
            Turn any docs into an MCP,
            <br />
            <span className="text-muted-foreground">
              right from your terminal.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground leading-relaxed sm:text-lg">
            Paste a documentation URL — Stripe, Anthropic, your own — and
            doc2mcp crawls it into a hosted, token-secured MCP server your
            editor can call. Then chat with it without leaving the shell.
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
            <CommandPill
              command={INSTALL_COMMAND}
              copied={copiedKey === "hero"}
              onCopy={() => copy(INSTALL_COMMAND, "hero")}
            />
            <div className="flex items-center gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 font-medium text-background text-sm transition-opacity hover:opacity-90"
                href="/docs/cli"
              >
                Read the docs
                <ArrowUpRight className="size-3.5" />
              </Link>
              <a
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted/50"
                href={NPM_PACKAGE_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                View on npm
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CliCommands() {
  const { copiedKey, copy } = useCopy();
  return (
    <section className="relative py-20 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
            A handful of commands
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Authenticate, convert any docs site, install into your editor, and
            chat with the result — all from your terminal.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
          {COMMANDS.map((cmd) => (
            <div
              className="rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-violet-500/30"
              key={cmd.id}
            >
              <h3 className="font-display font-semibold text-foreground text-lg">
                {cmd.title}
              </h3>
              <p className="mt-2 mb-4 text-muted-foreground text-sm leading-relaxed">
                {cmd.desc}
              </p>
              <CommandPill
                command={cmd.command}
                copied={copiedKey === cmd.id}
                onCopy={() => copy(cmd.command, cmd.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CliEditors() {
  return (
    <section className="relative border-border/40 border-y bg-muted/20 py-20 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
            Installs into your editor
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            One command wires the MCP into the tools you already use — existing
            config is merged, never overwritten.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
          {EDITORS.map((editor) => (
            <div
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3"
              key={editor.name}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground text-sm">
                  {editor.name}
                </span>
                <span className="block truncate text-muted-foreground text-xs">
                  {editor.desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CliChat() {
  const { copiedKey, copy } = useCopy();
  return (
    <section className="relative py-20 sm:py-28">
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-[10px] text-violet-700 uppercase tracking-[0.16em] dark:text-violet-300">
              <MessageSquare className="size-3" />
              Playground · in your terminal
            </span>
            <h2 className="mt-5 font-display font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
              Chat with your docs,
              <br />
              <span className="text-muted-foreground">
                without the browser.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed">
              Paste a docs URL into{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                doc2mcp chat
              </code>{" "}
              and it converts the site, opens a Claude Code-style loop, and
              answers from your crawled docs with cited sources.
            </p>
            <div className="mt-7 max-w-sm">
              <CommandPill
                command="doc2mcp chat https://uagents.fetch.ai/docs"
                copied={copiedKey === "chat"}
                onCopy={() =>
                  copy("doc2mcp chat https://uagents.fetch.ai/docs", "chat")
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-zinc-950/90 shadow-2xl">
            <div className="flex items-center gap-2 border-white/10 border-b px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-rose-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
              <p className="ml-2 flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 uppercase tracking-[0.18em]">
                <Terminal className="size-3" />
                doc2mcp chat
              </p>
            </div>
            <div className="space-y-2 p-5 font-mono text-[12.5px] leading-relaxed">
              <p className="text-zinc-100">
                <span className="text-violet-400">$</span> doc2mcp chat
                https://uagents.fetch.ai/docs
              </p>
              <p className="text-sky-300/90">→ Converting docs into an MCP…</p>
              <p className="text-emerald-400">✓ Chatting with uagents docs…</p>
              <p className="text-zinc-100">
                <span className="text-emerald-400">you</span> how do I create a
                PaymentIntent?
              </p>
              <p className="text-zinc-300">
                ◆ POST{" "}
                <span className="text-violet-300">/v1/payment_intents</span>{" "}
                with an <span className="text-violet-300">amount</span> and{" "}
                <span className="text-violet-300">currency</span>.
              </p>
              <p className="text-zinc-500">
                Sources: Create a PaymentIntent · stripe.com/docs/api
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
