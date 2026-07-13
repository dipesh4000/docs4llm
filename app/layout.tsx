import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const fallbackAppUrl = "https://docs4llm.site";

function getPublicAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    return fallbackAppUrl;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return fallbackAppUrl;
  }
}

const publicAppUrl = getPublicAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: "docs4llm — Paste Docs URL, Get MCP Server",
  description:
    "Turn any documentation URL into a Cursor-ready MCP server in seconds. No install, no API keys.",
  openGraph: {
    title: "docs4llm — Any docs URL → Cursor-ready MCP",
    description:
      "Paste a documentation URL. Get a hosted MCP server Cursor can read in seconds. No install, no API keys.",
    url: publicAppUrl,
    siteName: "docs4llm",
    images: [
      {
        url: "/og-image-v2.png",
        width: 1200,
        height: 630,
        alt: "docs4llm — paste docs URL, get MCP server",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "docs4llm — Any docs URL → Cursor-ready MCP",
    description:
      "Paste a docs URL. Get a remote MCP server. No install, no API keys.",
    images: ["/og-image-v2.png"],
  },
};

export const viewport = {
  maximumScale: 1,
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const geistMono = GeistMono;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
    >
      <body
        className="min-h-screen font-normal font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem={false}
        >
          <TooltipProvider>
            <CustomCursor />
            {children}
            {process.env.NODE_ENV === "production" ? <Analytics /> : null}
            <Toaster position="bottom-center" theme="system" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
