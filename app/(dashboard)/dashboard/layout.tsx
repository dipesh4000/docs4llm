import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageSkeleton } from "@/components/ui/page-skeleton";

function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-border/50 border-r bg-card/30 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-border/50 border-b px-5">
          <div className="size-7 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="flex-1 space-y-3 px-3 py-4">
          <div className="h-9 animate-pulse rounded-lg bg-violet-500/10" />
          <div className="h-8 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-8 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-8 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-8 animate-pulse rounded-lg bg-muted/30" />
        </div>
        <div className="border-border/50 border-t p-4">
          <div className="h-12 animate-pulse rounded-lg bg-muted/30" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-border/50 border-b bg-background/80 px-6 md:hidden">
          <div className="h-5 w-28 animate-pulse rounded bg-muted/50" />
          <div className="h-9 w-20 animate-pulse rounded bg-muted/40" />
        </header>
        <main className="flex-1 p-6 lg:p-10">
          <PageSkeleton />
        </main>
      </div>
    </div>
  );
}

async function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard");
  }

  if (session.user.type === "guest") {
    redirect("/login?redirectUrl=/dashboard");
  }

  return (
    <DashboardShell planLabel="Free" userEmail={session.user.email ?? ""}>
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
