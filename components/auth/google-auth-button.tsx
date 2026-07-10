"use client";

import { useEffect, useState } from "react";
import { LoaderIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  className,
  redirectUrl,
  label = "Continue with Google",
}: {
  className?: string;
  redirectUrl?: string | null;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) {
      setError(decodeURIComponent(message));
    }
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (redirectUrl) {
      params.set("redirectUrl", redirectUrl);
    }
    const query = params.toString();
    window.location.href = query
      ? `/api/auth/google?${query}`
      : "/api/auth/google";
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        className="relative h-11 w-full gap-2.5 rounded-xl border-0 bg-[#4285f4] font-medium text-sm text-white shadow-[0_4px_14px_rgba(66,133,244,0.35)] transition-all hover:opacity-95 active:scale-[0.99] dark:bg-[#8ab4f8] dark:text-[#131314] dark:shadow-[0_4px_14px_rgba(138,180,248,0.25)]"
        disabled={loading}
        onClick={handleGoogleSignIn}
        type="button"
      >
        <GoogleIcon className="size-4" />
        {loading ? "Redirecting to Google…" : label}
        {loading ? (
          <span className="absolute right-4 animate-spin">
            <LoaderIcon />
          </span>
        ) : null}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Secure OAuth · We never see your Google password
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
