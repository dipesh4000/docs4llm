import {
  Activity,
  AlertCircle,
  Check,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { McpAccessTokensCard } from "@/components/dashboard/mcp-access-tokens-card";
import { ProfileHero } from "@/components/dashboard/profile-hero";
import { ProfileNameEditor } from "@/components/dashboard/profile-name-editor";
import { SignOutButton } from "@/components/dashboard/settings-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdminEmail } from "@/lib/admin/admin-access";
import {
  getMcpServersByUserId,
  getPlatformProjectsByUserId,
  getUserById,
} from "@/lib/db/queries";

export default async function DashboardProfilePage() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard/profile");
  }

  const userId = session.user.id;
  const email = session.user.email ?? "";

  const [appUser, projects, mcpServers] = await Promise.all([
    getUserById(userId),
    getPlatformProjectsByUserId({ userId }),
    getMcpServersByUserId({ userId }),
  ]);

  const memberSince = appUser?.createdAt ?? new Date();
  const isAdmin = isAdminEmail(email);

  let toolsGenerated = 0;
  for (const server of mcpServers) {
    const tools = (server.tools as unknown[]) ?? [];
    toolsGenerated += Array.isArray(tools) ? tools.length : 0;
  }

  const readyMcps = projects.filter((p) => p.status === "ready").length;
  const failedMcps = projects.filter((p) => p.status === "error").length;
  const totalPages = projects.reduce((sum, p) => {
    const artifacts = p.artifacts as { docsPageCount?: number } | null;
    return sum + (artifacts?.docsPageCount ?? 0);
  }, 0);

  return (
    <div className="space-y-8">
      <ProfileHero
        conversionsUsed={projects.length}
        email={email}
        memberSince={memberSince}
        name={session.user.name ?? appUser?.name ?? null}
        toolsGenerated={toolsGenerated}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-violet-700 dark:text-violet-300" />
              Lifetime activity
            </CardTitle>
            <CardDescription>Your lifetime usage</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-0">
            <Stat label="Conversions" value={projects.length} />
            <Stat label="Ready MCPs" tone="good" value={readyMcps} />
            <Stat label="Failed" tone="bad" value={failedMcps} />
            <Stat label="Pages crawled" value={totalPages.toLocaleString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-violet-700 dark:text-violet-300" />
              Account
            </CardTitle>
            <CardDescription>Identity & permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <Row label="Name">
              <ProfileNameEditor
                fallback={email.split("@")[0] ?? "Add your name"}
                initialName={session.user.name ?? appUser?.name ?? null}
              />
            </Row>
            <Row label="Email">
              <span className="truncate font-mono text-xs">{email}</span>
            </Row>
            <Row label="Verified">
              {appUser?.emailVerified ? (
                <Badge
                  className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  variant="outline"
                >
                  <Check className="size-3" /> Yes
                </Badge>
              ) : (
                <Badge
                  className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  variant="outline"
                >
                  <AlertCircle className="size-3" /> Pending
                </Badge>
              )}
            </Row>
            <Row label="User ID">
              <span className="truncate font-mono text-xs">
                {userId.slice(0, 8)}…
              </span>
            </Row>
            <Row label="Role">
              <Badge
                className={
                  isAdmin
                    ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                    : "bg-muted text-muted-foreground"
                }
                variant="outline"
              >
                {isAdmin ? "Admin" : "Member"}
              </Badge>
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-violet-700 dark:text-violet-300" />
              Plan benefits
            </CardTitle>
            <CardDescription>What your plan unlocks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            <Benefit included label="Unlimited monthly conversions" />
            <Benefit included label="Private projects" />
            <Benefit included label="Unlimited pages per site" />
            <Benefit included label="Automatic re-crawl" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <McpAccessTokensCard />

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Sign out of all sessions on this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "good" | "bad";
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "bad"
        ? "text-red-700 dark:text-red-300"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className={`mt-1 font-display font-semibold text-xl ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-border/30 border-b pb-2 last:border-0 last:pb-0">
      <p className="shrink-0 text-muted-foreground text-xs">{label}</p>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}

function Benefit({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          included
            ? "flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            : "flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        <Check className="size-3" />
      </span>
      <span
        className={
          included ? "text-foreground text-sm" : "text-muted-foreground text-sm"
        }
      >
        {label}
      </span>
    </div>
  );
}
