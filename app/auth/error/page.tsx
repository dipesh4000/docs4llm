"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ParsedError = {
  error?: string;
  errorCode?: string;
  errorDescription?: string;
};

function parseHashFragment(hash: string): ParsedError {
  if (!hash || hash === "#") {
    return {};
  }
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    error: params.get("error") ?? undefined,
    errorCode: params.get("error_code") ?? undefined,
    errorDescription: params.get("error_description") ?? undefined,
  };
}

function categorize(parsed: ParsedError): {
  title: string;
  message: string;
  canResend: boolean;
} {
  const code = parsed.errorCode?.toLowerCase() ?? "";
  const desc = parsed.errorDescription?.toLowerCase() ?? "";

  if (code.includes("otp_expired") || desc.includes("expired")) {
    return {
      title: "Your link expired",
      message:
        "Confirmation links expire after a short time for security. Enter your email below and we'll send you a fresh one.",
      canResend: true,
    };
  }
  if (
    code === "access_denied" ||
    desc.includes("invalid") ||
    desc.includes("not found")
  ) {
    return {
      title: "Link is no longer valid",
      message:
        "This confirmation link can't be used. It may have already been used or revoked. Request a new one below.",
      canResend: true,
    };
  }
  if (parsed.error === "Missing confirmation token") {
    return {
      title: "Confirmation token missing",
      message:
        "We couldn't find a valid token in this URL. Request a new confirmation email below.",
      canResend: true,
    };
  }
  return {
    title: "Something went wrong",
    message:
      parsed.errorDescription ??
      parsed.error ??
      "An unspecified authentication error occurred.",
    canResend: false,
  };
}

function ErrorContent() {
  const searchParams = useSearchParams();
  const [parsed, setParsed] = useState<ParsedError>({
    error: searchParams.get("error") ?? undefined,
  });
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sent" | "error" | "rate_limited"
  >("idle");
  const [resendError, setResendError] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const fromHash = parseHashFragment(window.location.hash);
    if (fromHash.error || fromHash.errorCode || fromHash.errorDescription) {
      setParsed((prev) => ({ ...prev, ...fromHash }));
    }
  }, []);

  const category = categorize(parsed);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      return;
    }
    setResending(true);
    setResendStatus("idle");
    setResendError("");
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendStatus("sent");
        return;
      }
      if (res.status === 429) {
        setResendStatus("rate_limited");
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setResendError(json.error ?? "Failed to send confirmation email.");
      setResendStatus("error");
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Network error");
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border/40 bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            {category.title}
          </h1>
          <p className="text-muted-foreground text-sm">{category.message}</p>
          {parsed.errorCode && (
            <p className="font-mono text-muted-foreground/70 text-xs">
              code: {parsed.errorCode}
            </p>
          )}
        </div>

        {category.canResend && (
          <form className="space-y-3" onSubmit={handleResend}>
            <div className="space-y-1.5">
              <Label htmlFor="resend-email">Email address</Label>
              <Input
                disabled={resending || resendStatus === "sent"}
                id="resend-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                type="email"
                value={email}
              />
            </div>
            <Button
              className="w-full"
              disabled={resending || resendStatus === "sent" || !email}
              type="submit"
            >
              {resending
                ? "Sending..."
                : resendStatus === "sent"
                  ? "Check your inbox"
                  : "Send new confirmation link"}
            </Button>
            {resendStatus === "sent" && (
              <p className="text-emerald-600 text-sm">
                Confirmation email sent. Check your inbox (and spam folder).
              </p>
            )}
            {resendStatus === "rate_limited" && (
              <p className="text-amber-600 text-sm">
                Too many requests. Please wait a minute before trying again.
              </p>
            )}
            {resendStatus === "error" && (
              <p className="text-destructive text-sm">{resendError}</p>
            )}
          </form>
        )}

        <div className="flex items-center justify-between border-border/40 border-t pt-4 text-sm">
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/login"
          >
            Back to login
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<p className="p-8 text-muted-foreground">Loading...</p>}
    >
      <ErrorContent />
    </Suspense>
  );
}
