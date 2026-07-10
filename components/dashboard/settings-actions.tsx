"use client";

import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export function ManageBillingButton({
  hasSubscription,
}: {
  hasSubscription: boolean;
}) {
  if (!hasSubscription) {
    return (
      <Button asChild type="button">
        <Link href="/pricing">Pick a plan</Link>
      </Button>
    );
  }
  return (
    <Button asChild type="button">
      <Link href="/pricing">Renew or change plan</Link>
    </Button>
  );
}

export function TeamInviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/teams/invite");
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as {
      team?: { name?: string };
      invites?: InviteRow[];
    };
    setTeamName(data.team?.name ?? null);
    setInvites(data.invites ?? []);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const onInvite = async () => {
    setLoading(true);
    setLastAcceptUrl(null);
    try {
      const res = await fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        acceptUrl?: string;
        note?: string;
      };
      if (!res.ok) {
        toast.error(body.message ?? "Could not create invite");
        return;
      }
      toast.success(body.note ?? "Invite created");
      setLastAcceptUrl(body.acceptUrl ?? null);
      setEmail("");
      await load();
    } catch {
      toast.error("Could not create invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users aria-hidden="true" className="size-4" />
          Team workspace
        </CardTitle>
        <CardDescription>
          Create a pending invite for {teamName ?? "your workspace"}. Email
          delivery is not enabled yet — you will get a shareable accept link to
          copy and send yourself.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-muted-foreground text-xs leading-relaxed">
          <p className="font-medium text-foreground text-sm">Preview invite</p>
          <p className="mt-1">
            Step 1: enter a teammate email. Step 2: copy the accept link we
            generate. Step 3: share it manually (Slack/email). Accept flow lands
            on Settings.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label="Teammate email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            type="email"
            value={email}
          />
          <Button
            disabled={loading || !email.trim()}
            onClick={onInvite}
            type="button"
          >
            {loading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : null}
            Create invite link
          </Button>
        </div>
        {lastAcceptUrl ? (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs">
            <p className="font-medium text-foreground text-sm">
              Accept link ready — copy and share
            </p>
            <p className="mt-1 break-all font-mono text-muted-foreground">
              {lastAcceptUrl}
            </p>
            <Button
              className="mt-2 h-8"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lastAcceptUrl);
                  toast.success("Accept link copied");
                } catch {
                  toast.error("Could not copy — select the link manually");
                }
              }}
              type="button"
              variant="outline"
            >
              Copy link
            </Button>
          </div>
        ) : null}
        {invites.length > 0 ? (
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                key={invite.id}
              >
                <span className="truncate">{invite.email}</span>
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  {invite.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No pending invites yet.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground text-xs">
          Automated email invites ship later. Until then, treat the accept link
          like a password — only share with people you trust.
        </p>
      </CardFooter>
    </Card>
  );
}

export function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(
        () => undefined
      );
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <Button
      disabled={signingOut}
      onClick={handleSignOut}
      type="button"
      variant="outline"
    >
      {signingOut ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : null}
      Sign out
    </Button>
  );
}
