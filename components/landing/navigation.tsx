"use client";

import {
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  FileText,
  Home,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Sliders,
  Store,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Docs4LlmLogo } from "@/components/docs4llm/logo";
import { ThemeToggle } from "@/components/docs4llm/theme-toggle";
import { GithubStarButton } from "@/components/landing/github-star-button";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  Navbar,
  NavbarButton,
  NavItems,
} from "@/components/ui/resizable-navbar";
import { isAdminEmail } from "@/lib/admin/admin-access";
import { guestRegex } from "@/lib/constants";
import { type AppAuthUser, useSupabaseAuth } from "@/lib/supabase/auth";

const NAV_LINKS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Features", href: "/#features", icon: Sliders },
  { name: "CLI", href: "/cli", icon: Terminal },
  { name: "Marketplace", href: "/marketplace", icon: Store },
  { name: "Compare", href: "/comparison", icon: ArrowLeftRight },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "Blog", href: "/blog", icon: BookOpen },
  { name: "Docs", href: "/docs", icon: FileText },
] as const;

const TOUR_ANCHORS: Record<string, string> = {
  "/cli": "nav-cli",
  "/pricing": "nav-pricing",
};

export type LandingSessionInfo = {
  email: string;
  name?: string | null;
  initial: string;
  plan: string;
  isAdmin: boolean;
} | null;

function displayNameFor(session: NonNullable<LandingSessionInfo>): string {
  const raw = session.name?.trim();
  if (raw) {
    return raw;
  }
  const local = session.email.split("@")[0] ?? session.email;
  const cleaned = local
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return session.email;
  }
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isRegularUser(email: string | null | undefined): email is string {
  return Boolean(email && !guestRegex.test(email));
}

function sessionFromClientUser(
  clientUser: AppAuthUser,
  serverSession: LandingSessionInfo
): LandingSessionInfo {
  if (serverSession && serverSession.email === clientUser.email) {
    return serverSession;
  }

  return {
    email: clientUser.email,
    name: clientUser.name ?? null,
    initial: (
      (clientUser.name?.trim()?.[0] || clientUser.email[0]) ??
      "?"
    ).toUpperCase(),
    plan: "free",
    isAdmin: isAdminEmail(clientUser.email),
  };
}

export function LandingNavigation({
  session = null,
}: {
  session?: LandingSessionInfo;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user: clientUser, loading: authLoading } = useSupabaseAuth();

  const activeSession = useMemo(() => {
    if (authLoading) {
      return session;
    }

    if (clientUser?.type !== "regular" || !isRegularUser(clientUser.email)) {
      return null;
    }

    return sessionFromClientUser(clientUser, session);
  }, [authLoading, clientUser, session]);

  const appHref = activeSession?.isAdmin ? "/admin" : "/chat";
  const appLabel = activeSession?.isAdmin ? "Admin" : "Open app";

  const visibleNavLinks = NAV_LINKS;

  const navItems = visibleNavLinks.map((link) => ({
    name: link.name,
    link: link.href,
  }));

  return (
    <Navbar>
      <NavBody>
        <Link
          aria-label="docs4llm home"
          className="relative z-20 flex shrink-0 items-center"
          href="/"
        >
          <Docs4LlmLogo size={28} />
        </Link>

        <NavItems
          items={navItems}
          onItemClick={() => setIsMobileMenuOpen(false)}
        />

        <div
          className="relative z-20 flex items-center gap-2"
          data-tour="nav-cta"
        >
          <GithubStarButton />
          <ThemeToggle />
          {activeSession ? (
            <NavbarButton href={appHref} variant="primary">
              {appLabel}
              <ArrowUpRight className="ml-1 size-3.5" />
            </NavbarButton>
          ) : (
            <NavbarButton href="/login" variant="primary">
              <LogIn className="mr-1 size-3.5" />
              Sign in
            </NavbarButton>
          )}
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <Link aria-label="docs4llm home" href="/">
            <Docs4LlmLogo size={24} />
          </Link>
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen}>
          {visibleNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-foreground/85 hover:bg-muted/60"
                data-tour={TOUR_ANCHORS[item.href]}
                href={item.href}
                key={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="w-full border-border/60 border-t pt-3">
            <GithubStarButton className="mb-3 w-full justify-center" />
          </div>

          {activeSession ? (
            <div className="w-full space-y-3 border-border/60 border-t pt-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
                <p className="font-medium text-foreground text-sm">
                  {displayNameFor(activeSession)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {activeSession.isAdmin
                    ? "Administrator"
                    : `${activeSession.plan} plan`}
                </p>
              </div>
              <NavbarButton
                className="w-full"
                href={appHref}
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
              >
                {activeSession.isAdmin ? (
                  <ShieldCheck className="mr-1.5 size-4" />
                ) : (
                  <MessageSquare className="mr-1.5 size-4" />
                )}
                {appLabel}
              </NavbarButton>
            </div>
          ) : (
            <NavbarButton
              className="w-full"
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
            >
              <LogIn className="mr-1.5 size-4" />
              Sign in with Google
            </NavbarButton>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
