"use client";

import { EyeIcon, PanelLeftIcon } from "lucide-react";
import { memo } from "react";
import { useChatCabinets } from "@/components/chat/chat-cabinets-context";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const { open, toggleCabinet, webSources } = useChatCabinets();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 bg-sidebar px-2 sm:h-14 sm:px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      <div className="ml-auto">
        <Button
          aria-label={open ? "Close sources" : "Open sources"}
          aria-pressed={open}
          className={cn(
            "gap-1.5",
            open && "border-primary/40 bg-primary/10 text-foreground"
          )}
          onClick={() => {
            toggleCabinet("web");
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <EyeIcon className="size-3.5" />
          <span className="hidden sm:inline">Sources</span>
          {webSources.length > 0 ? (
            <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[10px]">
              {webSources.length}
            </span>
          ) : null}
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
