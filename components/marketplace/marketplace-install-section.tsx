"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InstallPanel } from "@/components/marketplace/install-panel";
import { Button } from "@/components/ui/button";
import { buildInstallTargetsFromEndpoint } from "@/lib/marketplace/install";
import { TOKEN_PLACEHOLDER } from "@/lib/marketplace/sanitize";

type Props = {
  endpointUrl: string;
  serverName: string;
};

export function MarketplaceInstallSection({ endpointUrl, serverName }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActiveToken, setHasActiveToken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/user/mcp-tokens");
      if (cancelled) {
        return;
      }
      if (res.status === 401) {
        setIsLoggedIn(false);
        setLoaded(true);
        return;
      }
      setIsLoggedIn(true);
      const data = (await res.json()) as {
        tokens: Array<{ active: boolean }>;
      };
      setHasActiveToken(data.tokens.some((t) => t.active));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const placeholderTargets = useMemo(
    () => buildInstallTargetsFromEndpoint(endpointUrl, serverName),
    [endpointUrl, serverName]
  );

  return (
    <section className="mt-12">
      <h2 className="font-display font-semibold text-foreground text-xl tracking-tight">
        Install
      </h2>
      <p className="mt-1 text-muted-foreground text-sm">
        Marketplace MCPs don&apos;t include the creator&apos;s token. Create
        your own MCP access token on your profile, then use it in the config
        below.
      </p>

      {loaded ? (
        isLoggedIn ? (
          hasActiveToken ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-sm">
                You have an active token. Paste it over{" "}
                <code className="font-mono text-xs">{TOKEN_PLACEHOLDER}</code>{" "}
                in the config, or copy from{" "}
                <Link
                  className="font-medium underline underline-offset-2"
                  href="/dashboard/profile#mcp-access-tokens"
                >
                  Profile
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-sm">
                Create an MCP access token on{" "}
                <Link
                  className="font-medium text-violet-700 underline underline-offset-2 dark:text-violet-300"
                  href="/dashboard/profile#mcp-access-tokens"
                >
                  your profile
                </Link>
                , then replace{" "}
                <code className="font-mono text-xs">{TOKEN_PLACEHOLDER}</code>{" "}
                below.
              </p>
            </div>
          )
        ) : (
          <div className="mt-4 rounded-2xl border border-border/50 bg-card/40 p-5">
            <p className="text-muted-foreground text-sm">
              Sign in and create an MCP access token to install this server.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild className="rounded-full" type="button">
                <Link href="/login?redirectUrl=/dashboard/profile#mcp-access-tokens">
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-full"
                type="button"
                variant="outline"
              >
                <Link href="/dashboard/profile#mcp-access-tokens">
                  Create token
                </Link>
              </Button>
            </div>
          </div>
        )
      ) : (
        <p className="mt-4 text-muted-foreground text-sm">Loading…</p>
      )}

      <div className="mt-5">
        <InstallPanel targets={placeholderTargets} />
      </div>
    </section>
  );
}
