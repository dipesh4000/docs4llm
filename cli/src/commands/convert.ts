import pc from "picocolors";
import { apiFetch, printError } from "../api.js";
import { ensureLoggedIn } from "./login.js";
import { promptInstall } from "./install.js";

type ConvertResponse = { id: string };

type ProjectDetail = {
  project: {
    id: string;
    name: string;
    sourceUrl: string | null;
    status: string;
    logs: Array<{ message: string; level: string; phase?: string }>;
  };
  mcp: {
    url: string;
    token: string;
    serverName: string;
  } | null;
  install: {
    cursor: Record<string, unknown>;
    vscode: Record<string, unknown>;
    windsurf: Record<string, unknown>;
    claude: Record<string, unknown>;
    serverName: string;
  } | null;
};

type ConvertOptions = {
  offerInstall: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function printStatus(detail: ProjectDetail): void {
  const { project } = detail;
  process.stdout.write(
    `\r${pc.cyan("Status:")} ${project.status.padEnd(12)} ${pc.dim(project.name)}`
  );
}

export async function convertUrlToProject(
  sourceUrl: string,
  options: ConvertOptions = { offerInstall: true }
): Promise<ProjectDetail | null> {
  await ensureLoggedIn();

  process.stdout.write(`${pc.bold("Converting")} ${sourceUrl}\n`);

  const created = await apiFetch<ConvertResponse>("/api/cli/convert", {
    method: "POST",
    body: JSON.stringify({ sourceUrl }),
  });

  process.stdout.write(`${pc.dim("Project:")} ${created.id}\n`);

  let delayMs = 2000;
  const terminal = new Set(["ready", "error"]);

  while (true) {
    const detail = await apiFetch<ProjectDetail>(
      `/api/cli/projects/${created.id}`
    );
    printStatus(detail);

    if (terminal.has(detail.project.status)) {
      process.stdout.write("\n");
      break;
    }

    await sleep(delayMs);
    delayMs = Math.min(delayMs + 1000, 10_000);
  }

  const finalDetail = await apiFetch<ProjectDetail>(
    `/api/cli/projects/${created.id}`
  );

  if (finalDetail.project.status === "error") {
    const lastLog = finalDetail.project.logs.at(-1);
    process.stderr.write(
      `${pc.red("Conversion failed.")}${lastLog ? ` ${lastLog.message}` : ""}\n`
    );
    process.exitCode = 1;
    return null;
  }

  if (!finalDetail.mcp || !finalDetail.install) {
    process.stderr.write(`${pc.red("MCP ready but missing install bundle.")}\n`);
    process.exitCode = 1;
    return null;
  }

  process.stdout.write(`\n${pc.green("MCP ready")}\n`);
  process.stdout.write(`${pc.bold("Server:")} ${finalDetail.mcp.serverName}\n`);
  process.stdout.write(`${pc.bold("URL:")} ${finalDetail.mcp.url}\n`);
  process.stdout.write(`${pc.bold("Token:")} ${finalDetail.mcp.token}\n`);
  process.stdout.write(
    `${pc.dim("Your project token is shown above. Marketplace users need their own token: doc2mcp token create")}\n`
  );

  if (options.offerInstall) {
    await promptInstall(finalDetail.install);
  }

  return finalDetail;
}

export async function runConvert(sourceUrl: string): Promise<void> {
  try {
    await convertUrlToProject(sourceUrl, { offerInstall: true });
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}

export async function runList(): Promise<void> {
  try {
    await ensureLoggedIn();
    const data = await apiFetch<{
      projects: Array<{
        id: string;
        name: string;
        sourceUrl: string | null;
        status: string;
        source: string;
      }>;
    }>("/api/cli/projects");

    if (data.projects.length === 0) {
      process.stdout.write(`${pc.dim("No projects yet.")}\n`);
      return;
    }

    for (const project of data.projects) {
      process.stdout.write(
        `${pc.bold(project.name)} ${pc.dim(`[${project.status}]`)} ${project.source}\n`
      );
      process.stdout.write(`  ${pc.dim(project.id)} ${project.sourceUrl ?? ""}\n`);
    }
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}
