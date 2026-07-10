"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DocNavGroup } from "@/lib/docs/loader";

export function DocsMobileNav({ groups }: { groups: DocNavGroup[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    if (pathname) {
      setOpen(false);
    }
  }, [pathname]);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open documentation menu"
          className="lg:hidden"
          size="icon-sm"
          variant="ghost"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-72 max-w-[85vw] gap-0 border-border/60 p-0"
        side="left"
      >
        <SheetHeader className="border-border/60 border-b p-4">
          <SheetTitle className="text-left font-display text-base">
            Documentation
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigate the doc2mcp documentation.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto p-4">
          <DocsSidebar groups={groups} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
