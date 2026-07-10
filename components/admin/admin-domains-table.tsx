"use client";

import { Check, Globe2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminDomainRow = {
  id: string;
  name: string;
  status: string;
  userEmail: string;
  customDomain: string | null;
  customDomainVerified: boolean;
};

export function AdminDomainsTable({ rows }: { rows: AdminDomainRow[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.customDomain ?? ""]))
  );
  const [verified, setVerified] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.customDomainVerified]))
  );

  const save = async (projectId: string) => {
    setSavingId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/domain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: drafts[projectId]?.trim() || null,
          customDomainVerified: verified[projectId] ?? false,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }
      toast.success("Domain updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-border/50 border-b bg-muted/30 text-muted-foreground text-xs">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Custom domain</th>
            <th className="px-4 py-3">Verified</th>
            <th className="px-4 py-3 text-right">Save</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <p className="font-medium">{row.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {row.id.slice(0, 8)}…
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {row.userEmail}
              </td>
              <td className="px-4 py-3 capitalize">{row.status}</td>
              <td className="px-4 py-3">
                <Input
                  className="h-8 font-mono text-xs"
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [row.id]: e.target.value }))
                  }
                  placeholder="mcp.example.com"
                  value={drafts[row.id] ?? ""}
                />
              </td>
              <td className="px-4 py-3">
                <Button
                  className="h-8"
                  onClick={() =>
                    setVerified((v) => ({
                      ...v,
                      [row.id]: !v[row.id],
                    }))
                  }
                  size="sm"
                  type="button"
                  variant={verified[row.id] ? "default" : "outline"}
                >
                  {verified[row.id] ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Globe2 className="size-3.5" />
                  )}
                </Button>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  className="h-8"
                  disabled={savingId === row.id}
                  onClick={() => save(row.id)}
                  size="sm"
                  type="button"
                >
                  {savingId === row.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
