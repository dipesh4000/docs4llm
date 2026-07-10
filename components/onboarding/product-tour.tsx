"use client";

import "driver.js/dist/driver.css";
import { type DriveStep, driver } from "driver.js";
import { useEffect } from "react";
import "./product-tour.css";

const STORAGE_PREFIX = "doc2mcp_tour_";

export type TourStep = DriveStep;

type ProductTourProps = {
  /** Stable key used to remember that this tour was already shown. */
  tourKey: string;
  steps: TourStep[];
  /** Delay before auto-starting, lets the page settle. */
  startDelayMs?: number;
};

function hasSeen(tourKey: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${tourKey}`) === "1";
  } catch {
    return true;
  }
}

function markSeen(tourKey: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tourKey}`, "1");
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

/**
 * First-run guided onboarding. Renders nothing; on first visit it highlights
 * the elements matched by each step's selector with an animated popover, then
 * persists a "seen" flag so it never auto-runs again for that visitor.
 *
 * Steps whose target element is not present in the DOM are skipped so the tour
 * stays coherent across pages with conditional UI.
 */
export function ProductTour({
  tourKey,
  steps,
  startDelayMs = 900,
}: ProductTourProps) {
  useEffect(() => {
    if (hasSeen(tourKey)) {
      return;
    }

    const timer = window.setTimeout(() => {
      const presentSteps = steps.filter((step) => {
        if (typeof step.element !== "string") {
          return true;
        }
        return Boolean(document.querySelector(step.element));
      });

      if (presentSteps.length === 0) {
        markSeen(tourKey);
        return;
      }

      const tour = driver({
        showProgress: true,
        allowClose: true,
        overlayColor: "rgba(8, 10, 14, 0.62)",
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: "doc2mcp-tour",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Got it",
        steps: presentSteps,
        onDestroyed: () => markSeen(tourKey),
      });

      tour.drive();
    }, startDelayMs);

    return () => window.clearTimeout(timer);
  }, [tourKey, steps, startDelayMs]);

  return null;
}

/** Imperatively (re)start a tour, e.g. from a "Take the tour" button. */
export function startTour(tourKey: string, steps: TourStep[]) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${tourKey}`);
  } catch {
    // ignore
  }
  const tour = driver({
    showProgress: true,
    allowClose: true,
    overlayColor: "rgba(8, 10, 14, 0.62)",
    stagePadding: 6,
    stageRadius: 12,
    popoverClass: "doc2mcp-tour",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Got it",
    steps,
    onDestroyed: () => markSeen(tourKey),
  });
  tour.drive();
}
