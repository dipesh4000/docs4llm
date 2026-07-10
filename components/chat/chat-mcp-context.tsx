"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type McpProjectOption = {
  id: string;
  name: string;
  sourceUrl: string | null;
  pageCount?: number;
};

type ChatMcpState = {
  enabled: boolean;
  projectId: string | null;
  projects: McpProjectOption[];
  setEnabled: (enabled: boolean) => void;
  setProjectId: (id: string | null) => void;
  setProjects: (projects: McpProjectOption[]) => void;
};

const ChatMcpContext = createContext<ChatMcpState | null>(null);

export function ChatMcpProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<McpProjectOption[]>([]);

  const value = useMemo(
    () => ({
      enabled,
      projectId,
      projects,
      setEnabled,
      setProjectId,
      setProjects,
    }),
    [enabled, projectId, projects]
  );

  return (
    <ChatMcpContext.Provider value={value}>{children}</ChatMcpContext.Provider>
  );
}

export function useChatMcp() {
  const ctx = useContext(ChatMcpContext);
  if (!ctx) {
    throw new Error("useChatMcp must be used within ChatMcpProvider");
  }
  return ctx;
}
