#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";

function printInstallBanner() {
  process.stdout.write(`
\x1b[36m╭────────────────────────────────────────────╮\x1b[0m
\x1b[36m│\x1b[0m \x1b[1mdocs4llm CLI\x1b[0m is ready                    \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m Turn docs into MCP servers from terminal \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m                                            \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m Start:   \x1b[32mdocs4llm login\x1b[0m                    \x1b[36m│\x1b[0m
\x1b[36m│\x1b[0m Convert: \x1b[32mdocs4llm https://docs.site\x1b[0m        \x1b[36m│\x1b[0m
\x1b[36m╰────────────────────────────────────────────╯\x1b[0m

`);
}

function isGlobalInstall() {
  return (
    process.env.npm_config_global === "true" ||
    process.env.npm_config_location === "global"
  );
}

function npmGlobalBin() {
  try {
    const prefix = execFileSync("npm", ["prefix", "-g"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return path.join(prefix, "bin");
  } catch {
    return "";
  }
}

printInstallBanner();

if (isGlobalInstall()) {
  const binDir = npmGlobalBin();
  const pathEntries = (process.env.PATH || "").split(path.delimiter);
  if (binDir && !pathEntries.includes(binDir)) {
    process.stdout.write(`
docs4llm installed, but npm's global bin is not on your PATH.

Run this once for zsh:
  echo 'export PATH="${binDir}:$PATH"' >> ~/.zshrc
  source ~/.zshrc

Then try:
  docs4llm login

Quick alternative (no PATH setup):
  npx docs4llm login

For pnpm global installs, run:
  pnpm setup
  source ~/.zshrc

`);
  }
}
