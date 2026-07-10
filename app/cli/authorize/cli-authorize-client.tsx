"use client";

import { Terminal } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type ApproveCliAuthState, approveCliAuth } from "./actions";

const initialState: ApproveCliAuthState = { status: "idle" };

export function CliAuthorizeForm({ userCode }: { userCode: string }) {
  const [state, formAction, pending] = useActionState(
    approveCliAuth,
    initialState
  );

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="font-medium text-emerald-700 dark:text-emerald-300">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input name="userCode" type="hidden" value={userCode} />
      <div className="rounded-xl border bg-muted/40 p-4 text-center">
        <p className="text-muted-foreground text-sm">Authorization code</p>
        <p className="mt-1 font-mono font-semibold text-2xl tracking-widest">
          {userCode}
        </p>
      </div>
      {state.status === "error" && state.message ? (
        <p className="text-destructive text-sm">{state.message}</p>
      ) : null}
      <Button disabled={pending} size="lg" type="submit">
        {pending ? "Authorizing…" : "Approve CLI access"}
      </Button>
    </form>
  );
}

export function CliAuthorizeShell({ userCode }: { userCode: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Terminal aria-hidden="true" className="size-6" />
        </div>
        <h1 className="font-semibold text-2xl tracking-tight">
          Authorize doc2mcp CLI
        </h1>
        <p className="text-muted-foreground text-sm">
          Approve access so your terminal can generate and install MCP servers
          on your account.
        </p>
      </div>
      <CliAuthorizeForm userCode={userCode} />
    </div>
  );
}
