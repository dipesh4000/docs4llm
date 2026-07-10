"use client";

export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden bg-background"
    >
      {/* Drifting gradient orbs (lighter tints in light mode) */}
      <div className="absolute -top-[35%] left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[150px] [animation:bg-drift-a_15s_ease-in-out_infinite] dark:bg-violet-600/20" />
      <div className="absolute top-[12%] -right-[15%] size-[640px] rounded-full bg-sky-500/8 blur-[130px] [animation:bg-drift-c_19s_ease-in-out_infinite] dark:bg-sky-500/12" />
      <div className="absolute -bottom-[28%] -left-[10%] size-[560px] rounded-full bg-fuchsia-500/8 blur-[120px] [animation:bg-drift-b_17s_ease-in-out_infinite] dark:bg-fuchsia-600/10" />

      {/* Top spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -8%, oklch(0.6 0.2 290 / 0.12), transparent 60%)",
        }}
      />

      {/* Bottom glow for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 110%, oklch(0.6 0.18 250 / 0.1), transparent 60%)",
        }}
      />

      {/* Panning grid — uses currentColor so it flips with the theme */}
      <div
        className="absolute inset-0 text-foreground opacity-[0.035] [animation:grid-pan_22s_linear_infinite] dark:opacity-[0.045]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px),
            linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Scanning beam */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent [animation:beam-sweep_9s_linear_infinite]" />
    </div>
  );
}
