"use client";

import { GitHubAuthButton } from "@/components/auth/github-auth-button";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  redirectUrl,
}: {
  className?: string;
  redirectUrl?: string | null;
}) {
  return (
    <GitHubAuthButton
      className={cn(className)}
      label="Sign up with GitHub"
      redirectUrl={redirectUrl}
    />
  );
}
