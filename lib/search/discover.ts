import { isWebSearchEnabled, webSearch } from "./providers";

/**
 * Given a docs origin (e.g. "https://docs.langchain.com") and an optional
 * topic, return additional likely doc URLs from web search.
 * Used internally when llms.txt is missing and SPA crawls return thin pages.
 */
export async function discoverExtraDocUrls(
  origin: string,
  topic?: string
): Promise<string[]> {
  if (!isWebSearchEnabled()) {
    return [];
  }

  let host = origin;
  try {
    host = new URL(origin).hostname;
  } catch {
    return [];
  }

  const queries = [
    `${host} documentation`,
    `${host} ${topic ?? "guide"} examples`,
    `${host} API reference`,
  ];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const q of queries) {
    const hits = await webSearch(q, { site: host, limit: 8 });
    for (const hit of hits) {
      if (!hit.url || seen.has(hit.url)) {
        continue;
      }
      try {
        const u = new URL(hit.url);
        if (u.hostname !== host) {
          continue;
        }
        seen.add(hit.url);
        urls.push(hit.url);
      } catch {
        // skip
      }
    }
  }

  return urls;
}
