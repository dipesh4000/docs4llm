"use client";

import dynamic from "next/dynamic";

// Framer Motion's <AnimatePresence> uses Math.random() internally to seed
// layout ids. Next 16 with Cache Components rejects Math.random() inside any
// component that prerenders. Loading the real section with ssr:false keeps
// it client-only and dodges the check entirely.
const ProblemSection = dynamic(
  () => import("./problem-section").then((m) => m.ProblemSection),
  {
    ssr: false,
    loading: () => (
      <section className="relative h-[600px] border-border/30 border-y bg-background" />
    ),
  }
);

export function ProblemSectionClient() {
  return <ProblemSection />;
}
