import { Code2, Plug, Sparkles, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { LoginForm } from "@/components/auth/login-form";
import { LoginHeroStrip } from "@/components/auth/login-hero-panel";
import { isAdminEmail } from "@/lib/admin/admin-access";

const BENEFITS = [
  { icon: Zap, text: "5 free doc conversions every month" },
  { icon: Code2, text: "Export MCP configs for Cursor, Claude & VS Code" },
  { icon: Plug, text: "Hosted servers — no local setup or API keys to share" },
  { icon: Sparkles, text: "One-click GitHub sign-in" },
] as const;

function LoginHeading() {
  return (
    <div className="mb-8 space-y-5">
      <LoginHeroStrip />

      <div className="space-y-3">
        <p className="inline-flex items-center rounded-full border border-[#4285f4]/25 bg-[#4285f4]/8 px-3 py-1 font-medium text-[#4285f4] text-xs dark:border-[#8ab4f8]/30 dark:bg-[#8ab4f8]/10 dark:text-[#8ab4f8]">
          Free to get started
        </p>
        <h1 className="font-display font-semibold text-2xl tracking-tight sm:text-3xl">
          Welcome to docs4llm
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed sm:text-[15px]">
          Sign in to turn documentation into MCP servers your AI editors can
          call — login once, then convert, connect, and code with real docs
          context.
        </p>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
        {BENEFITS.map(({ icon: Icon, text }) => (
          <li
            className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm"
            key={text}
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#4285f4]/10 text-[#4285f4] dark:bg-[#8ab4f8]/15 dark:text-[#8ab4f8]">
              <Icon className="size-3" strokeWidth={2.25} />
            </span>
            <span className="text-foreground/90">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="h-11 animate-pulse rounded-xl bg-muted/60" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted/40" />
    </div>
  );
}

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string }>;
}) {
  await connection();
  const { redirectUrl } = await searchParams;
  const session = await auth();

  if (session?.user?.email && session.user.type === "regular") {
    if (redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")) {
      redirect(redirectUrl);
    }
    redirect(isAdminEmail(session.user.email) ? "/admin" : "/chat");
  }

  const safeRedirect =
    redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")
      ? redirectUrl
      : null;

  return <LoginForm redirectUrl={safeRedirect} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string }>;
}) {
  return (
    <>
      <LoginHeading />
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginPageContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
