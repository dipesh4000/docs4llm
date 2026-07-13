import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { CustomDomainCard } from "@/components/dashboard/custom-domain-card";
import {
  SignOutButton,
  TeamInviteForm,
} from "@/components/dashboard/settings-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserById } from "@/lib/db/queries";

export default async function DashboardSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard/settings");
  }

  const appUser = await getUserById(session.user.id);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
          Settings
        </p>
        <h1 className="mt-1 font-display font-bold text-3xl tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Manage your profile and team workspace.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Identity used across docs4llm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              label="Email"
              value={session.user.email ?? appUser?.email ?? "—"}
            />
            <Field
              label="Display name"
              value={session.user.name ?? appUser?.name ?? "—"}
            />
            <Field label="User ID" mono value={session.user.id} />
            <Field
              label="Email verified"
              value={appUser?.emailVerified ? "Yes" : "Pending"}
            />
            <div className="pt-3">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Plan
              <Badge variant="secondary">Free</Badge>
            </CardTitle>
            <CardDescription>
              Unlimited conversions for hackathon use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 text-sm">
              <Field label="Status" value="Active" />
              <Field label="Conversions" value="Unlimited" />
              <Field label="Pages per site" value="Unlimited" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TeamInviteForm />

        <Card>
          <CardHeader>
            <CardTitle>API access</CardTitle>
            <CardDescription>
              Each MCP server already has a scoped access token. Project-level
              API keys with full CRUD are coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="rounded-lg border border-border/40 bg-muted/20 p-3 text-muted-foreground text-xs">
              Tip: open any project in <strong>Dashboard → Projects</strong> and
              copy the MCP Bearer token from the Exports tab to integrate with
              Cursor, Claude Desktop, or your own client.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <CustomDomainCard plan="free" />
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-border/30 border-b pb-2 last:border-0 last:pb-0">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p
        className={
          mono
            ? "max-w-[60%] truncate font-mono text-xs"
            : "max-w-[60%] truncate text-right font-medium text-sm capitalize"
        }
      >
        {value}
      </p>
    </div>
  );
}
