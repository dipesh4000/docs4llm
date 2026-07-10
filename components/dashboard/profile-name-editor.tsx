"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_NAME_LENGTH = 80;

/**
 * Inline display-name editor for the dashboard Account card.
 *
 * - Shows the current name as a read-only row by default.
 * - Click the pencil to enter edit mode, save with Enter (or button),
 *   cancel with Escape (or button).
 * - PATCHes /api/user/profile, then refreshes server data so the header
 *   avatar / hero card pick up the new name on the same render pass.
 */
export function ProfileNameEditor({
  initialName,
  fallback,
}: {
  initialName: string | null;
  fallback: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialName ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const trimmed = value.trim();
  const dirty = trimmed !== (name ?? "");

  const handleSave = async () => {
    if (submitting) {
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      toast.error(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
      return;
    }
    if (!dirty) {
      setEditing(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        name?: string | null;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update name");
        return;
      }
      const nextName = data.name ?? null;
      setName(nextName ?? "");
      setValue(nextName ?? "");
      setEditing(false);
      toast.success("Name updated");
      router.refresh();
    } catch {
      toast.error("Network error updating name");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setValue(name ?? "");
    setEditing(false);
  };

  if (!editing) {
    const display = name?.trim() || fallback;
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm">{display}</span>
        <Button
          aria-label="Edit name"
          className="size-7"
          onClick={() => setEditing(true)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave().catch(() => toast.error("Network error updating name"));
      }}
    >
      <Input
        className="h-8 flex-1 text-sm"
        disabled={submitting}
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            handleCancel();
          }
        }}
        placeholder="Your display name"
        ref={inputRef}
        value={value}
      />
      <Button
        aria-label="Save name"
        className="size-7 text-emerald-300 hover:text-emerald-200"
        disabled={submitting || !dirty}
        size="icon"
        type="submit"
        variant="ghost"
      >
        {submitting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
      </Button>
      <Button
        aria-label="Cancel"
        className="size-7"
        disabled={submitting}
        onClick={handleCancel}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X className="size-3.5" />
      </Button>
    </form>
  );
}
