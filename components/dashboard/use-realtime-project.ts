"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { PlatformProject } from "@/lib/db/schema";

async function fetchProject(id: string): Promise<PlatformProject | null> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { project?: PlatformProject };
  return data.project ?? null;
}

/**
 * Combines:
 *   1. Initial server-rendered project state (no flash).
 *   2. SWR polling fallback every 2.5s when the project is still processing.
 *   3. Polling through the authenticated API so secret fields stay server-side.
 *
 * We intentionally avoid direct Supabase Realtime here because raw row payloads
 * include generated MCP tokens. The API response redacts those fields before
 * they can appear in the browser network panel.
 */
export function useRealtimeProject(initial: PlatformProject) {
  const [project, setProject] = useState<PlatformProject>(initial);
  const isProcessing = !(
    project.status === "ready" || project.status === "error"
  );

  const { data: polled } = useSWR(
    isProcessing ? ["project", initial.id] : null,
    () => fetchProject(initial.id),
    {
      refreshInterval: 2500,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (polled) {
      setProject(polled);
    }
  }, [polled]);
  return { project, isProcessing };
}
