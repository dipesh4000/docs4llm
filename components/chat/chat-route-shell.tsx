"use client";

import { usePathname } from "next/navigation";
import { ChatShell } from "./shell";

export function ChatRouteShell() {
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/chat");

  if (!isChatRoute) {
    return null;
  }

  return <ChatShell />;
}
