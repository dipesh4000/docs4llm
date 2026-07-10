"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TocItem = {
  id: string;
  text: string;
  level: number;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\da-z]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function DocToc() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const article = document.getElementById("doc-article");
    if (!article) {
      return;
    }

    const headings = Array.from(
      article.querySelectorAll<HTMLHeadingElement>("h2, h3")
    );
    const used = new Set<string>();
    const next: TocItem[] = [];

    for (const heading of headings) {
      const text = heading.textContent?.trim() ?? "";
      if (!text) {
        continue;
      }
      let id = heading.id || slugify(text);
      let suffix = 2;
      while (used.has(id)) {
        id = `${slugify(text)}-${suffix}`;
        suffix += 1;
      }
      used.add(id);
      heading.id = id;
      heading.style.scrollMarginTop = "96px";
      next.push({ id, text, level: heading.tagName === "H3" ? 3 : 2 });
    }

    setItems(next);

    if (next.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    for (const heading of headings) {
      observer.observe(heading);
    }

    return () => observer.disconnect();
  }, []);

  if (items.length < 2) {
    return null;
  }

  return (
    <nav className="text-sm">
      <p className="mb-3 font-mono text-[11px] text-muted-foreground/70 uppercase tracking-wider">
        On this page
      </p>
      <ul className="flex flex-col gap-1.5 border-border/60 border-l">
        {items.map((item) => (
          <li key={item.id}>
            <a
              className={cn(
                "-ml-px block border-transparent border-l py-0.5 pl-3 transition-colors",
                item.level === 3 && "pl-6",
                activeId === item.id
                  ? "border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              href={`#${item.id}`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
