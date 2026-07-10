import Image from "next/image";
import { Doc2McpMark } from "@/components/doc2mcp/logo";
import { MCP_TOOL_ICONS } from "@/lib/config/mcp-tool-icons";
import { cn } from "@/lib/utils";

const TOOL_ICONS = [
  ...MCP_TOOL_ICONS,
  { name: "Zed", src: "/icons/tools/zedindustries.svg" },
] as const;

const MCP_SNIPPET = `{
  "mcpServers": {
    "doc2mcp": {
      "url": "https://doc2mcp.site/api/mcp/…/mcp",
      "headers": { "Authorization": "Bearer …" }
    }
  }
}`;

export function LoginHeroPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between",
        className
      )}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover"
        fill
        priority
        sizes="50vw"
        src="/auth/login-hero.png"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/92 via-[#1e3a8a]/78 to-[#4285f4]/55"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(138,180,248,0.25),transparent_45%)]"
      />

      <div className="relative z-10 flex flex-col gap-8 p-10 xl:p-14">
        <div className="flex items-center gap-2.5">
          <Doc2McpMark size={40} />
          <span className="font-display font-semibold text-xl tracking-tight text-white">
            doc<span className="text-[#8ab4f8]">2</span>mcp
          </span>
        </div>

        <div className="max-w-lg space-y-4">
          <p className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[10px] text-white/90 uppercase tracking-[0.14em] backdrop-blur-sm">
            Docs → MCP → Your IDE
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Sign in once.
            <br />
            Ship MCP servers in seconds.
          </h2>
          <p className="text-sm leading-relaxed text-white/80 xl:text-base">
            Turn any documentation URL into a hosted Model Context Protocol
            server — ready for Cursor, Claude, VS Code, Windsurf, and OpenAI
            agents.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {TOOL_ICONS.map((tool) => (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-md"
              key={tool.name}
            >
              <Image
                alt=""
                aria-hidden="true"
                className="size-4 shrink-0"
                height={16}
                src={tool.src}
                width={16}
              />
              <span className="text-xs font-medium">{tool.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-10 pt-0 xl:p-14 xl:pt-0">
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0b1020]/75 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 border-white/10 border-b px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[11px] text-white/60">
              .cursor/mcp.json
            </span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-[#a5f3fc] xl:text-xs">
            <code>{MCP_SNIPPET}</code>
          </pre>
        </div>
        <p className="mt-4 text-center text-[11px] text-white/55">
          Login · convert docs · paste config · start coding with real context
        </p>
      </div>
    </div>
  );
}

export function LoginHeroStrip() {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/60 lg:hidden">
      <div className="relative h-36 w-full sm:h-44">
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src="/auth/login-hero.png"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/90 to-[#4285f4]/70"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <p className="font-display text-lg font-semibold text-white">
            Docs to MCP for every AI editor
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TOOL_ICONS.slice(0, 4).map((tool) => (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white/90"
                key={tool.name}
              >
                <Image
                  alt=""
                  aria-hidden="true"
                  className="size-3"
                  height={12}
                  src={tool.src}
                  width={12}
                />
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
