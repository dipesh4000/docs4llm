/**
 * Internal web-search provider abstraction.
 * Used server-side only to enrich docs crawling and ask_documentation answers.
 * NOT exposed in any public UI or in the generated MCP.
 */

export type SearchHit = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

export type SearchProvider = {
  id: string;
  name: string;
  available: boolean;
  search: (query: string, opts?: SearchOptions) => Promise<SearchHit[]>;
};

export type SearchOptions = {
  limit?: number;
  site?: string;
  signal?: AbortSignal;
};

const FETCH_TIMEOUT_MS = 12_000;

function withTimeout(signal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

const tavilyProvider: SearchProvider = {
  id: "tavily",
  name: "Tavily",
  get available() {
    return Boolean(process.env.TAVILY_API_KEY);
  },
  async search(query, opts) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return [];
    }
    const { signal, cleanup } = withTimeout(opts?.signal);
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal,
        body: JSON.stringify({
          api_key: apiKey,
          query: opts?.site ? `${query} site:${opts.site}` : query,
          max_results: opts?.limit ?? 8,
          include_answer: false,
        }),
      });
      if (!res.ok) {
        return [];
      }
      const data = (await res.json()) as {
        results?: Array<{ title?: string; url?: string; content?: string }>;
      };
      return (data.results ?? []).map((r) => ({
        title: r.title ?? r.url ?? "",
        url: r.url ?? "",
        snippet: r.content ?? "",
        source: "tavily",
      }));
    } catch {
      return [];
    } finally {
      cleanup();
    }
  },
};

const serperProvider: SearchProvider = {
  id: "serper",
  name: "Serper",
  get available() {
    return Boolean(process.env.SERPER_API_KEY);
  },
  async search(query, opts) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return [];
    }
    const { signal, cleanup } = withTimeout(opts?.signal);
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-API-KEY": apiKey,
        },
        signal,
        body: JSON.stringify({
          q: opts?.site ? `${query} site:${opts.site}` : query,
          num: opts?.limit ?? 8,
        }),
      });
      if (!res.ok) {
        return [];
      }
      const data = (await res.json()) as {
        organic?: Array<{ title?: string; link?: string; snippet?: string }>;
      };
      return (data.organic ?? []).map((r) => ({
        title: r.title ?? r.link ?? "",
        url: r.link ?? "",
        snippet: r.snippet ?? "",
        source: "serper",
      }));
    } catch {
      return [];
    } finally {
      cleanup();
    }
  },
};

const braveProvider: SearchProvider = {
  id: "brave",
  name: "Brave",
  get available() {
    return Boolean(process.env.BRAVE_SEARCH_API_KEY);
  },
  async search(query, opts) {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      return [];
    }
    const { signal, cleanup } = withTimeout(opts?.signal);
    try {
      const q = opts?.site ? `${query} site:${opts.site}` : query;
      const url = `https://api.search.brave.com/res/v1/web/search?count=${opts?.limit ?? 8}&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        signal,
      });
      if (!res.ok) {
        return [];
      }
      const data = (await res.json()) as {
        web?: {
          results?: Array<{
            title?: string;
            url?: string;
            description?: string;
          }>;
        };
      };
      return (data.web?.results ?? []).map((r) => ({
        title: r.title ?? r.url ?? "",
        url: r.url ?? "",
        snippet: r.description ?? "",
        source: "brave",
      }));
    } catch {
      return [];
    } finally {
      cleanup();
    }
  },
};

const exaProvider: SearchProvider = {
  id: "exa",
  name: "Exa",
  get available() {
    return Boolean(process.env.EXA_API_KEY);
  },
  async search(query, opts) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      return [];
    }
    const { signal, cleanup } = withTimeout(opts?.signal);
    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        signal,
        body: JSON.stringify({
          query,
          numResults: opts?.limit ?? 8,
          includeDomains: opts?.site ? [opts.site] : undefined,
          contents: { text: true },
        }),
      });
      if (!res.ok) {
        return [];
      }
      const data = (await res.json()) as {
        results?: Array<{
          title?: string;
          url?: string;
          text?: string;
        }>;
      };
      return (data.results ?? []).map((r) => ({
        title: r.title ?? r.url ?? "",
        url: r.url ?? "",
        snippet: r.text?.slice(0, 400) ?? "",
        source: "exa",
      }));
    } catch {
      return [];
    } finally {
      cleanup();
    }
  },
};

const PROVIDERS: SearchProvider[] = [
  tavilyProvider,
  serperProvider,
  braveProvider,
  exaProvider,
];

/** Returns the first configured provider, or null when none is available. */
export function getPrimaryProvider(): SearchProvider | null {
  return PROVIDERS.find((p) => p.available) ?? null;
}

export function listConfiguredProviders(): SearchProvider[] {
  return PROVIDERS.filter((p) => p.available);
}

/** Run a single web search using whichever provider is configured. */
// biome-ignore lint/suspicious/useAwait: returns provider's promise — keep async for API symmetry
export async function webSearch(
  query: string,
  opts?: SearchOptions
): Promise<SearchHit[]> {
  const provider = getPrimaryProvider();
  if (!provider) {
    return [];
  }
  return provider.search(query, opts);
}

/** True when at least one search provider is configured. */
export function isWebSearchEnabled(): boolean {
  return PROVIDERS.some((p) => p.available);
}
