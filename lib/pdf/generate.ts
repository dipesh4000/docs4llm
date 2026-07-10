import "server-only";

import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const MARGIN_Y = 64;
const LINE_HEIGHT_BODY = 14;
const LINE_HEIGHT_H1 = 26;
const LINE_HEIGHT_H2 = 22;
const LINE_HEIGHT_H3 = 18;
const PARAGRAPH_GAP = 8;

export type GeneratePdfInput = {
  title: string;
  content: string;
  /** Optional small footer line (e.g. author or generated-on date). */
  footer?: string;
};

type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "hr" }
  | { kind: "blank" };

/**
 * Very small Markdown → block parser. Handles only the slice we need for
 * chat output: headings, paragraphs, bullet/ordered lists, fenced code
 * blocks and horizontal rules. Inline markdown (bold, italics, links) is
 * rendered as plain text — PDF doesn't get a layout engine here, just a
 * deterministic one-pass renderer.
 */
function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ kind: "code", text: codeLines.join("\n") });
      continue;
    }

    if (/^\s*$/.test(line)) {
      blocks.push({ kind: "blank" });
      i += 1;
      continue;
    }

    if (/^-{3,}\s*$/.test(line) || /^_{3,}\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const kind = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      blocks.push({ kind, text: heading[2].trim() });
      i += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    const paragraphLines: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !lines[i].startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    blocks.push({
      kind: "p",
      text: paragraphLines.join(" ").replace(/\s+/g, " ").trim(),
    });
  }
  return blocks;
}

/** Strip the most common inline markdown so it doesn't show as raw chars. */
function stripInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      // Word longer than maxWidth: hard-break on characters.
      let buf = "";
      for (const ch of word) {
        const probe = buf + ch;
        if (font.widthOfTextAtSize(probe, size) > maxWidth && buf) {
          lines.push(buf);
          buf = ch;
        } else {
          buf = probe;
        }
      }
      current = buf;
    } else {
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

type DrawState = {
  pdf: PDFDocument;
  page: PDFPage;
  cursorY: number;
  body: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
};

function ensureSpace(state: DrawState, needed: number) {
  if (state.cursorY - needed < MARGIN_Y) {
    state.page = state.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    state.cursorY = PAGE_HEIGHT - MARGIN_Y;
  }
}

function drawWrapped(
  state: DrawState,
  text: string,
  font: PDFFont,
  size: number,
  lineHeight: number,
  options?: { indent?: number; color?: { r: number; g: number; b: number } }
) {
  const indent = options?.indent ?? 0;
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2 - indent;
  const lines = wrapText(stripInline(text), font, size, maxWidth);
  for (const line of lines) {
    ensureSpace(state, lineHeight);
    state.cursorY -= lineHeight;
    state.page.drawText(line, {
      x: MARGIN_X + indent,
      y: state.cursorY,
      size,
      font,
      color: options?.color
        ? rgb(options.color.r, options.color.g, options.color.b)
        : rgb(0.1, 0.1, 0.12),
    });
  }
}

export async function generatePdfBuffer(
  input: GeneratePdfInput
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(input.title);
  pdf.setCreator("doc2mcp");
  pdf.setProducer("doc2mcp (pdf-lib)");
  pdf.setCreationDate(new Date());

  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const state: DrawState = {
    pdf,
    page: pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    cursorY: PAGE_HEIGHT - MARGIN_Y,
    body,
    bold,
    mono,
  };

  // Title
  drawWrapped(state, input.title, bold, 22, LINE_HEIGHT_H1, {
    color: { r: 0.07, g: 0.07, b: 0.09 },
  });
  state.cursorY -= 4;

  const blocks = parseMarkdown(input.content);
  for (const block of blocks) {
    switch (block.kind) {
      case "h1":
        state.cursorY -= 6;
        drawWrapped(state, block.text, bold, 20, LINE_HEIGHT_H1);
        break;
      case "h2":
        state.cursorY -= 4;
        drawWrapped(state, block.text, bold, 16, LINE_HEIGHT_H2);
        break;
      case "h3":
        state.cursorY -= 2;
        drawWrapped(state, block.text, bold, 13, LINE_HEIGHT_H3);
        break;
      case "p":
        drawWrapped(state, block.text, body, 11, LINE_HEIGHT_BODY);
        state.cursorY -= PARAGRAPH_GAP;
        break;
      case "ul":
        for (const item of block.items) {
          ensureSpace(state, LINE_HEIGHT_BODY);
          state.cursorY -= LINE_HEIGHT_BODY;
          state.page.drawText("•", {
            x: MARGIN_X,
            y: state.cursorY,
            size: 11,
            font: body,
            color: rgb(0.4, 0.4, 0.45),
          });
          const maxWidth = PAGE_WIDTH - MARGIN_X * 2 - 14;
          const wrapped = wrapText(stripInline(item), body, 11, maxWidth);
          if (wrapped.length > 0) {
            state.page.drawText(wrapped[0], {
              x: MARGIN_X + 14,
              y: state.cursorY,
              size: 11,
              font: body,
              color: rgb(0.1, 0.1, 0.12),
            });
            for (let k = 1; k < wrapped.length; k += 1) {
              ensureSpace(state, LINE_HEIGHT_BODY);
              state.cursorY -= LINE_HEIGHT_BODY;
              state.page.drawText(wrapped[k], {
                x: MARGIN_X + 14,
                y: state.cursorY,
                size: 11,
                font: body,
                color: rgb(0.1, 0.1, 0.12),
              });
            }
          }
        }
        state.cursorY -= PARAGRAPH_GAP;
        break;
      case "ol":
        for (let idx = 0; idx < block.items.length; idx += 1) {
          const item = block.items[idx];
          ensureSpace(state, LINE_HEIGHT_BODY);
          state.cursorY -= LINE_HEIGHT_BODY;
          const marker = `${idx + 1}.`;
          state.page.drawText(marker, {
            x: MARGIN_X,
            y: state.cursorY,
            size: 11,
            font: bold,
            color: rgb(0.4, 0.4, 0.45),
          });
          const markerWidth = bold.widthOfTextAtSize(`${marker} `, 11);
          const offset = Math.max(18, markerWidth + 2);
          const maxWidth = PAGE_WIDTH - MARGIN_X * 2 - offset;
          const wrapped = wrapText(stripInline(item), body, 11, maxWidth);
          if (wrapped.length > 0) {
            state.page.drawText(wrapped[0], {
              x: MARGIN_X + offset,
              y: state.cursorY,
              size: 11,
              font: body,
              color: rgb(0.1, 0.1, 0.12),
            });
            for (let k = 1; k < wrapped.length; k += 1) {
              ensureSpace(state, LINE_HEIGHT_BODY);
              state.cursorY -= LINE_HEIGHT_BODY;
              state.page.drawText(wrapped[k], {
                x: MARGIN_X + offset,
                y: state.cursorY,
                size: 11,
                font: body,
                color: rgb(0.1, 0.1, 0.12),
              });
            }
          }
        }
        state.cursorY -= PARAGRAPH_GAP;
        break;
      case "code": {
        const codeLines = block.text.split("\n");
        for (const raw of codeLines) {
          ensureSpace(state, LINE_HEIGHT_BODY);
          state.cursorY -= LINE_HEIGHT_BODY;
          state.page.drawText(raw.replace(/\t/g, "  ").slice(0, 200), {
            x: MARGIN_X,
            y: state.cursorY,
            size: 10,
            font: mono,
            color: rgb(0.2, 0.2, 0.25),
          });
        }
        state.cursorY -= PARAGRAPH_GAP;
        break;
      }
      case "hr":
        ensureSpace(state, 12);
        state.cursorY -= 6;
        state.page.drawLine({
          start: { x: MARGIN_X, y: state.cursorY },
          end: { x: PAGE_WIDTH - MARGIN_X, y: state.cursorY },
          thickness: 0.5,
          color: rgb(0.7, 0.7, 0.75),
        });
        state.cursorY -= 6;
        break;
      case "blank":
        state.cursorY -= PARAGRAPH_GAP;
        break;
      default:
        break;
    }
  }

  if (input.footer) {
    for (const p of state.pdf.getPages()) {
      p.drawText(input.footer, {
        x: MARGIN_X,
        y: 32,
        size: 8,
        font: body,
        color: rgb(0.55, 0.55, 0.6),
      });
    }
  }

  return await pdf.save();
}
