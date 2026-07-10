"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    const message =
      typeof args[0] === "string"
        ? args[0]
        : args[0] instanceof Error
          ? args[0].message
          : "";

    if (
      message.includes("Encountered a script tag") ||
      message.includes("Scripts inside React components are never executed") ||
      message.includes("data-cursor-ref")
    ) {
      return;
    }

    orig.apply(console, args as Parameters<typeof orig>);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
