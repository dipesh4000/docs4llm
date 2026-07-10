import open from "open";
import ora from "ora";
import pc from "picocolors";
import { apiFetch, printError } from "../api.js";
import { getApiUrl } from "../config.js";
import { loadConfig, saveConfig } from "../store.js";

type AuthStartResponse = {
  deviceCode: string;
  userCode: string;
  verifyUrl: string;
  expiresIn: number;
  interval: number;
};

type AuthPollResponse =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "denied" }
  | { status: "already_delivered"; message?: string }
  | {
      status: "approved";
      token: string;
      user: { id: string; email: string; name: string | null };
    };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runLogin(): Promise<void> {
  const config = await loadConfig();
  const spinner = ora("Starting device authorization…").start();

  try {
    const start = await apiFetch<AuthStartResponse>("/api/cli/auth/start", {
      method: "POST",
      auth: false,
      body: JSON.stringify({}),
    });

    spinner.stop();
    process.stdout.write(
      `\n${pc.cyan("Open this link to authorize:")}\n${pc.bold(start.verifyUrl)}\n\n`
    );
    process.stdout.write(
      `${pc.dim("Code:")} ${pc.bold(start.userCode)}  ${pc.dim("(also shown in browser)")}\n\n`
    );

    try {
      await open(start.verifyUrl);
    } catch {
      process.stdout.write(
        `${pc.yellow("Could not auto-open browser. Open the link manually.")}\n\n`
      );
    }

    const pollSpinner = ora("Waiting for approval…").start();
    const deadline = Date.now() + start.expiresIn * 1000;
    const intervalMs = start.interval * 1000;

    while (Date.now() < deadline) {
      await sleep(intervalMs);

      const poll = await apiFetch<AuthPollResponse>("/api/cli/auth/poll", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ deviceCode: start.deviceCode }),
      });

      if (poll.status === "pending") {
        continue;
      }

      if (poll.status === "approved") {
        pollSpinner.succeed("Authorized");
        await saveConfig({
          apiUrl: config.apiUrl || getApiUrl(),
          token: poll.token,
          user: poll.user,
        });
        process.stdout.write(
          `${pc.green("Logged in as")} ${poll.user.email}\n`
        );
        return;
      }

      if (poll.status === "denied") {
        pollSpinner.fail("Authorization denied");
        process.exitCode = 1;
        return;
      }

      pollSpinner.fail("Authorization expired");
      process.exitCode = 1;
      return;
    }

    pollSpinner.fail("Authorization timed out");
    process.exitCode = 1;
  } catch (error) {
    spinner.fail("Login failed");
    printError(error);
    process.exitCode = 1;
  }
}

export async function ensureLoggedIn(): Promise<void> {
  const config = await loadConfig();
  if (!config.token) {
    await runLogin();
    const next = await loadConfig();
    if (!next.token) {
      throw new Error("Login required");
    }
  }
}
