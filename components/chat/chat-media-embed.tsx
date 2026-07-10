"use client";

import type { MediaEmbed } from "@/lib/chat/media-embed";
import { cn } from "@/lib/utils";

export function ChatMediaEmbed({ embed }: { embed: MediaEmbed }) {
  const isYoutube = embed.type === "youtube";

  return (
    <div
      className={cn(
        "my-3 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30",
        isYoutube ? "aspect-video max-w-xl" : "max-w-md"
      )}
    >
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={cn(
          "w-full border-0",
          isYoutube ? "h-full min-h-[200px]" : "h-[152px]"
        )}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embed.embedUrl}
        title={isYoutube ? "YouTube player" : "Spotify player"}
      />
    </div>
  );
}

export function ChatMediaEmbedList({ embeds }: { embeds: MediaEmbed[] }) {
  if (embeds.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1" data-testid="chat-media-embeds">
      {embeds.map((embed) => (
        <ChatMediaEmbed embed={embed} key={embed.embedUrl} />
      ))}
    </div>
  );
}
