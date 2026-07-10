import pc from "picocolors";

const LOGO = [
  "██████╗  ██████╗  ██████╗██████╗ ███╗   ███╗ ██████╗██████╗ ",
  "██╔══██╗██╔═══██╗██╔════╝╚════██╗████╗ ████║██╔════╝██╔══██╗",
  "██║  ██║██║   ██║██║      █████╔╝██╔████╔██║██║     ██████╔╝",
  "██║  ██║██║   ██║██║     ██╔═══╝ ██║╚██╔╝██║██║     ██╔═══╝ ",
  "██████╔╝╚██████╔╝╚██████╗███████╗██║ ╚═╝ ██║╚██████╗██║     ",
  "╚═════╝  ╚═════╝  ╚═════╝╚══════╝╚═╝     ╚═╝ ╚═════╝╚═╝     ",
];

const COMPACT = [
  "     _         ___               ",
  "  __| |___  __|_  )_ __  __ _ __ ",
  " / _` / _ \\/ _|/ /| '  \\/ _| '_ \\",
  " \\__,_\\___/\\__/___|_|_|_\\__| .__/",
  "                           |_|   ",
];

const SHADES = [pc.cyan, pc.cyan, pc.blue, pc.blue, pc.cyan, pc.cyan];
const POWERED_BY = "meerutcodehub team";

function divider(width = 58): string {
  return pc.dim("─".repeat(width));
}

/** Full ASCII banner with tagline (use on tool launch). */
export function printBanner(): void {
  process.stdout.write("\n");
  LOGO.forEach((line, index) => {
    const color = SHADES[index] ?? pc.cyan;
    process.stdout.write(`  ${pc.bold(color(line))}\n`);
  });
  process.stdout.write(`\n  ${divider()}\n`);
  process.stdout.write(
    `  ${pc.dim("powered by")}  ${pc.bold(pc.cyan(POWERED_BY))}\n\n`
  );
}

/** Compact banner for narrow terminals or sub-screens. */
export function printCompactBanner(): void {
  process.stdout.write("\n");
  for (const line of COMPACT) {
    process.stdout.write(`  ${pc.bold(pc.cyan(line))}\n`);
  }
  process.stdout.write(`  ${pc.dim(`powered by ${POWERED_BY}`)}\n\n`);
}

/** Install/first-run card sized for npm output. */
export function printInstallBanner(): void {
  const border = pc.cyan("╭────────────────────────────────────────────╮");
  const footer = pc.cyan("╰────────────────────────────────────────────╯");
  process.stdout.write("\n");
  process.stdout.write(`${border}\n`);
  process.stdout.write(
    `${pc.cyan("│")} ${pc.bold("doc2mcp CLI")} ${pc.dim("is ready")}                    ${pc.cyan("│")}\n`
  );
  process.stdout.write(
    `${pc.cyan("│")} ${pc.dim("Turn docs into MCP servers from terminal")} ${pc.cyan("│")}\n`
  );
  process.stdout.write(`${pc.cyan("│")}                                            ${pc.cyan("│")}\n`);
  process.stdout.write(
    `${pc.cyan("│")} ${pc.bold("Start:")} ${pc.green("doc2mcp login")}                    ${pc.cyan("│")}\n`
  );
  process.stdout.write(
    `${pc.cyan("│")} ${pc.bold("Convert:")} ${pc.green("doc2mcp https://docs.site")}     ${pc.cyan("│")}\n`
  );
  process.stdout.write(`${footer}\n\n`);
}
