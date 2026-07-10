"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DocNavItem } from "@/lib/docs/loader";
import { cn } from "@/lib/utils";

export function DocsSearch({ items }: { items: DocNavItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [items, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      go(results[active].href);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex h-9 items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 transition-colors focus-within:border-border focus-within:bg-background">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          aria-label="Search documentation"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search docs…"
          ref={inputRef}
          value={query}
        />
        <kbd className="hidden rounded border border-border/60 px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </div>

      {open && results.length > 0 ? (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-popover p-1 shadow-lg">
          {results.map((item, index) => (
            <li key={item.href}>
              <button
                className={cn(
                  "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors",
                  index === active ? "bg-accent" : "hover:bg-accent/60"
                )}
                onClick={() => go(item.href)}
                onMouseEnter={() => setActive(index)}
                type="button"
              >
                <span className="text-sm">{item.title}</span>
                <span className="font-mono text-[10px] text-muted-foreground uppercase">
                  {item.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
