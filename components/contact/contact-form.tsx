"use client";

import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  "General question",
  "Sales / pricing",
  "Refund or billing",
  "Bug report",
  "Feature request",
  "Partnership / press",
  "Other",
] as const;

const MAX_MESSAGE = 4000;

type ContactResponse = { ok?: boolean; error?: string };

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [messageLength, setMessageLength] = useState(0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      orderId: String(data.get("orderId") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
      // honeypot — should remain empty for real users
      website: String(data.get("website") ?? "").trim(),
    };

    if (!(payload.name && payload.email && payload.message)) {
      toast.error("Name, email, and message are required.");
      return;
    }

    setPending(true);
    const t = toast.loading("Sending your message…");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as ContactResponse;
      if (!(res.ok && body.ok)) {
        toast.error(body.error ?? "Could not send your message.", { id: t });
        return;
      }
      toast.success("Thanks — we'll get back within 1 business day.", {
        id: t,
      });
      form.reset();
      setMessageLength(0);
      setDone(true);
    } catch {
      toast.error("Network error. Please try again.", { id: t });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-sky-500/5 p-8 backdrop-blur-xl sm:p-10">
        <div className="pointer-events-none absolute top-0 right-0 size-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="size-6" strokeWidth={2.25} />
          </span>
          <h3 className="mt-5 font-display font-semibold text-2xl tracking-tight sm:text-3xl">
            Message received.
          </h3>
          <p className="mt-2 max-w-md text-muted-foreground text-sm leading-relaxed sm:text-base">
            We reply to most enquiries within 1 business day. Check your inbox
            (and spam folder, just in case) for our response.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="rounded-full"
              onClick={() => setDone(false)}
              size="sm"
              type="button"
              variant="outline"
            >
              Send another
            </Button>
            <Button asChild className="rounded-full" size="sm" type="button">
              <a
                href="https://calendly.com/doc2mcp/30min"
                rel="noopener noreferrer"
                target="_blank"
              >
                Book a 30-min call →
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl sm:p-8 lg:p-10"
      onSubmit={onSubmit}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-violet-500/8 blur-3xl"
      />
      <div className="relative">
        <div className="mb-6 flex items-center gap-2.5 sm:mb-8">
          <span className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 backdrop-blur">
            <MessageSquare className="size-4 text-foreground/80" />
          </span>
          <div>
            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
              Send a message
            </p>
            <p className="text-foreground/70 text-xs">
              Encrypted in transit. No marketing list — promise.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" name="name" required>
            <input
              autoComplete="name"
              className={inputCls}
              id="name"
              name="name"
              placeholder="Ada Lovelace"
              required
              type="text"
            />
          </Field>
          <Field label="Email" name="email" required>
            <input
              autoComplete="email"
              className={inputCls}
              id="email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Topic" name="subject">
            <div className="relative">
              <select
                className={cn(inputCls, "appearance-none pr-9")}
                defaultValue={SUBJECTS[0]}
                id="subject"
                name="subject"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 size-4 text-muted-foreground"
              />
            </div>
          </Field>
        </div>

        <div className="mt-5">
          <Field
            hint={`${messageLength}/${MAX_MESSAGE}`}
            label="Message"
            name="message"
            required
          >
            <textarea
              className={cn(inputCls, "min-h-40 resize-y leading-relaxed")}
              id="message"
              maxLength={MAX_MESSAGE}
              name="message"
              onChange={(e) => setMessageLength(e.target.value.length)}
              placeholder="Tell us what you're building, what's blocking you, or what you'd like to change."
              required
            />
          </Field>
        </div>

        {/* Honeypot — hidden field; bots tend to fill every input. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="website">Website</label>
          <input
            autoComplete="off"
            id="website"
            name="website"
            tabIndex={-1}
            type="text"
          />
        </div>

        <div className="mt-7 flex flex-col-reverse gap-4 border-border/40 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Sparkles aria-hidden="true" className="size-3 text-violet-500" />
            Replies within 1 business day · refunds within 7 days
          </p>
          <Button
            className="group h-11 w-full rounded-full px-6 sm:w-auto"
            disabled={pending}
            size="lg"
            type="submit"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 size-4 transition-transform group-hover:translate-x-0.5" />
                Send message
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 hover:border-border focus:border-violet-500/60 focus:bg-background focus:ring-2 focus:ring-violet-500/20";

function Field({
  label,
  name,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={name}>
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
          {label}
          {required ? <span className="ml-1 text-violet-500">*</span> : null}
        </span>
        {hint ? (
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
