"use client";

import { ProductTour, type TourStep } from "./product-tour";

const STEPS: TourStep[] = [
  {
    element: '[data-tour="dash-new"]',
    popover: {
      title: "Create your first MCP",
      description:
        "Click here and paste any documentation URL to start a conversion. Your hosted MCP endpoint is ready in seconds.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="dash-plan"]',
    popover: {
      title: "Track your plan",
      description:
        "Your monthly conversions, pages-per-site limit, and private-project access live here. Upgrade anytime as you grow.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="dash-links"]',
    popover: {
      title: "Manage everything",
      description:
        "Jump to your projects, account settings, and billing from these quick links.",
      side: "top",
      align: "start",
    },
  },
];

export function DashboardTour() {
  return <ProductTour steps={STEPS} tourKey="dashboard-v1" />;
}
