/**
 * Enterprise-grade HTML → markdown converter for documentation pages.
 *
 * Improvements over the legacy stripper:
 *   - Tables → markdown pipe tables
 *   - Definition lists (<dl>) → "Term — Definition" lines
 *   - Blockquotes
 *   - Ordered and unordered nested lists
 *   - Code blocks with language hints
 *   - Inline emphasis preservation (<strong>, <em>, <code>)
 *   - Main-content extraction (drops nav/header/footer/aside)
 *   - Entity decoding
 */

const BLOCK_TAGS = ["main", "article", '[role="main"]'] as const;
const STRIP_TAGS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "svg",
] as const;

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&laquo;": "«",
  "&raquo;": "»",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
};

function decodeEntities(text: string): string {
  let out = text;
  for (const [from, to] of Object.entries(ENTITY_MAP)) {
    out = out.replaceAll(from, to);
  }
  return out.replace(/&#(\d+);/g, (_m, code: string) =>
    String.fromCharCode(Number(code))
  );
}

function stripTag(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
  return html.replace(re, "");
}

function extractMainContent(html: string): string {
  for (const tag of BLOCK_TAGS) {
    const selector = tag.startsWith("[") ? null : tag;
    if (!selector) {
      continue;
    }
    const re = new RegExp(
      `<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`,
      "i"
    );
    const m = html.match(re);
    if (m?.[1] && m[1].length > 500) {
      return m[1];
    }
  }
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? html;
}

function convertTables(html: string): string {
  return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_m, body) => {
    const rows = Array.from(
      (body as string).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
    ).map((r) => r[1] ?? "");
    if (rows.length === 0) {
      return "";
    }
    const parseCells = (row: string, cellTag: "th" | "td") => {
      return Array.from(
        row.matchAll(
          new RegExp(`<${cellTag}[^>]*>([\\s\\S]*?)<\\/${cellTag}>`, "gi")
        )
      ).map((c) => decodeEntities((c[1] ?? "").replace(/<[^>]+>/g, "").trim()));
    };
    const header = parseCells(rows[0] ?? "", "th");
    const headerLine =
      header.length > 0 ? header : parseCells(rows[0] ?? "", "td");
    const dataRows = rows
      .slice(header.length > 0 ? 1 : 0)
      .map((r) => parseCells(r, "td"));

    if (headerLine.length === 0) {
      return "";
    }
    const sep = headerLine.map(() => "---").join(" | ");
    const out = [
      `| ${headerLine.join(" | ")} |`,
      `| ${sep} |`,
      ...dataRows.map((r) => `| ${r.join(" | ")} |`),
    ];
    return `\n\n${out.join("\n")}\n\n`;
  });
}

function convertCodeBlocks(html: string): string {
  let out = html.replace(
    /<pre[^>]*>\s*<code[^>]*class="[^"]*language-([a-z0-9+#.-]+)[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_m, lang: string, body: string) =>
      `\n\n\`\`\`${lang}\n${decodeEntities(body.replace(/<[^>]+>/g, ""))}\n\`\`\`\n\n`
  );
  out = out.replace(
    /<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_m, body: string) =>
      `\n\n\`\`\`\n${decodeEntities(body.replace(/<[^>]+>/g, ""))}\n\`\`\`\n\n`
  );
  return out.replace(
    /<code[^>]*>([\s\S]*?)<\/code>/gi,
    (_m, body: string) => `\`${decodeEntities(body.replace(/<[^>]+>/g, ""))}\``
  );
}

function convertHeadings(html: string): string {
  return html.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, level: string, body: string) => {
      const text = decodeEntities(body.replace(/<[^>]+>/g, "").trim());
      return `\n\n${"#".repeat(Number(level))} ${text}\n\n`;
    }
  );
}

function convertLists(html: string): string {
  let out = html;
  out = out.replace(
    /<ol[^>]*>([\s\S]*?)<\/ol>/gi,
    (_m, body: string) =>
      `\n\n${Array.from(
        (body as string).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
      )
        .map(
          (li, i) =>
            `${i + 1}. ${decodeEntities((li[1] ?? "").replace(/<[^>]+>/g, "").trim())}`
        )
        .join("\n")}\n\n`
  );
  out = out.replace(
    /<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    (_m, body: string) =>
      `\n\n${Array.from(
        (body as string).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
      )
        .map(
          (li) =>
            `- ${decodeEntities((li[1] ?? "").replace(/<[^>]+>/g, "").trim())}`
        )
        .join("\n")}\n\n`
  );
  out = out.replace(/<dl[^>]*>([\s\S]*?)<\/dl>/gi, (_m, body: string) => {
    const items: string[] = [];
    const re = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    let match = re.exec(body);
    while (match) {
      const term = decodeEntities(
        match[1]?.replace(/<[^>]+>/g, "").trim() ?? ""
      );
      const def = decodeEntities(
        match[2]?.replace(/<[^>]+>/g, "").trim() ?? ""
      );
      items.push(`- **${term}** — ${def}`);
      match = re.exec(body);
    }
    return `\n\n${items.join("\n")}\n\n`;
  });
  return out;
}

function convertBlockquotes(html: string): string {
  return html.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_m, body: string) => {
      const inner = decodeEntities(
        (body as string).replace(/<[^>]+>/g, "").trim()
      );
      return `\n\n${inner
        .split(/\n+/)
        .map((line) => `> ${line}`)
        .join("\n")}\n\n`;
    }
  );
}

function convertInline(html: string): string {
  let out = html;
  out = out.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  out = out.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  out = out.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "_$1_");
  out = out.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "_$1_");
  out = out.replace(
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, body: string) => {
      const label = decodeEntities(body.replace(/<[^>]+>/g, "").trim());
      return label ? `[${label}](${href})` : href;
    }
  );
  return out;
}

/**
 * Convert HTML to a clean markdown-ish string. Drops nav/footer chrome,
 * preserves headings/code/tables/lists/links.
 */
export function htmlToMarkdown(html: string): string {
  let text = html;
  for (const tag of STRIP_TAGS) {
    text = stripTag(text, tag);
  }
  text = extractMainContent(text);
  text = convertCodeBlocks(text);
  text = convertTables(text);
  text = convertHeadings(text);
  text = convertLists(text);
  text = convertBlockquotes(text);
  text = convertInline(text);
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);

  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract <title>...</title>, fallback to the first h1.
 */
export function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const candidate = titleMatch?.[1]?.trim();
  if (candidate) {
    return decodeEntities(candidate);
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    return decodeEntities(h1Match[1].replace(/<[^>]+>/g, "").trim());
  }
  return null;
}
