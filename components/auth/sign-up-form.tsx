"use client";

import { GitHubAuthButton } from "@/components/auth/github-auth-button";
import { cn } from "@/lib/utils";

export function SignUpForm({ className }: { className?: string }) {
  return (
    <GitHubAuthButton className={cn(className)} label="Continue with GitHub" />
  );
}
