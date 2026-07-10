"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSupabaseAuth } from "@/lib/supabase/auth";

function ChatLoadingShimmer() {
  return (
    <output className="flex h-dvh w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <p className="text-muted-foreground text-sm">Loading chat…</p>
      </div>
    </output>
  );
}

/**
 * Chat requires a real (signed-in) account. Visitors who are not logged in are
 * sent to the login page — there is no guest mode.
 */
export function ChatRouteGuard({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter();
  const { user, loading } = useSupabaseAuth();
  const redirected = useRef(false);

  const isAuthed = Boolean(user && user.type !== "guest");

  useEffect(() => {
    if (loading || isAuthed || redirected.current) {
      return;
    }

    redirected.current = true;
    router.replace(`/login?redirectUrl=${encodeURIComponent(redirectUrl)}`);
  }, [loading, isAuthed, redirectUrl, router]);

  if (loading || !isAuthed) {
    return <ChatLoadingShimmer />;
  }

  return null;
}
