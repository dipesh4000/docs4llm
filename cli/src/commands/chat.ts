import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import ora from "ora";
import pc from "picocolors";
import { ApiError, apiFetch, printError } from "../api.js";
import { printBanner } from "../banner.js";
import { renderMarkdown } from "../markdown.js";
import { convertUrlToProject } from "./convert.js";
import { ensureLoggedIn } from "./login.js";

type ProjectSummary = {
  id: string;
  name: string;
  sourceUrl: string | null;
  status: string;
  source: string;
};

type ProjectDetail = {
  project: { id: string; name: string; status: string };
  mcp: { url: string; token: string; serverName: string } | null;
};

type AskAnswer = {
  question: string;
  answer: string;
  sources?: Array<{ title: string; url: string }>;
};

type McpToolResult = {
  result?: {
    content?: Array<{ type: string; text?: string }>;
  };
  error?: { message?: string };
};

function isDocsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createPrompt() {
  return createInterface({ input, output });
}

async function readLine(prompt: string): Promise<string | null> {
  const rl = createPrompt();
  try {
    const answer = await rl.question(prompt);
    return answer.trim();
  } catch {
    return null;
  } finally {
    rl.close();
  }
}

async function listReadyProjects(): Promise<ProjectSummary[]> {
  const data = await apiFetch<{ projects: ProjectSummary[] }>(
    "/api/cli/projects"
  );
  return data.projects.filter((p) => p.status === "ready");
}

async function pickExistingProject(): Promise<ProjectDetail | null> {
  const ready = await listReadyProjects();

  if (ready.length === 0) {
    process.stdout.write(
      `${pc.yellow("No ready MCP projects yet.")} Paste a docs URL to create one.\n`
    );
    return null;
  }

  process.stdout.write(`${pc.dim("Ready MCPs")}\n`);
  ready.forEach((p, index) => {
    process.stdout.write(
      `  ${pc.cyan(String(index + 1).padStart(2, " "))}. ${pc.bold(p.name)} ${pc.dim(p.sourceUrl ?? p.id)}\n`
    );
  });

  const choice = await readLine(
    `${pc.bold(">")} choose number, paste URL, or paste project id: `
  );
  if (!choice) {
    return null;
  }

  if (isDocsUrl(choice)) {
    return await convertUrlToProject(choice, { offerInstall: true });
  }

  const chosenIndex = Number(choice);
  if (Number.isInteger(chosenIndex) && chosenIndex > 0) {
    const project = ready.at(chosenIndex - 1);
    if (project) {
      return await apiFetch<ProjectDetail>(`/api/cli/projects/${project.id}`);
    }
  }

  return await apiFetch<ProjectDetail>(`/api/cli/projects/${choice}`);
}

async function resolveProject(target?: string): Promise<ProjectDetail | null> {
  if (target) {
    if (isDocsUrl(target)) {
      return await convertUrlToProject(target, { offerInstall: true });
    }
    return await apiFetch<ProjectDetail>(`/api/cli/projects/${target}`);
  }

  process.stdout.write(
    `${pc.dim("Paste a docs URL to create a new MCP, a project id, or press Enter to pick an existing one.")}\n\n`
  );

  const first = await readLine(`${pc.cyan("›")} docs url or project id: `);
  if (!first) {
    return await pickExistingProject();
  }
  if (isDocsUrl(first)) {
    return await convertUrlToProject(first, { offerInstall: true });
  }
  return await apiFetch<ProjectDetail>(`/api/cli/projects/${first}`);
}

async function askDocs(
  mcp: { url: string; token: string },
  question: string
): Promise<AskAnswer> {
  const response = await fetch(mcp.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mcp.token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "ask_documentation", arguments: { question } },
    }),
  });

  const payload = (await response.json()) as McpToolResult;
  if (!response.ok || payload.error) {
    throw new ApiError(
      payload.error?.message ?? `MCP request failed (${response.status})`,
      response.status,
      payload
    );
  }

  const raw = payload.result?.content?.[0]?.text ?? "";
  try {
    return JSON.parse(raw) as AskAnswer;
  } catch {
    return { question, answer: raw };
  }
}

function renderAnswer(answer: AskAnswer): void {
  process.stdout.write(`\n${pc.green("●")} ${pc.bold("doc2mcp")}\n\n`);
  process.stdout.write(`${renderMarkdown(answer.answer.trim())}\n`);
  if (answer.sources && answer.sources.length > 0) {
    process.stdout.write(`\n${pc.dim("Sources")}\n`);
    for (const source of answer.sources.slice(0, 6)) {
      process.stdout.write(
        `  ${pc.cyan("•")} ${source.title}\n    ${pc.dim(source.url)}\n`
      );
    }
  }
  process.stdout.write("\n");
}

async function answerOnce(
  mcp: { url: string; token: string },
  question: string
): Promise<void> {
  const spinner = ora("Thinking…").start();
  try {
    const answer = await askDocs(mcp, question);
    spinner.stop();
    renderAnswer(answer);
  } catch (error) {
    spinner.fail("Failed to get an answer");
    printError(error);
  }
}

export async function runChat(
  target?: string,
  options: { message?: string } = {}
): Promise<void> {
  try {
    await ensureLoggedIn();

    const detail = await resolveProject(target);
    if (!detail) {
      return;
    }

    if (!detail.mcp) {
      process.stderr.write(
        `${pc.red("That project is not ready yet.")} Check: ${pc.bold("doc2mcp list")}\n`
      );
      process.exitCode = 1;
      return;
    }

    const { mcp } = detail;

    if (options.message) {
      await answerOnce(mcp, options.message);
      return;
    }

    printBanner();
    const title = ` doc2mcp chat · ${detail.project.name} `;
    const bar = "─".repeat(title.length);
    process.stdout.write(`\n${pc.cyan(`╭${bar}╮`)}\n`);
    process.stdout.write(`${pc.cyan("│")}${pc.bold(title)}${pc.cyan("│")}\n`);
    process.stdout.write(`${pc.cyan(`╰${bar}╯`)}\n`);
    process.stdout.write(
      `${pc.dim("Ask anything about these docs. Type /exit to quit.")}\n\n`
    );

    let active = true;
    while (active) {
      const question = await readLine(`${pc.cyan("›")} `);
      if (question === null) {
        active = false;
        break;
      }

      const trimmed = question.trim();
      if (!trimmed) {
        continue;
      }
      if (trimmed === "/exit" || trimmed === "/quit") {
        active = false;
        break;
      }

      await answerOnce(mcp, trimmed);
    }

    process.stdout.write(
      `\n${pc.dim("Bye — your docs MCP stays live for your editor.")}\n`
    );
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}
