import { motion } from "framer-motion";

const LOGO = `██████╗  ██████╗  ██████╗██████╗ ███╗   ███╗ ██████╗██████╗ 
██╔══██╗██╔═══██╗██╔════╝╚════██╗████╗ ████║██╔════╝██╔══██╗
██║  ██║██║   ██║██║      █████╔╝██╔████╔██║██║     ██████╔╝
██║  ██║██║   ██║██║     ██╔═══╝ ██║╚██╔╝██║██║     ██╔═══╝ 
██████╔╝╚██████╔╝╚██████╗███████╗██║ ╚═╝ ██║╚██████╗██║     
╚═════╝  ╚═════╝  ╚═════╝╚══════╝╚═╝     ╚═╝ ╚═════╝╚═╝     `;

export const Greeting = () => {
  return (
    <div className="flex w-full max-w-2xl flex-col px-4" key="overview">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-emerald-500/20 bg-zinc-950 shadow-2xl"
        initial={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 border-white/5 border-b bg-zinc-900/80 px-4 py-2.5">
          <span className="size-3 rounded-full bg-red-500/80" />
          <span className="size-3 rounded-full bg-yellow-500/80" />
          <span className="size-3 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-white/40 text-xs">
            doc2mcp — chat
          </span>
        </div>

        <div className="p-5 font-mono">
          <pre className="no-scrollbar overflow-x-auto text-[7px] text-cyan-400 leading-[1.15] sm:text-[10px] md:text-xs">
            {LOGO}
          </pre>
          <div className="mt-3 text-emerald-400/70 text-xs">
            powered by{" "}
            <span className="text-emerald-300">meerutcodehub team</span>
          </div>

          <div className="mt-5 flex items-start gap-2 text-sm">
            <span className="select-none text-emerald-400">$</span>
            <span className="text-zinc-300">
              Ask anything — or toggle doc2mcp and paste a docs URL to build an
              MCP.
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="select-none text-emerald-400">{">"}</span>
            <motion.span
              animate={{ opacity: [1, 0.15, 1] }}
              className="inline-block h-4 w-2 bg-emerald-400/80"
              transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
