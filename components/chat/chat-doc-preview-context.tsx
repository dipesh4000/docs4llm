"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ChatDocPreviewState = {
  url: string | null;
  docs4llmMode: boolean;
  isLoading: boolean;
  isDismissed: boolean;
  setPreview: (next: {
    url: string | null;
    docs4llmMode?: boolean;
    isLoading?: boolean;
    isDismissed?: boolean;
  }) => void;
  dismiss: () => void;
};

const ChatDocPreviewContext = createContext<ChatDocPreviewState | null>(null);

export function ChatDocPreviewProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  const [docs4llmMode, setDocs4llmMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const setPreview = useCallback(
    (next: {
      url: string | null;
      docs4llmMode?: boolean;
      isLoading?: boolean;
      isDismissed?: boolean;
    }) => {
      if (next.url !== undefined) {
        setUrl(next.url);
        if (next.url) {
          setIsDismissed(false);
        }
      }
      if (next.docs4llmMode !== undefined) {
        setDocs4llmMode(next.docs4llmMode);
      }
      if (next.isLoading !== undefined) {
        setIsLoading(next.isLoading);
      }
      if (next.isDismissed !== undefined) {
        setIsDismissed(next.isDismissed);
      }
    },
    []
  );

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const value = useMemo(
    () => ({
      url,
      docs4llmMode,
      isLoading,
      isDismissed,
      setPreview,
      dismiss,
    }),
    [url, docs4llmMode, isLoading, isDismissed, setPreview, dismiss]
  );

  return (
    <ChatDocPreviewContext.Provider value={value}>
      {children}
    </ChatDocPreviewContext.Provider>
  );
}

export function useChatDocPreview() {
  const ctx = useContext(ChatDocPreviewContext);
  if (!ctx) {
    throw new Error(
      "useChatDocPreview must be used within ChatDocPreviewProvider"
    );
  }
  return ctx;
}

export function useChatDocPreviewVisible() {
  const { url, isDismissed } = useChatDocPreview();
  return Boolean(url && !isDismissed);
}
