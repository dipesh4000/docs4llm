import type { Metadata } from "next";
import "./landing.css";

export const metadata: Metadata = {
  title: "docs4llm — Paste Docs URL, Get MCP Server",
  description:
    "Turn API documentation into MCP servers for Cursor, Claude, and Windsurf.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
