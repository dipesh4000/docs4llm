"use client";

import { useMemo } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  extractMediaEmbeds,
  stripMediaUrlsFromMarkdown,
} from "@/lib/chat/media-embed";
import { ChatMediaEmbedList } from "./chat-media-embed";

export function MessageWithMedia({ text }: { text: string }) {
  const { embeds, body } = useMemo(() => {
    const media = extractMediaEmbeds(text);
    return {
      embeds: media,
      body: stripMediaUrlsFromMarkdown(text, media),
    };
  }, [text]);

  const hasBody = body.length > 0;

  return (
    <>
      <ChatMediaEmbedList embeds={embeds} />
      {hasBody ? <MessageResponse>{body}</MessageResponse> : null}
    </>
  );
}
