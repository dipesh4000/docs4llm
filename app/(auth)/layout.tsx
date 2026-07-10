import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { LoginHeroPanel } from "@/components/auth/login-hero-panel";
import { Doc2McpLogo } from "@/components/doc2mcp/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <div className="relative flex flex-col bg-background px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(66,133,244,0.12),transparent)] lg:hidden"
        />

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 lg:max-w-lg lg:py-10">
          <Link
            className="mb-8 inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            href="/"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to doc2mcp
          </Link>

          <Link className="mb-8 inline-flex w-fit lg:hidden" href="/">
            <Doc2McpLogo size={32} />
          </Link>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>

          <p className="mt-8 text-center text-muted-foreground text-xs leading-relaxed lg:text-left">
            By continuing you agree to our{" "}
            <Link
              className="underline underline-offset-2 hover:text-foreground"
              href="/terms-and-conditions"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              className="underline underline-offset-2 hover:text-foreground"
              href="/privacy-policy"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <LoginHeroPanel />
    </div>
  );
}
