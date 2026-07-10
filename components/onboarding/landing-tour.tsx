"use client";

import { ProductTour, type TourStep } from "./product-tour";

const STEPS: TourStep[] = [
  {
    element: '[data-tour="hero-url"]',
    popover: {
      title: "Paste any docs URL",
      description:
        "Drop in a documentation link — Stripe, GitHub, Mintlify, OpenAPI — and doc2mcp turns it into a hosted MCP server in seconds.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-cli"]',
    popover: {
      title: "Prefer the terminal?",
      description:
        "Install the CLI with `npm i -g doc2mcp` and generate MCPs without leaving your editor.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-pricing"]',
    popover: {
      title: "Start free, scale up",
      description:
        "Begin with 1 free MCP, then move to hosted endpoints and custom domains as your usage grows.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="nav-cta"]',
    popover: {
      title: "Open the app",
      description:
        "Jump in to chat with your docs, manage projects, and install MCPs into Cursor, Claude, or Windsurf.",
      side: "bottom",
      align: "end",
    },
  },
];

export function LandingTour() {
  return <ProductTour steps={STEPS} tourKey="landing-v1" />;
}
