"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AppAuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  type?: "guest" | "regular";
  is_anonymous?: boolean;
};

export function useSupabaseAuth() {
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => null, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user?: AppAuthUser | null }) => {
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setLoading(false);
  }, []);

  return {
    user,
    loading,
    signOut,
    supabase,
  };
}
