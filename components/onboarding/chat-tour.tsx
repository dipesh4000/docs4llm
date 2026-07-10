"use client";

import { ProductTour, type TourStep } from "./product-tour";

const STEPS: TourStep[] = [
  {
    element: '[data-tour="chat-input"]',
    popover: {
      title: "Ask anything",
      description:
        "Chat with the assistant here — or paste a documentation URL to turn it into an MCP server.",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="chat-doc2mcp"]',
    popover: {
      title: "Toggle doc2mcp",
      description:
        "Flip this on, then paste a docs URL to generate a hosted MCP server. With it off, your message just asks a question.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Your MCPs are saved",
      description:
        "Every MCP you create is saved to your account — install it into Cursor, Claude, or Windsurf in one click.",
    },
  },
];

export function ChatTour() {
  return <ProductTour steps={STEPS} tourKey="chat-v1" />;
}
