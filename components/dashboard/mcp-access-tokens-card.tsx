"use client";

import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type TokenRow = {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  active: boolean;
};

type CreatedToken = {
  id: string;
  name: string;
  plaintext: string;
  createdAt: string;
};

export function McpAccessTokensCard() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Marketplace");
  const [freshToken, setFreshToken] = useState<CreatedToken | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/user/mcp-tokens");
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as { tokens: TokenRow[] };
    setTokens(data.tokens);
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/user/mcp-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as { token: CreatedToken };
      setFreshToken(data.token);
      await loadTokens();
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    await fetch(`/api/user/mcp-tokens/${id}`, { method: "DELETE" });
    setFreshToken(null);
    await loadTokens();
  };

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card id="mcp-access-tokens">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4 text-violet-700 dark:text-violet-300" />
          MCP access tokens
        </CardTitle>
        <CardDescription>
          Create one token on your profile, then use it in any marketplace MCP
          config. Marketplace listings never expose the creator&apos;s token.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name"
            value={name}
          />
          <Button
            className="gap-1.5"
            disabled={creating}
            onClick={handleCreate}
            type="button"
          >
            <Plus className="size-4" />
            Create token
          </Button>
        </div>

        {freshToken ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="font-medium text-emerald-800 text-sm dark:text-emerald-200">
              Copy this token now — it won&apos;t be shown again.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-background/80 px-2 py-1 font-mono text-xs">
                {freshToken.plaintext}
              </code>
              <Button
                onClick={() => handleCopy(freshToken.plaintext)}
                size="sm"
                type="button"
                variant="outline"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              Use in Cursor:{" "}
              <code className="font-mono">{`"Authorization": "Bearer ${freshToken.plaintext}"`}</code>
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          {tokens.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tokens yet. Create one to install marketplace MCPs.
            </p>
          ) : (
            tokens.map((token) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                key={token.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{token.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {token.active ? "Active" : "Revoked"} · created{" "}
                    {new Date(token.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {token.active ? (
                  <Button
                    onClick={() => handleRevoke(token.id)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>

        <p className="text-muted-foreground text-xs">
          Browse the{" "}
          <Link className="underline underline-offset-2" href="/marketplace">
            marketplace
          </Link>
          , copy the MCP endpoint, and paste your token in the Authorization
          header.
        </p>
      </CardContent>
    </Card>
  );
}
