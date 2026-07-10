"use client";

import dynamic from "next/dynamic";

const HowItWorksSection = dynamic(
  () => import("./how-it-works-section").then((m) => m.HowItWorksSection),
  {
    ssr: false,
    loading: () => <section className="relative h-[600px] bg-background" />,
  }
);

export function HowItWorksSectionClient() {
  return <HowItWorksSection />;
}
