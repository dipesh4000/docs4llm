#!/usr/bin/env node
/**
 * Posts a CodeRabbit-style AI code review on the current GitHub PR.
 * Used by .github/workflows/pr-ai-review.yml
 *
 * Requires: GEMINI_API_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER,
 *           BASE_SHA, HEAD_SHA
 *
 * Optional: GEMINI_MODEL, PR_TITLE, PR_BODY, BASE_REF, HEAD_REF, REVIEW_DEEP=1
 *
 * Output:
 * - Summary issue comment (upserted via MARKER)
 * - Inline review comments on changed lines (must_fix / should_fix)
 * - REQUEST_CHANGES when any must_fix remains; otherwise COMMENT/APPROVE
 */

const MARKER = "<!-- docs4llm-ai-review -->";
const INLINE_MARKER = "<!-- docs4llm-ai-inline -->";
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const MAX_DIFF_CHARS = Number(process.env.REVIEW_MAX_DIFF_CHARS ?? 180_000);
const DEEP_REVIEW = process.env.REVIEW_DEEP === "1";
const MAX_INLINE_COMMENTS = Number(process.env.REVIEW_MAX_INLINE ?? 25);

const apiKey = process.env.GEMINI_API_KEY;
const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const prNumber = process.env.PR_NUMBER;
const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA;
const baseRef = process.env.BASE_REF ?? "staging";
const headRef = process.env.HEAD_REF ?? "HEAD";

const EXCLUDE_SUFFIXES = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
];
const EXCLUDE_EXACT = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
]);

const PRIORITY_PREFIXES = [
  "app/api/",
  "app/(chat)/api/",
  "app/(auth)/",
  "lib/",
  "services/",
  "cli/src/",
  "scripts/",
  "vercel.json",
  "proxy.ts",
  "middleware.ts",
  ".github/workflows/",
];

const SECRET_PATTERNS = [
  {
    id: "openai_key",
    label: "Possible OpenAI-style API key",
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "google_api_key",
    label: "Possible Google API key",
    regex: /\bAIza[0-9A-Za-z\-_]{20,}\b/g,
  },
  {
    id: "github_token",
    label: "Possible GitHub token",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
  },
  {
    id: "docs4llm_token",
    label: "Possible docs4llm token",
    regex: /\bd2mcp_(?:pat|usr)_[A-Za-z0-9]{16,}\b/g,
  },
  {
    id: "postgres_url",
    label: "Postgres connection string with credentials",
    regex: /postgres(?:ql)?:\/\/[^\s'"]+:[^\s'"]+@/gi,
  },
  {
    id: "jwt",
    label: "Possible JWT / service role key",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    id: "private_key",
    label: "Private key block",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    id: "razorpay",
    label: "Possible Razorpay secret",
    regex: /\brzp_(?:live|test)_[A-Za-z0-9]{10,}\b/g,
  },
];

const DOCS4LLM_CHECKLIST = [
  "Auth/session checks on new or changed mutating API routes",
  "Authorization: callers cannot act on another user's/team's resources",
  "MCP access via resolveMcpProject + token verification (not bypassed)",
  "No secrets, .env*, or real credentials committed",
  "vercel.json functions paths match existing route.ts files",
  "QStash worker URL uses getDocs4LlmBaseUrl (not hardcoded localhost in prod paths)",
  "Razorpay webhooks verify signatures before trusting payload",
  "No new orphaned legacy MCP REST routes (/pages, /ask, /search, etc.)",
  "CLI routes under /api/cli/* remain backward compatible when changed",
  "Next.js: uncached auth()/cookies()/headers() behind Suspense or connection()",
  "SQL/migrations: RLS policies and idempotent DDL when touching tables",
];

if (!apiKey) {
  console.log("GEMINI_API_KEY not set — skipping AI review.");
  process.exit(0);
}

if (!(token && repo && prNumber && baseSha && headSha)) {
  console.error("Missing required env vars for PR review.");
  process.exit(1);
}

const { execSync } = await import("node:child_process");

function runGit(command) {
  try {
    return execSync(command, {
      encoding: "utf8",
      maxBuffer: 25 * 1024 * 1024,
    }).trim();
  } catch {
    return "";
  }
}

function shouldExcludeFile(filePath) {
  if (EXCLUDE_EXACT.has(filePath)) {
    return true;
  }
  return EXCLUDE_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

function filePriority(filePath) {
  const idx = PRIORITY_PREFIXES.findIndex((prefix) =>
    filePath.startsWith(prefix)
  );
  return idx === -1 ? PRIORITY_PREFIXES.length + 1 : idx;
}

function parseNameStatus(raw) {
  if (!raw) {
    return [];
  }
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      const status = parts[0] ?? "";
      if (status.startsWith("R") && parts.length >= 3) {
        return { status, path: parts[2], oldPath: parts[1] };
      }
      return { status, path: parts[1] ?? "", oldPath: null };
    })
    .filter((entry) => entry.path && !shouldExcludeFile(entry.path));
}

function getChangedFiles() {
  const raw = runGit(`git diff --name-status ${baseSha}...${headSha}`);
  return parseNameStatus(raw).sort(
    (a, b) => filePriority(a.path) - filePriority(b.path)
  );
}

function buildSmartDiff(files) {
  const chunks = [];
  let used = 0;
  const included = [];
  const skipped = [];

  for (const file of files) {
    const fileDiff = runGit(
      `git diff ${baseSha}...${headSha} -- ${JSON.stringify(file.path)}`
    );
    if (!fileDiff) {
      continue;
    }

    const header = `\n### ${file.status}\t${file.path}\n`;
    const block = `${header}${fileDiff}`;

    if (used + block.length > MAX_DIFF_CHARS) {
      skipped.push(file.path);
      continue;
    }

    chunks.push(block);
    used += block.length;
    included.push(file.path);
  }

  return {
    diff: chunks.join("\n") || "",
    included,
    skipped,
    truncated: skipped.length > 0,
  };
}

/**
 * Map of file path → Set of new-file line numbers that appear in the diff
 * (needed so inline comments land on valid HEAD lines).
 */
function buildAddedLineIndex(files) {
  /** @type {Map<string, Set<number>>} */
  const index = new Map();

  for (const file of files) {
    const fileDiff = runGit(
      `git diff -U0 ${baseSha}...${headSha} -- ${JSON.stringify(file.path)}`
    );
    if (!fileDiff) {
      continue;
    }
    const lines = new Set();
    for (const hunk of fileDiff.matchAll(
      /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm
    )) {
      const start = Number(hunk[1]);
      const count = hunk[2] === undefined ? 1 : Number(hunk[2]);
      if (count === 0) {
        continue;
      }
      for (let line = start; line < start + count; line += 1) {
        lines.add(line);
      }
    }
    if (lines.size > 0) {
      index.set(file.path, lines);
    }
  }

  return index;
}

function nearestAddedLine(addedLines, requested) {
  if (!addedLines || addedLines.size === 0) {
    return null;
  }
  if (addedLines.has(requested)) {
    return requested;
  }
  let best = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const line of addedLines) {
    const dist = Math.abs(line - requested);
    if (dist < bestDist) {
      bestDist = dist;
      best = line;
    }
  }
  // Only snap within a small window so we don't mis-attribute findings.
  return bestDist <= 8 ? best : null;
}

function readHeadFile(filePath) {
  return runGit(`git show ${headSha}:${JSON.stringify(filePath)}`);
}

/**
 * Full-file context for high-priority changed files so the model can verify
 * auth/ownership/call sites instead of inventing issues from a partial hunk.
 */
function buildFullFileContext(
  files,
  { maxFiles = 18, maxChars = 120_000 } = {}
) {
  const priority = files
    .filter((f) => filePriority(f.path) <= PRIORITY_PREFIXES.length)
    .slice(0, maxFiles);
  const fallback = files
    .filter((f) => !priority.some((p) => p.path === f.path))
    .slice(0, Math.max(0, maxFiles - priority.length));
  const selected = [...priority, ...fallback];

  const chunks = [];
  let used = 0;
  const included = [];

  for (const file of selected) {
    const content = readHeadFile(file.path);
    if (!content) {
      continue;
    }
    const numbered = content
      .split("\n")
      .slice(0, 900)
      .map((line, i) => `${String(i + 1).padStart(4, " ")}|${line}`)
      .join("\n");
    const block = `\n===== FILE ${file.path} (${file.status}) =====\n${numbered}\n`;
    if (used + block.length > maxChars) {
      break;
    }
    chunks.push(block);
    used += block.length;
    included.push(file.path);
  }

  return { context: chunks.join("\n"), included };
}

function isExampleEnvFile(filePath) {
  return filePath === ".env.example" || filePath.endsWith("/.env.example");
}

function buildSecretScanDiff(files) {
  const chunks = [];
  for (const file of files) {
    if (isExampleEnvFile(file.path)) {
      continue;
    }
    const fileDiff = runGit(
      `git diff ${baseSha}...${headSha} -- ${JSON.stringify(file.path)}`
    );
    if (fileDiff) {
      chunks.push(fileDiff);
    }
  }
  return chunks.join("\n");
}

function scanDiffForSecrets(diff, files) {
  const secretDiff = files?.length ? buildSecretScanDiff(files) : diff;
  const hits = [];
  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    const matches = secretDiff.match(pattern.regex);
    if (matches?.length) {
      hits.push({
        id: pattern.id,
        label: pattern.label,
        count: matches.length,
      });
    }
  }

  const envFileTouched = files?.some(
    (file) => file.path.startsWith(".env") && !isExampleEnvFile(file.path)
  );
  if (envFileTouched) {
    hits.push({
      id: "env_file",
      label: ".env* file modified — verify no real secrets committed",
      count: 1,
    });
  }

  return hits;
}

function summarizeFiles(files) {
  const groups = {
    api: 0,
    lib: 0,
    ui: 0,
    ci: 0,
    docs: 0,
    other: 0,
  };

  for (const file of files) {
    const path = file.path;
    if (path.includes("/api/") || path.startsWith("app/api/")) {
      groups.api += 1;
    } else if (path.startsWith("lib/") || path.startsWith("services/")) {
      groups.lib += 1;
    } else if (path.startsWith("app/") || path.startsWith("components/")) {
      groups.ui += 1;
    } else if (path.startsWith(".github/")) {
      groups.ci += 1;
    } else if (path.endsWith(".md")) {
      groups.docs += 1;
    } else {
      groups.other += 1;
    }
  }

  return groups;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? text.trim();
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function normalizePriority(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    raw === "must_fix" ||
    raw === "mustfix" ||
    raw === "critical" ||
    raw === "high" ||
    raw === "blocker"
  ) {
    return "must_fix";
  }
  if (
    raw === "should_fix" ||
    raw === "shouldfix" ||
    raw === "medium" ||
    raw === "major"
  ) {
    return "should_fix";
  }
  if (
    raw === "nit" ||
    raw === "low" ||
    raw === "info" ||
    raw === "suggestion"
  ) {
    return "nit";
  }
  return "should_fix";
}

function priorityRank(priority) {
  const map = { must_fix: 0, should_fix: 1, nit: 2 };
  return map[normalizePriority(priority)] ?? 3;
}

function priorityLabel(priority) {
  const p = normalizePriority(priority);
  if (p === "must_fix") {
    return "🚨 Must fix";
  }
  if (p === "should_fix") {
    return "⚠️ Should fix";
  }
  return "💡 Nit";
}

function normalizeFindings(review) {
  const raw = Array.isArray(review.findings) ? review.findings : [];
  return raw
    .map((f) => {
      const priority = normalizePriority(f.priority ?? f.severity);
      const line =
        typeof f.line === "number"
          ? f.line
          : Number.parseInt(String(f.line ?? ""), 10) || null;
      const confidence = String(f.confidence ?? "medium").toLowerCase();
      return {
        priority,
        severity:
          priority === "must_fix"
            ? "high"
            : priority === "should_fix"
              ? "medium"
              : "low",
        file: typeof f.file === "string" ? f.file : "",
        line: Number.isFinite(line) && line > 0 ? line : null,
        title: f.title ?? "Issue",
        detail: f.detail ?? f.title ?? "",
        evidence: typeof f.evidence === "string" ? f.evidence.trim() : "",
        suggestion: typeof f.suggestion === "string" ? f.suggestion : "",
        breakRisk: typeof f.breakRisk === "string" ? f.breakRisk : "",
        confidence,
      };
    })
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

const FALSE_POSITIVE_PATTERNS = [
  /color-mix/i,
  /browser support/i,
  /font variable names/i,
  /redundant font/i,
  /documentation clarity/i,
  /MAX_INLINE_COMMENTS/i,
  /script description/i,
  /type=['"]button['"]/i,
  /lacks explicit type/i,
  /playground page removed/i,
  /redirecting to \/chat/i,
  /intentional product/i,
  /toISOString\(\)/i,
  /ISO string/i,
  /timestamptz/i,
];

function filterVerifiedFindings(findings, files) {
  const changed = new Set(files.map((f) => f.path));
  const out = [];

  for (const f of findings) {
    const priority = normalizePriority(f.priority ?? f.severity);
    const confidence = String(f.confidence ?? "medium").toLowerCase();
    const evidence = String(f.evidence ?? "").trim();
    const blob = `${f.title ?? ""} ${f.detail ?? ""} ${f.breakRisk ?? ""}`;

    if (!evidence || evidence.length < 12) {
      continue;
    }
    if (FALSE_POSITIVE_PATTERNS.some((re) => re.test(blob))) {
      continue;
    }
    if (f.file && !changed.has(f.file) && f.file !== "") {
      // allow findings only on changed files
      continue;
    }
    if (priority === "must_fix" && confidence !== "high") {
      f.priority = "should_fix";
    }
    if (String(f.file ?? "").includes("scripts/pr-ai-review")) {
      continue;
    }
    out.push(f);
  }

  const must = out
    .filter((f) => normalizePriority(f.priority) === "must_fix")
    .slice(0, 5);
  const should = out
    .filter((f) => normalizePriority(f.priority) === "should_fix")
    .slice(0, 6);
  const nits = out
    .filter((f) => normalizePriority(f.priority) === "nit")
    .slice(0, 3);
  return [...must, ...should, ...nits];
}

function formatInlineComment(finding) {
  const parts = [
    INLINE_MARKER,
    `**${priorityLabel(finding.priority)}:** ${finding.title}`,
    "",
    finding.detail,
  ];
  if (finding.evidence) {
    parts.push(
      "",
      "**Evidence:**",
      "```",
      finding.evidence.slice(0, 500),
      "```"
    );
  }
  if (finding.breakRisk) {
    parts.push("", `**Break risk:** ${finding.breakRisk}`);
  }
  if (finding.suggestion) {
    parts.push("", `**Suggested fix:** ${finding.suggestion}`);
  }
  return parts.join("\n");
}

function formatReviewMarkdown(review, context) {
  const findings = normalizeFindings(review);

  const mustFix = findings.filter((f) => f.priority === "must_fix");
  const shouldFix = findings.filter((f) => f.priority === "should_fix");
  const nits = findings.filter((f) => f.priority === "nit");

  const verdict =
    mustFix.length > 0 || context.secretHits.length > 0
      ? "request_changes"
      : (review.verdict ?? "comment");

  const verdictEmoji =
    verdict === "approve"
      ? "🟢 Approve"
      : verdict === "request_changes"
        ? "🔴 Request changes"
        : "🟡 Comment";

  let md = `**Verdict:** ${verdictEmoji}`;
  md += ` · 🚨 ${mustFix.length} must-fix · ⚠️ ${shouldFix.length} should-fix · 💡 ${nits.length} nit(s)`;
  md += "\n\n";

  if (context.secretHits.length > 0) {
    md += "### ⚠️ Pre-flight secret scan (local)\n\n";
    for (const hit of context.secretHits) {
      md += `- **${hit.label}** (${hit.count} match(es) in diff)\n`;
    }
    md += "\n";
  }

  if (findings.length > 0) {
    md += "| Priority | Location | Finding | Evidence | Break risk |\n";
    md += "| --- | --- | --- | --- | --- |\n";
    for (const f of findings.slice(0, 20)) {
      const loc = f.file ? `\`${f.file}${f.line ? `:${f.line}` : ""}\`` : "—";
      const risk = (f.breakRisk || "—").replace(/\|/g, "/");
      const evidence = (f.evidence || "—")
        .replace(/\|/g, "/")
        .replace(/\n/g, " ")
        .slice(0, 80);
      md += `| ${priorityLabel(f.priority)} | ${loc} | ${(f.title ?? "").replace(/\|/g, "/")} | ${evidence} | ${risk} |\n`;
    }
    if (findings.length > 20) {
      md += `\n_+ ${findings.length - 20} more finding(s) below._\n`;
    }
    md += "\n";
  }

  if (review.summary) {
    md += `### Summary\n\n${review.summary}\n\n`;
  }

  const sections = [
    ["must_fix", "🚨 Must fix (merge blockers)"],
    ["should_fix", "⚠️ Should fix"],
    ["nit", "💡 Nits / suggestions"],
  ];

  for (const [key, title] of sections) {
    const items = findings.filter((f) => f.priority === key);
    if (items.length === 0) {
      continue;
    }
    md += `### ${title}\n\n`;
    for (const item of items) {
      const loc = item.file
        ? `\`${item.file}${item.line ? `:${item.line}` : ""}\` — `
        : "";
      md += `- ${loc}**${item.title}** — ${item.detail}`;
      if (item.breakRisk) {
        md += `  \n  *Break risk:* ${item.breakRisk}`;
      }
      if (item.suggestion) {
        md += `  \n  *Fix:* ${item.suggestion}`;
      }
      md += "\n";
    }
    md += "\n";
  }

  if (Array.isArray(review.looksGood) && review.looksGood.length > 0) {
    md += "### Looks good\n\n";
    for (const item of review.looksGood) {
      md += `- ${item}\n`;
    }
    md += "\n";
  }

  if (review.mergeRecommendation) {
    md += `### Merge recommendation\n\n${review.mergeRecommendation}\n\n`;
  }

  md += "<details><summary>Review context</summary>\n\n";
  md += `- Base: \`${baseRef}\` (\`${baseSha.slice(0, 7)}\`)\n`;
  md += `- Head: \`${headRef}\` (\`${headSha.slice(0, 7)}\`)\n`;
  md += `- Files changed: ${context.files.length} (API ${context.groups.api}, lib/services ${context.groups.lib}, UI ${context.groups.ui}, CI ${context.groups.ci})\n`;
  md += `- Diff files sent to model: ${context.included.length}`;
  if (context.skipped.length > 0) {
    md += ` (${context.skipped.length} skipped — size limit)`;
  }
  md += `\n- Inline comments posted: ${context.inlinePosted ?? 0}`;
  md += `\n- Model: \`${MODEL}\`${DEEP_REVIEW ? " (deep)" : ""}\n`;
  md += "- Style: CodeRabbit-like must_fix / should_fix + line comments\n";
  md += "</details>\n";

  return { markdown: md.trim(), verdict, findings };
}

async function callGemini(prompt, { maxTokens = 8192 } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const maxAttempts = 4;
  let lastError = "Gemini API request failed";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    const err = await res.text();
    lastError = `Gemini API ${res.status}: ${err.slice(0, 500)}`;
    const retryable = res.status === 429 || res.status === 503;
    if (!retryable || attempt === maxAttempts) {
      throw new Error(lastError);
    }

    const delayMs = 2000 * 2 ** (attempt - 1);
    console.warn(
      `Gemini ${res.status} on attempt ${attempt}/${maxAttempts}; retrying in ${delayMs}ms`
    );
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  throw new Error(lastError);
}

async function geminiReview({
  diff,
  fileContext,
  fileContextFiles,
  prTitle,
  prBody,
  files,
  secretHits,
  groups,
}) {
  const checklist = DOCS4LLM_CHECKLIST.map((item) => `- ${item}`).join("\n");

  const fileList = files
    .slice(0, 80)
    .map((f) => `${f.status}\t${f.path}`)
    .join("\n");

  const secretContext =
    secretHits.length > 0
      ? `\nLOCAL SECRET SCAN HITS (treat as must_fix until proven false positive):\n${secretHits
          .map((h) => `- ${h.label} (${h.count})`)
          .join("\n")}\n`
      : "";

  const systemContext = `You are a principal engineer doing a REAL code review of docs4llm, in CodeRabbit style.

Product: Next.js 16 App Router + Supabase auth/Postgres + QStash + Gemini + hosted MCP at /api/mcp/{id}/mcp + CLI /api/cli/* + Razorpay.

CRITICAL PROCESS (do this before emitting any finding):
1. Read the FULL FILE CONTEXT for each changed high-priority file (line-numbered).
2. Read the DIFF to see what changed.
3. Trace callers / auth / ownership in the full file before claiming a bug.
4. Only emit a finding if you can quote evidence from the provided code.
5. If you are not sure, OMIT the finding. Silence is better than a false positive.
6. Do NOT invent auth/IDOR bugs when auth() + userId scoping is clearly present.
7. Do NOT flag intentional product decisions (route redirects, feature removals) as bugs unless they crash or leak data.
8. Do NOT flag browser-standard CSS (color-mix) or ISO timestamptz strings as must_fix without a concrete failure mode proven in this codebase.
9. Prefer 0-8 high-signal findings over a long laundry list.
${secretContext}

Priority rules:
- must_fix ONLY for proven: auth bypass, IDOR, secret leak, data loss, crash on happy path, webhook verify skip, MCP token bypass, build/prerender blockers
- should_fix for real edge bugs / weak validation that can cause wrong behavior
- nit for optional polish only (max 3). Skip documentation-only nits about this review script.

Project checklist:
${checklist}`;

  const schema = `Return ONLY valid JSON (no markdown fences) with this shape:
{
  "verdict": "approve" | "request_changes" | "comment",
  "summary": "2-4 sentences covering risk and readiness",
  "mergeRecommendation": "one sentence for maintainer",
  "findings": [
    {
      "priority": "must_fix" | "should_fix" | "nit",
      "file": "exact/path.from.diff",
      "line": 123,
      "title": "short imperative title",
      "detail": "what is wrong and why it matters",
      "evidence": "quote 1-3 lines of code from the provided context that prove the issue",
      "breakRisk": "how/where this breaks at runtime (user, API, build, data)",
      "suggestion": "concrete fix steps or patch outline",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "looksGood": ["bullet", "..."]
}

Hard rules:
- evidence is REQUIRED for every finding. No evidence => omit finding.
- confidence high required for must_fix. If medium/low, use should_fix or omit.
- Always set file + line from the numbered full-file context when possible.
- Cap findings: <=5 must_fix, <=6 should_fix, <=3 nit.
- verdict = request_changes ONLY if there is at least one high-confidence must_fix.
- If no real issues: verdict approve or comment with empty findings.`;

  const userPrompt = `${systemContext}

PR title: ${prTitle}
PR description:
${prBody?.slice(0, 3000) ?? "(none)"}

Changed files (${files.length}):
${fileList}

File areas: API=${groups.api}, lib/services=${groups.lib}, UI=${groups.ui}, CI=${groups.ci}, docs=${groups.docs}
Full-file context included for: ${fileContextFiles.join(", ") || "(none)"}

${schema}

===== FULL FILE CONTEXT (analyze first) =====
${fileContext || "(no full-file context)"}

===== DIFF (what changed) =====
${diff || "(empty diff)"}`;

  let raw = await callGemini(userPrompt, { maxTokens: 8192 });
  let parsed = extractJson(raw);

  if (!parsed && DEEP_REVIEW) {
    const securityPrompt = `${systemContext}

Focus ONLY on high-confidence must_fix security/auth/secrets/webhooks/MCP tokens/RLS/IDOR.
Omit anything without evidence quotes from the full-file context.

PR: ${prTitle}
Files:\n${fileList}

${schema}

FULL FILE CONTEXT:
${fileContext.slice(0, 90_000)}

DIFF:
${diff.slice(0, 60_000)}`;

    raw = await callGemini(securityPrompt, { maxTokens: 4096 });
    parsed = extractJson(raw);
  }

  if (!parsed) {
    return {
      verdict: secretHits.length > 0 ? "request_changes" : "comment",
      summary:
        "Automated review could not parse structured output; see raw notes below.",
      mergeRecommendation:
        secretHits.length > 0
          ? "Do not merge until secret scan hits are resolved."
          : "Human review recommended.",
      findings: secretHits.map((h) => ({
        priority: "must_fix",
        file: "",
        line: null,
        title: h.label,
        detail: `${h.count} pattern match(es) in diff`,
        evidence: "local regex secret scan hit",
        breakRisk: "Credential exposure if real secrets were committed",
        suggestion: "Rotate keys and remove secrets from git history if needed",
        confidence: "high",
      })),
      looksGood: [],
      _raw: raw.slice(0, 2000),
    };
  }

  parsed.findings = Array.isArray(parsed.findings) ? parsed.findings : [];

  for (const hit of secretHits) {
    const already = parsed.findings.some((f) =>
      String(f.title ?? f.detail ?? "")
        .toLowerCase()
        .includes(hit.id.replace(/_/g, " "))
    );
    if (!already) {
      parsed.findings.unshift({
        priority: "must_fix",
        file: "",
        line: null,
        title: hit.label,
        detail: "Detected by local pre-flight secret scan on the PR diff.",
        evidence: "local regex secret scan hit",
        breakRisk: "Leaked credentials can be abused immediately",
        suggestion:
          "Remove from the PR, rotate the credential, confirm .gitignore",
        confidence: "high",
      });
    }
  }

  parsed.findings = filterVerifiedFindings(parsed.findings, files);
  const normalized = normalizeFindings(parsed);
  parsed.findings = normalized;
  if (normalized.some((f) => f.priority === "must_fix")) {
    parsed.verdict = "request_changes";
  } else if (parsed.verdict === "request_changes") {
    parsed.verdict = normalized.length > 0 ? "comment" : "approve";
  }

  return parsed;
}

async function githubRequest(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `GitHub API ${method} ${path}: ${res.status} ${err.slice(0, 300)}`
    );
  }
  return res.status === 204 ? null : res.json();
}

async function upsertReviewComment(body) {
  const [owner, name] = repo.split("/");
  const comments = await githubRequest(
    `/repos/${owner}/${name}/issues/${prNumber}/comments?per_page=100`
  );
  const existing = comments.find((c) => c.body?.includes(MARKER));

  const fullBody = `${MARKER}\n## 🤖 docs4llm AI code review\n\n${body}\n\n_Automated review — not a substitute for human review._`;

  if (existing) {
    await githubRequest(
      `/repos/${owner}/${name}/issues/comments/${existing.id}`,
      {
        method: "PATCH",
        body: { body: fullBody },
      }
    );
    console.log("Updated existing AI review comment.");
  } else {
    await githubRequest(`/repos/${owner}/${name}/issues/${prNumber}/comments`, {
      method: "POST",
      body: { body: fullBody },
    });
    console.log("Posted AI review comment.");
  }
}

async function dismissStaleBotReviews() {
  const [owner, name] = repo.split("/");
  try {
    const reviews = await githubRequest(
      `/repos/${owner}/${name}/pulls/${prNumber}/reviews?per_page=50`
    );
    for (const review of reviews ?? []) {
      if (
        review.state === "CHANGES_REQUESTED" &&
        review.body?.includes(MARKER) &&
        review.user?.type === "Bot"
      ) {
        await githubRequest(
          `/repos/${owner}/${name}/pulls/${prNumber}/reviews/${review.id}/dismissals`,
          {
            method: "PUT",
            body: {
              message: "Superseded by a newer AI review on this PR.",
              event: "DISMISS",
            },
          }
        );
        console.log(`Dismissed stale bot review ${review.id}.`);
      }
    }
  } catch (error) {
    console.warn(
      "Could not dismiss stale reviews:",
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Post inline comments via a single pull-request review so GitHub attaches
 * them to the exact changed lines (CodeRabbit-style).
 */
async function submitInlineReview({ findings, verdict, summary }) {
  const [owner, name] = repo.split("/");
  const fullIndex = buildAddedLineIndex(getChangedFiles());

  const comments = [];
  const seen = new Set();

  for (const finding of findings) {
    if (comments.length >= MAX_INLINE_COMMENTS) {
      break;
    }
    if (!finding.file || !finding.line) {
      continue;
    }
    // Skip nits for inline noise unless deep review.
    if (finding.priority === "nit" && !DEEP_REVIEW) {
      continue;
    }

    const added = fullIndex.get(finding.file);
    const line = nearestAddedLine(added, finding.line);
    if (!line) {
      continue;
    }

    const key = `${finding.file}:${line}:${finding.priority}:${finding.title}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    comments.push({
      path: finding.file,
      line,
      side: "RIGHT",
      body: formatInlineComment(finding),
    });
  }

  const event =
    verdict === "request_changes"
      ? "REQUEST_CHANGES"
      : verdict === "approve"
        ? "APPROVE"
        : "COMMENT";

  const mustCount = findings.filter((f) => f.priority === "must_fix").length;
  const shouldCount = findings.filter(
    (f) => f.priority === "should_fix"
  ).length;

  const shortBody = [
    MARKER,
    `## 🤖 docs4llm AI review — ${
      event === "REQUEST_CHANGES"
        ? "changes requested"
        : event === "APPROVE"
          ? "approved"
          : "commented"
    }`,
    "",
    summary ?? "Automated review complete.",
    "",
    `**🚨 ${mustCount} must-fix · ⚠️ ${shouldCount} should-fix** · ${comments.length} inline comment(s).`,
    "See the summary comment for the full table.",
  ].join("\n");

  await dismissStaleBotReviews();

  try {
    await githubRequest(`/repos/${owner}/${name}/pulls/${prNumber}/reviews`, {
      method: "POST",
      body: {
        commit_id: headSha,
        body: shortBody.slice(0, 8000),
        event,
        comments,
      },
    });
    console.log(
      `Submitted PR review (${event}) with ${comments.length} inline comment(s).`
    );
    return comments.length;
  } catch (error) {
    console.warn(
      "Inline review failed, falling back to event-only review:",
      error instanceof Error ? error.message : error
    );
    try {
      await githubRequest(`/repos/${owner}/${name}/pulls/${prNumber}/reviews`, {
        method: "POST",
        body: {
          commit_id: headSha,
          body: shortBody.slice(0, 8000),
          event,
        },
      });
      console.log(`Submitted PR review (${event}) without inline comments.`);
    } catch (fallbackError) {
      console.warn(
        "Could not submit PR review event:",
        fallbackError instanceof Error ? fallbackError.message : fallbackError
      );
    }
    return 0;
  }
}

const files = getChangedFiles();
const { diff, included, skipped } = buildSmartDiff(files);
const secretHits = scanDiffForSecrets(diff, files);
const groups = summarizeFiles(files);
const prTitle = process.env.PR_TITLE ?? "";
const prBody = process.env.PR_BODY ?? "";

const { context: fileContext, included: fileContextFiles } =
  buildFullFileContext(files);

try {
  const review = await geminiReview({
    diff,
    fileContext,
    fileContextFiles,
    prTitle,
    prBody,
    files,
    secretHits,
    groups,
  });

  const findings = normalizeFindings(review);
  const { verdict } = formatReviewMarkdown(review, {
    files,
    included,
    skipped,
    secretHits,
    groups,
    inlinePosted: 0,
  });

  const inlinePosted = await submitInlineReview({
    findings,
    verdict,
    summary: review.summary,
  });

  const { markdown: finalMarkdown } = formatReviewMarkdown(review, {
    files,
    included,
    skipped,
    secretHits,
    groups,
    inlinePosted,
  });

  let body = finalMarkdown;
  if (review._raw) {
    body += `\n\n<details><summary>Raw model output (parse fallback)</summary>\n\n${review._raw}\n</details>`;
  }

  await upsertReviewComment(body);

  if (verdict === "request_changes" || secretHits.length > 0) {
    console.log("Review completed with must-fix / blocking findings.");
  } else {
    console.log("Review completed.");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await upsertReviewComment(`⚠️ AI review failed: ${message}`);
  process.exit(1);
}
