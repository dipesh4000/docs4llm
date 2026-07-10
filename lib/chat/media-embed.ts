export type MediaEmbed = {
  type: "youtube" | "spotify";
  embedUrl: string;
  originalUrl: string;
};

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/gi,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]{11})/gi,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/gi,
];

const SPOTIFY_PATTERNS = [
  /(?:https?:\/\/)?open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/gi,
];

/** Fenced block: ```music\n<url>\n``` */
const MUSIC_FENCE = /```music\s*\n([\s\S]*?)\n```/gi;

function youtubeEmbed(id: string, originalUrl: string): MediaEmbed {
  return {
    type: "youtube",
    embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`,
    originalUrl,
  };
}

function spotifyEmbed(
  kind: string,
  id: string,
  originalUrl: string
): MediaEmbed {
  return {
    type: "spotify",
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
    originalUrl,
  };
}

export function extractMediaEmbeds(text: string): MediaEmbed[] {
  const found: MediaEmbed[] = [];
  const seen = new Set<string>();

  const add = (embed: MediaEmbed) => {
    if (seen.has(embed.embedUrl)) {
      return;
    }
    seen.add(embed.embedUrl);
    found.push(embed);
  };

  for (const match of text.matchAll(MUSIC_FENCE)) {
    const inner = match[1].trim();
    for (const embed of extractMediaEmbeds(inner)) {
      add(embed);
    }
  }

  for (const pattern of YOUTUBE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const id = match[1];
      if (id) {
        add(youtubeEmbed(id, match[0]));
      }
    }
  }

  for (const pattern of SPOTIFY_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const kind = match[1];
      const id = match[2];
      if (kind && id) {
        add(spotifyEmbed(kind, id, match[0]));
      }
    }
  }

  return found;
}

/** Remove music fences and duplicate bare URLs already shown as embeds. */
export function stripMediaUrlsFromMarkdown(
  text: string,
  embeds: MediaEmbed[]
): string {
  let out = text.replace(MUSIC_FENCE, "").trim();

  for (const embed of embeds) {
    out = out.split(embed.originalUrl).join("");
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
