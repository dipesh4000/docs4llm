import type { Metadata } from "next";
import {
  CliChat,
  CliCommands,
  CliEditors,
  CliHero,
} from "@/components/cli/cli-landing";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { CliSection } from "@/components/landing/cli-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "doc2mcp CLI — Turn Docs Into MCP From Your Terminal",
  description:
    "Install the doc2mcp CLI to convert any documentation URL into a hosted, token-secured MCP server, install it into Cursor/VS Code/Claude/Windsurf, and chat with your docs — all from the terminal.",
};

export default function CliPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden noise-overlay">
      <AuthAwareLandingNavigation />
      <CliHero />
      <CliSection />
      <CliCommands />
      <CliEditors />
      <CliChat />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
