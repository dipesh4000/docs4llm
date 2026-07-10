"use client";

import { Trash2 } from "lucide-react";
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

type McpRow = {
  id: string;
  name: string;
  status: string;
  sourceUrl: string | null;
  sourceType: string;
  userEmail: string;
  createdAt: string;
};

export function McpsTable({ rows }: { rows: McpRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete project");
        return;
      }
      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-border/50 border-b bg-muted/30 text-muted-foreground text-xs">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Source URL</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-medium">{row.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.userEmail}
              </td>
              <td className="px-4 py-3 capitalize">{row.status}</td>
              <td className="px-4 py-3 capitalize">{row.sourceType}</td>
              <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                {row.sourceUrl}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={deletingId === row.id}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete MCP project?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes {row.name} and its MCP servers.
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
