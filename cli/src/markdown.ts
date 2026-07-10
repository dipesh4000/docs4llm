import pc from "picocolors";

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const INLINE_CODE = /`([^`]+)`/g;
const BOLD = /\*\*([^*]+)\*\*/g;
const ITALIC = /(^|[^*])\*([^*\n]+)\*/g;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^(\s*)[-*]\s+(.*)$/;
const ORDERED = /^(\s*)(\d+)\.\s+(.*)$/;
const FENCE = /^```(\w*)\s*$/;
const BLOCKQUOTE = /^>\s?(.*)$/;

/** Render inline markdown (links, code, bold, italic) into ANSI for a TTY. */
export function renderInline(text: string): string {
  let out = text.replace(
    LINK,
    (_m, label: string, url: string) =>
      `${pc.cyan(pc.underline(label))} ${pc.dim(`(${url})`)}`
  );
  out = out.replace(INLINE_CODE, (_m, code: string) => pc.yellow(code));
  out = out.replace(BOLD, (_m, bold: string) => pc.bold(bold));
  out = out.replace(
    ITALIC,
    (_m, prefix: string, italic: string) => `${prefix}${pc.italic(italic)}`
  );
  return out;
}

/** Render a markdown document into ANSI-formatted terminal text. */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let inCode = false;

  for (const line of lines) {
    const fence = line.match(FENCE);
    if (fence) {
      if (inCode) {
        out.push(pc.dim("    └──────"));
        inCode = false;
      } else {
        const lang = fence[1] || "code";
        out.push(pc.dim(`    ┌────── ${lang}`));
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      out.push(`    ${pc.green(line)}`);
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      out.push(pc.bold(pc.cyan(renderInline(heading[2] ?? ""))));
      continue;
    }

    const ordered = line.match(ORDERED);
    if (ordered) {
      out.push(
        `${ordered[1] ?? ""}${pc.cyan(`${ordered[2] ?? ""}.`)} ${renderInline(ordered[3] ?? "")}`
      );
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      out.push(`${bullet[1] ?? ""}${pc.cyan("•")} ${renderInline(bullet[2] ?? "")}`);
      continue;
    }

    const quote = line.match(BLOCKQUOTE);
    if (quote) {
      out.push(`${pc.dim("│")} ${pc.dim(renderInline(quote[1] ?? ""))}`);
      continue;
    }

    out.push(renderInline(line));
  }

  return out.join("\n");
}
