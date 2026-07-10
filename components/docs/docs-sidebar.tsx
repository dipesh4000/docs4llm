"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocNavGroup } from "@/lib/docs/loader";
import { cn } from "@/lib/utils";

export function DocsSidebar({
  groups,
  onNavigate,
}: {
  groups: DocNavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="w-full">
      <p className="mb-3 px-2 font-semibold text-foreground text-sm">
        Sections
      </p>
      <nav className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.category}>
            <p className="mb-1.5 px-2 font-medium text-muted-foreground/70 text-xs">
              {group.category}
            </p>
            <div className="flex flex-col gap-px">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/docs" &&
                    pathname?.startsWith(`${item.href}/`));
                return (
                  <Link
                    className={cn(
                      "rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                    href={item.href}
                    key={item.href}
                    onClick={onNavigate}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
