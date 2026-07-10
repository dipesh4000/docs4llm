/**
 * Crisp SVG icons for the Features section, themed for doc2mcp's
 * violet/cyan dark palette. All icons inherit `currentColor`.
 */

export function CrawlerIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 160 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crawlerGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect
        fill="url(#crawlerGlow)"
        height="84"
        opacity="0.5"
        rx="6"
        ry="6"
        width="118"
        x="21"
        y="18"
      />
      <rect height="84" rx="6" ry="6" width="118" x="21" y="18" />

      <line x1="21" x2="139" y1="34" y2="34" />
      <circle cx="29" cy="26" fill="currentColor" r="1.6" />
      <circle cx="35" cy="26" fill="currentColor" r="1.6" />
      <circle cx="41" cy="26" fill="currentColor" r="1.6" />

      <rect
        fill="currentColor"
        height="4"
        opacity="0.7"
        rx="2"
        width="36"
        x="32"
        y="44"
      />
      <rect
        fill="currentColor"
        height="3"
        opacity="0.25"
        rx="1.5"
        width="84"
        x="32"
        y="54"
      />
      <rect
        fill="currentColor"
        height="3"
        opacity="0.25"
        rx="1.5"
        width="64"
        x="32"
        y="62"
      />

      <rect
        fill="currentColor"
        height="14"
        opacity="0.12"
        rx="3"
        width="60"
        x="32"
        y="76"
      />
      <text
        fill="currentColor"
        fontFamily="ui-monospace, monospace"
        fontSize="7"
        x="38"
        y="86"
      >
        GET /docs
      </text>

      <g>
        <circle cx="118" cy="80" fill="currentColor" r="3">
          <animate
            attributeName="r"
            dur="1.8s"
            repeatCount="indefinite"
            values="3;6;3"
          />
          <animate
            attributeName="opacity"
            dur="1.8s"
            repeatCount="indefinite"
            values="1;0.2;1"
          />
        </circle>
      </g>

      {/* Spider / crawl lines */}
      <path
        d="M118 80 L 80 50 M 118 80 L 60 70 M 118 80 L 90 90"
        opacity="0.4"
      />
    </svg>
  );
}

export function ToolsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 160 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central hub */}
      <circle cx="80" cy="60" r="14" />
      <circle cx="80" cy="60" fill="currentColor" opacity="0.18" r="14" />
      <text
        fill="currentColor"
        fontFamily="var(--font-display)"
        fontSize="10"
        fontWeight="600"
        textAnchor="middle"
        x="80"
        y="63"
      >
        AI
      </text>

      {/* Surrounding tools */}
      {[
        { x: 26, y: 28, label: "list()" },
        { x: 134, y: 28, label: "get()" },
        { x: 26, y: 92, label: "search()" },
        { x: 134, y: 92, label: "ask()" },
      ].map((node) => (
        <g key={`${node.x}-${node.y}`}>
          <line opacity="0.45" x1="80" x2={node.x} y1="60" y2={node.y}>
            <animate
              attributeName="opacity"
              dur="2.4s"
              repeatCount="indefinite"
              values="0.2;0.7;0.2"
            />
          </line>
          <rect
            fill="currentColor"
            height="16"
            opacity="0.08"
            rx="3"
            width="44"
            x={node.x - 22}
            y={node.y - 8}
          />
          <rect
            height="16"
            rx="3"
            stroke="currentColor"
            strokeOpacity="0.5"
            width="44"
            x={node.x - 22}
            y={node.y - 8}
          />
          <text
            fill="currentColor"
            fontFamily="ui-monospace, monospace"
            fontSize="8"
            textAnchor="middle"
            x={node.x}
            y={node.y + 3}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RemoteMcpIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 160 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud */}
      <path d="M48 56 Q 38 56 36 46 Q 36 36 48 36 Q 54 26 68 30 Q 80 24 90 32 Q 104 32 108 42 Q 116 42 116 52 Q 116 60 106 60 L 50 60 Q 42 60 48 56 Z" />
      <text
        fill="currentColor"
        fontFamily="ui-monospace, monospace"
        fontSize="7"
        textAnchor="middle"
        x="76"
        y="50"
      >
        doc2mcp
      </text>

      {/* Cursor app */}
      <rect height="34" rx="4" width="46" x="18" y="78" />
      <text
        fill="currentColor"
        fontFamily="var(--font-display)"
        fontSize="9"
        textAnchor="middle"
        x="41"
        y="100"
      >
        Cursor
      </text>

      {/* Claude app */}
      <rect height="34" rx="4" width="46" x="96" y="78" />
      <text
        fill="currentColor"
        fontFamily="var(--font-display)"
        fontSize="9"
        textAnchor="middle"
        x="119"
        y="100"
      >
        Claude
      </text>

      {/* Connection lines */}
      <path d="M 41 78 Q 41 70 60 60" opacity="0.5">
        <animate
          attributeName="stroke-dasharray"
          dur="2s"
          repeatCount="indefinite"
          values="0,80;40,40;80,0"
        />
      </path>
      <path d="M 119 78 Q 119 70 100 60" opacity="0.5">
        <animate
          attributeName="stroke-dasharray"
          begin="0.4s"
          dur="2s"
          repeatCount="indefinite"
          values="0,80;40,40;80,0"
        />
      </path>

      {/* Token badge */}
      <rect
        fill="currentColor"
        height="10"
        opacity="0.12"
        rx="2"
        width="36"
        x="62"
        y="64"
      />
      <text
        fill="currentColor"
        fontFamily="ui-monospace, monospace"
        fontSize="6"
        textAnchor="middle"
        x="80"
        y="71"
      >
        Bearer …
      </text>
    </svg>
  );
}

export function ChatToggleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 160 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chat composer */}
      <rect height="80" rx="6" width="130" x="15" y="20" />
      <line opacity="0.3" x1="15" x2="145" y1="76" y2="76" />

      {/* Message bubble */}
      <rect
        fill="currentColor"
        height="12"
        opacity="0.1"
        rx="6"
        width="76"
        x="25"
        y="34"
      />
      <text
        fill="currentColor"
        fontFamily="ui-monospace, monospace"
        fontSize="7"
        x="32"
        y="43"
      >
        What is MCP?
      </text>

      <rect
        fill="currentColor"
        height="12"
        opacity="0.1"
        rx="6"
        width="106"
        x="29"
        y="54"
      />
      <text
        fill="currentColor"
        fontFamily="ui-monospace, monospace"
        fontSize="7"
        x="36"
        y="63"
      >
        https://docs.langchain.com
      </text>

      {/* Toggle */}
      <g transform="translate(25, 84)">
        <rect height="10" rx="5" stroke="currentColor" width="22" />
        <circle cx="16" cy="5" fill="currentColor" r="3.2">
          <animate
            attributeName="cx"
            dur="3s"
            repeatCount="indefinite"
            values="6;16;6"
          />
        </circle>
        <text
          fill="currentColor"
          fontFamily="ui-monospace, monospace"
          fontSize="6"
          x="52"
          y="8"
        >
          doc2mcp
        </text>
      </g>

      {/* Send button */}
      <circle cx="128" cy="89" fill="currentColor" opacity="0.8" r="6" />
      <path d="M 124 89 L 130 89 M 128 86 L 130 89 L 128 92" stroke="black" />
    </svg>
  );
}

export const FEATURE_ICONS = {
  deploy: CrawlerIcon,
  ai: ToolsIcon,
  collab: RemoteMcpIcon,
  security: ChatToggleIcon,
} as const;
