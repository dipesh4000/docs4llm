"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Cpu, FolderGit, ShieldCheck, Workflow } from "lucide-react";
import type { ApiGraphEdge, ApiGraphNode } from "@/types/platform";

const nodeColors: Record<string, string> = {
  endpoint: "#a78bfa", // violet
  resource: "#06b6d4", // cyan
  auth: "#f59e0b", // amber
  workflow: "#10b981", // emerald
};

const TAB_ICONS = {
  topology: FolderGit,
  auth: ShieldCheck,
  workflows: Workflow,
};

export function ApiGraph({
  nodes: initialNodes,
  edges: initialEdges,
}: {
  nodes: ApiGraphNode[];
  edges: ApiGraphEdge[];
}) {
  const [activeTab, setActiveTab] = useState<"topology" | "auth" | "workflows">(
    "topology"
  );

  // Dynamically compute nodes/edges based on the active tab for a magical experience!
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (activeTab === "auth") {
      // Auth flow: Create artificial central auth nodes and link endpoints to them!
      const authTypes = new Set<string>();
      for (const n of initialNodes) {
        if (n.data?.auth && n.data.auth !== "none") {
          authTypes.add(String(n.data.auth));
        }
      }

      const authNodes: ApiGraphNode[] = Array.from(authTypes).map(
        (type, idx) => ({
          id: `auth-gate-${type}`,
          type: "auth",
          label: `${type.toUpperCase()} Auth Gate`,
          position: { x: 300, y: 150 + idx * 120 },
          data: {},
        })
      );

      const endpointNodes: ApiGraphNode[] = initialNodes
        .filter((n) => n.type === "endpoint")
        .map((n, idx) => ({
          ...n,
          position: { x: 600, y: 80 + idx * 100 },
        }));

      const newEdges: ApiGraphEdge[] = [];
      for (const n of endpointNodes) {
        const auth = n.data?.auth;
        if (auth && auth !== "none") {
          newEdges.push({
            id: `edge-auth-${n.id}`,
            source: `auth-gate-${auth}`,
            target: n.id,
            label: "Requires",
            animated: true,
          });
        }
      }

      return {
        filteredNodes: [...authNodes, ...endpointNodes],
        filteredEdges: newEdges,
      };
    }

    if (activeTab === "workflows") {
      // Workflow graph: Showcase step-by-step sequential nodes
      const workflowNodes: ApiGraphNode[] = initialNodes
        .filter((n) => n.type === "endpoint" || n.type === "workflow")
        .map((n, idx) => ({
          ...n,
          position: { x: 150 + idx * 180, y: 200 + (idx % 2 === 0 ? 40 : -40) },
        }));

      const newEdges: ApiGraphEdge[] = [];
      for (let i = 0; i < workflowNodes.length - 1; i++) {
        const current = workflowNodes[i];
        const next = workflowNodes[i + 1];
        if (current && next) {
          newEdges.push({
            id: `edge-wf-${String(i)}`,
            source: current.id,
            target: next.id,
            label: "Next Step",
            animated: true,
          });
        }
      }

      return {
        filteredNodes: workflowNodes,
        filteredEdges: newEdges,
      };
    }

    // Default Topology: Render the default nodes and edges
    return {
      filteredNodes: initialNodes,
      filteredEdges: initialEdges,
    };
  }, [activeTab, initialNodes, initialEdges]);

  const flowNodes: Node[] = filteredNodes.map((n) => {
    const isWf = n.type === "workflow";
    const isAuth = n.type === "auth";
    const color = nodeColors[n.type] ?? "#6366f1";

    return {
      id: n.id,
      type: "default",
      position: n.position,
      data: {
        label: (
          <div className="px-3 py-2 text-left relative overflow-hidden group">
            {/* Custom Neon Border/Glow effect */}
            <div
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
              style={{ background: color }}
            />
            <div className="flex items-center gap-2 relative z-10">
              {isAuth ? (
                <ShieldCheck className="size-3.5 text-amber-400" />
              ) : isWf ? (
                <Workflow className="size-3.5 text-emerald-400" />
              ) : (
                <Cpu className="size-3.5 text-violet-400" />
              )}
              <span className="font-mono text-[10px] font-semibold text-white/90 truncate tracking-wide">
                {n.label}
              </span>
            </div>
            {typeof n.data?.description === "string" && n.data.description && (
              <p className="mt-1 font-sans text-[8px] text-muted-foreground leading-normal line-clamp-1 relative z-10">
                {String(n.data.description)}
              </p>
            )}
          </div>
        ),
      },
      style: {
        background: "rgba(10, 10, 12, 0.8)",
        color: "white",
        border: `1px solid ${color}35`,
        borderRadius: 12,
        fontSize: 10,
        boxShadow: `0 0 20px ${color}15`,
        minWidth: 150,
        maxWidth: 220,
        padding: 0,
        overflow: "hidden",
      },
    };
  });

  const flowEdges: Edge[] = filteredEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated ?? true,
    style: {
      stroke:
        activeTab === "auth"
          ? "#f59e0b80"
          : activeTab === "workflows"
            ? "#10b98180"
            : "#a78bfa80",
      strokeWidth: 1.5,
    },
  }));

  return (
    <div className="h-full w-full bg-[#0a0a14] relative flex flex-col">
      {/* Dynamic Tab Switcher */}
      <div className="absolute top-3 left-3 z-20 flex gap-1 rounded-xl border border-white/5 bg-black/60 p-1 backdrop-blur-xl">
        {(["topology", "auth", "workflows"] as const).map((tab) => {
          const Icon = TAB_ICONS[tab];
          const active = activeTab === tab;
          return (
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] transition-all capitalize ${
                active
                  ? "bg-violet-600/20 border border-violet-500/20 text-violet-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              <Icon className="size-3.5" />
              {tab === "topology"
                ? "API Topology"
                : tab === "auth"
                  ? "Auth Flows"
                  : "Inferred Workflows"}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0">
        <ReactFlow edges={flowEdges} fitView nodes={flowNodes}>
          <Background
            color="#ffffff03"
            gap={20}
            variant={BackgroundVariant.Lines}
          />
          <Controls className="!bg-black/80 !border-white/5 !text-white [&>button]:!bg-transparent [&>button]:!border-white/5 [&>button]:hover:!bg-white/10" />
          <MiniMap
            className="!bg-black/80 !border-white/5"
            maskColor="rgba(0, 0, 0, 0.7)"
            nodeColor={(n) => {
              const type = filteredNodes.find((x) => x.id === n.id)?.type;
              return nodeColors[type ?? "endpoint"] ?? "#6366f1";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
