"use client";

import { Ban, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  disabled: boolean;
  plan: string;
  subscriptionStatus: string | null;
  periodEnd: string | null;
  projectCount: number;
  createdAt: string;
};

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDisable = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/disable`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Failed to disable user");
        return;
      }
      toast.success("User disabled");
      router.refresh();
    } catch {
      toast.error("Failed to disable user");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Failed to delete user");
        return;
      }
      toast.success("User deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-border/50 border-b bg-muted/30 text-muted-foreground text-xs">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Period end</th>
            <th className="px-4 py-3">Projects</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => (
            <tr
              className={row.disabled ? "opacity-50" : undefined}
              key={row.id}
            >
              <td className="px-4 py-3">
                <div className="font-medium">{row.email}</div>
                {row.disabled ? (
                  <span className="text-destructive text-xs">Disabled</span>
                ) : null}
              </td>
              <td className="px-4 py-3 capitalize">{row.plan}</td>
              <td className="px-4 py-3">{row.subscriptionStatus ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.periodEnd
                  ? new Date(row.periodEnd).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3">{row.projectCount}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(row.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    disabled={busyId === row.id || row.disabled}
                    onClick={() => handleDisable(row.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Ban className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={busyId === row.id}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Permanently removes {row.email} and all their data.
                          Active subscriptions must be canceled first.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel type="button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(row.id)}
                          type="button"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
