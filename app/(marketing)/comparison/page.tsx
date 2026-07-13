import type { Metadata } from "next";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { MarketMatrixSection } from "@/components/landing/comparison-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import CompareUILib from "@/components/shadcn-studio/blocks/compare-07/compare-07";

export const metadata: Metadata = {
  title: "docs4llm vs Mintlify vs Stainless — Comparison",
  description:
    "Compare docs4llm with Mintlify and Stainless. AI-native docs-to-MCP with smart toolkits, workflow inference, auto-sync and a live playground.",
};

const comparisonData = {
  column1Header: {
    icon: {
      light: "/brand/docs4llm-mark.png",
      dark: "/brand/docs4llm-mark.png",
    },
    title: "docs4llm",
  },
  column2Header: {
    icon: "https://mintlify.com/favicon.svg",
    title: "Mintlify",
  },
  column3Header: "What this means for you",
  features: [
    {
      name: "Primary output",
      column1: "A live MCP server agents can call from Cursor, Claude, VS Code",
      column2: "A docs website with search and AI chat",
      column3:
        "docs4llm ships the runtime your AI editor actually uses, not a website wrapper",
    },
    {
      name: "Setup time",
      column1: "Paste a docs URL, MCP server is ready in minutes",
      column2: "Repo setup, MDX migration, theming, deploy pipeline",
      column3:
        "Zero migration with docs4llm — your existing docs stay as the source of truth",
    },
    {
      name: "Tool discovery",
      column1: "AI-inferred tools and workflows from real docs structure",
      column2: "Manual: you describe endpoints and write reference pages",
      column3:
        "Skip the boilerplate. docs4llm learns your API and exposes typed tools",
    },
    {
      name: "Auto-sync",
      column1: "Docs change → MCP rebuilds automatically with diff history",
      column2: "Triggered by your CI; you handle prompt + schema drift",
      column3:
        "Agents never call a stale endpoint. Sync is the platform's job, not yours",
    },
    {
      name: "Multi-source ingestion",
      column1: "URLs, Markdown, PDF, GitHub, OpenAPI, GraphQL, sitemaps",
      column2: "Markdown / MDX inside a Mintlify repo",
      column3: "Bring whatever you already have, not what the platform prefers",
    },
    {
      name: "Live playground",
      column1: "Run any tool against a real MCP transport, inspect the JSON",
      column2: "Search-style chat that quotes your docs",
      column3: "docs4llm tests behaviour. Mintlify tests phrasing",
    },
    {
      name: "Editor coverage",
      column1: "Cursor, Claude, VS Code, Zed, Windsurf, Codex via stdio + SSE",
      column2: "Web embed and a chat sidebar in your docs",
      column3: "MCP works wherever the developer already lives",
    },
    {
      name: "Hallucination control",
      column1: "Tool outputs are typed JSON, not free-form summaries",
      column2: "LLM answers grounded in indexed pages",
      column3:
        "Strict tool contracts beat fuzzy retrieval for high-stakes calls",
    },
    {
      name: "Telemetry",
      column1: "Per-tool call analytics, hallucination signals, drift alerts",
      column2: "Search analytics over the docs site",
      column3:
        "You see what agents actually do with your API, not what readers search for",
    },
    {
      name: "Pricing model",
      column1: "USD globally, auto-INR for India, no per-seat docs tax",
      column2: "Seats + premium themes + AI add-on",
      column3: "Predictable cost: pay for the MCP runtime, not the wrapper",
    },
  ],
};

export default function ComparisonPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden noise-overlay">
      <AuthAwareLandingNavigation />
      <div className="h-20" />
      <CompareUILib data={comparisonData} />
      <MarketMatrixSection />
      <SocialProofSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
