# Docs4LLM: Project Execution & Architecture Plan (`plan.md`)

## 1. Executive Summary & Vision

**Docs4LLM** is high-performance documentation infrastructure purpose-built for AI agents and coding assistants. It converts any public or private documentation URL (Mintlify, GitBook, Docusaurus, Nextra, OpenAPI, GitHub docs) into a secure, hosted, standards-compliant [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server in under 60 seconds.

Instead of AI assistants relying on stale pre-training weights or developers pasting snippets manually, Docs4LLM gives agents live, authenticated, cited tool interfaces directly inside their IDEs (Cursor, Claude Desktop, VS Code, Windsurf) and agent frameworks (LangChain, LangGraph, AutoGen, CrewAI).

---

## 2. Core Architectural Decisions

| Decision | Selected Strategy | Rationale |
|---|---|---|
| **Crawl Engine (Step 2)** | **Fully Autonomous Agentic Scraping (TinyFish Agent API)** | Modern doc sites are client-heavy SPAs with dynamic hydration, nested menus, and bot defenses. TinyFish's autonomous browser agent explores navigations, renders SPAs, bypasses anti-bot barriers, and yields clean, boilerplate-free Markdown. |
| **Search & Retrieval (Step 3)** | **Hybrid Heading-Aware BM25 + OpenRouter AI Analysis** | Pure vector search misses exact API tokens, routes, and flags. Pure keyword search misses intent. Hybrid BM25 with ATX heading weighting and OpenRouter Q&A delivers zero-hallucination, cited answers. |
| **Tool Generation (Step 4)** | **Standard 5 Core Tools + Compressed Custom Tools** | Standard tools (`list_pages`, `get_page`, `search`, `overview`, `ask`) give agents full doc exploration without exhausting context tokens; up to 10 compressed API tools expose high-value actions. |
| **Server Runtime** | **Streamable HTTP (JSON-RPC 2.0) with Bearer Auth** | Serverless Next.js endpoint (`/api/mcp/{id}/mcp`) secured via per-project bearer tokens, compatible with all MCP clients. |
| **Delivery Surfaces** | **Web App + npm CLI + TypeScript SDK** | Zero barrier to entry: 1-click web generation, 1-command CLI editor install, programmatic SDK for CI/CD and agent builders. |

---

## 3. End-to-End System Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. INGESTION & SOURCE RECOGNITION                                           │
│    User submits URL -> Canonicalize -> Detect doc framework / OpenAPI spec  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. AUTONOMOUS AGENTIC SCRAPING (TinyFish Agent API)                         │
│    TinyFish Agent explores navigation, hydrates SPAs, extracts Markdown      │
│    Filters headers/footers, captures code blocks and anchor URLs             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SEMANTIC INDEXING & AI ANALYSIS (OpenRouter / BM25)                      │
│    Heading hierarchy splitting -> Breadcrumb attribution -> BM25+ indexing  │
│    OpenRouter: API endpoints, auth patterns, workflows, llms.txt generation │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. DYNAMIC MCP TOOL GENERATION & MULTI-TENANT HOSTING                       │
│    Synthesize JSON schemas -> Register runtime handlers                      │
│    Host at /api/mcp/{id}/mcp with Bearer token authentication                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. MULTI-SURFACE DELIVERY                                                   │
│    Web Dashboard  │  CLI (docs4llm add)  │  TypeScript SDK  │  MCP Registry  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Deep Specification: Step 2 — Fully Autonomous Agentic Scraping (TinyFish)

### 4.1 Architecture & Integration Flow
Rather than executing brittle HTTP crawling within ephemeral serverless workers, Docs4LLM delegates the discovery and page extraction to **TinyFish's Agent API** (`client.agent`).

1. **Autonomous Exploration Session**:
   Docs4LLM initiates a job with the TinyFish Agent specifying the target documentation root URL and a structured operational objective:
   ```typescript
   import { TinyFish } from "@tiny-fish/sdk";

   const client = new TinyFish({ apiKey: process.env.TINYFISH_API_KEY });
   const scrapeJob = await client.agent.start({
     url: targetDocUrl,
     goal: `Explore the technical documentation. Traverse sidebar navigation, guide links, and API references. 
            Extract complete markdown representations of each documentation page, preserving code blocks, 
            tables, and section headers. Ignore navigation chrome, cookie modals, and footer links.`,
     options: {
       maxPages: 40,
       captureScreenshots: false,
       format: "markdown",
     }
   });
   ```

2. **Handling Dynamic SPAs & Anti-Bot Protection**:
   - TinyFish spins up cloud headless browser instances, executes client-side JavaScript (React/Nextra/Mintlify hydration), and waits for DOM network idle.
   - Transparently solves CAPTCHAs, Cloudflare turnstiles, and aggressive rate limits.

3. **Output Standardization**:
   - Normalized into `CrawlResult` records:
     - `url`: Canonical source URL for exact citation.
     - `title`: Extracted section title.
     - `content`: Clean, unpolluted GitHub-Flavored Markdown.
     - `type`: Categorized into `api`, `auth`, `workflow`, or `guide`.
     - `contentHash`: SHA-256 hash for incremental re-crawling deduplication.

4. **Failure Resilience & Timeouts**:
   - TinyFish agent execution is monitored via webhook / polling with a bounded execution window (up to 45s).
   - If an edge-case timeout occurs, it falls back gracefully to `api.fetch.tinyfish.ai` for the primary root pages.

---

## 5. Deep Specification: Step 3 — Semantic Indexing & AI Analysis (OpenRouter / BM25)

Step 3 is the intelligence backbone of Docs4LLM. Raw markdown is transformed into high-precision, searchable, and machine-actionable knowledge structures.

### 5.1 Heading-Aware Document Decomposition & Chunking
Documentation is structured hierarchically. Naive character-count or token-count chunking cuts code blocks and separates explanations from method names. Docs4LLM uses **ATX Heading-Aware Splitting**:

- **Hierarchy Tracking**: Splits documents at `#`, `##`, `###`, and `####` tags while tracking the exact ancestor stack.
- **Breadcrumb Attribution**: Every chunk retains its structural pedigree:
  `Authentication > API Keys > Secret Rotation Lifecycle`
- **Code Fence Protection**: Code blocks (` ```...``` `) are treated as atomic units and are never split mid-syntax.
- **Chunk Bounds**:
  - Target: 1,200 – 1,500 characters.
  - Minimum: 300 characters (micro-sections are rolled into siblings).
  - Overlap: 150 characters to preserve cross-section boundary context.
  - Deterministic ID: `base64url(url + "#" + position + "#" + heading).slice(0, 24)`.

### 5.2 Hybrid BM25+ Weighted Search Engine
Agents need to find exact function names (e.g. `client.auth.getUser()`) as well as broad topics (e.g. "how do I authenticate requests"). Docs4LLM implements an in-memory, high-speed **Weighted BM25+ Scorer**:

$$\text{Score}(Q, C) = \sum_{t \in Q} \Big[ W_{\text{field}}(t, C) \cdot \text{len}(t) \Big] + \text{Bonus}_{\text{type}}$$

- **Heading Match ($W = 6$ + term length)**: Headings define intent; hits in headings receive top priority.
- **Title Match ($W = 4$ + term length)**: Document-level matches.
- **Breadcrumb Match ($W = 2$)**: Ancestor context matching.
- **Body Match ($W = 1$ + capped term length)**: Text body mentions.
- **Exact Code Symbol Match ($+5$ Bonus)**: Boosts matches inside inline code or code blocks.
- **API Page Boost ($+2$ Bonus)**: Prioritizes definitive reference pages over general blog/marketing mentions.
- **Section Deduplication**: Results are deduplicated on `(pageUrl, heading)` so the agent never receives redundant slices of the same section.

### 5.3 OpenRouter AI Understanding Engine
The crawled corpus is processed through OpenRouter (using high-throughput, low-latency reasoning models like NVIDIA Nemotron / Claude 3.5 Sonnet / GPT-4o-mini):

1. **Endpoint & Schema Extraction**:
   - Discovers REST endpoints (`GET`, `POST`, `PUT`, `DELETE`), paths, query parameters, JSON payload schemas, headers, and status codes.
   - Deduplication engine collapses duplicated endpoint mentions into canonical definitions.
2. **Authentication Pattern Recognition**:
   - Detects auth paradigms: Bearer tokens, HTTP Basic, API key headers (`X-Api-Key`), HMAC signatures, OAuth2 token exchange.
3. **Workflow & Recipe Inference**:
   - Synthesizes multi-step operational agent recipes (e.g., *"Customer Onboarding: 1. Create Customer -> 2. Attach Payment Method -> 3. Subscribe to Tier"*).
4. **Automated `llms.txt` and `llms-full.txt` Generation**:
   - Emits standardized machine-readable indices adhering to the `llms.txt` standard for zero-overhead agent ingestion.
5. **Quality Scoring**:
   - Produces measurable quality metrics: `docsScore` (structure clarity), `authConfidence` (credentials clarity), `workflowConfidence` (multi-step usability), and `mcpScore` (agent readiness).

### 5.4 Tool Compression & Synthesis
Exposing 100+ endpoints directly as individual MCP tools overwhelms agent context windows and causes hallucinations. Docs4LLM applies an intelligent **Tool Compression Engine**:
- Retains the **5 Core Universal Doc Tools**:
  1. `list_documentation_pages`: Directory listing of all guides and endpoints.
  2. `get_documentation_page`: Full markdown retrieval of specific documents.
  3. `search_documentation`: Heading-aware BM25+ search returning relevant snippets and anchor links.
  4. `get_documentation_overview`: System summary, auth patterns, workflows, and `llms.txt`.
  5. `ask_documentation`: Question answering using OpenRouter with mandatory URL citations.
- Synthesizes up to **10 High-Value Compressed Custom Tools** for key API interactions (e.g. `manage_customers`, `process_payment`, `query_analytics`).

---

## 6. Dynamic MCP Server Runtime & Endpoint Hosting

- **Protocol**: Model Context Protocol (MCP) Streamable HTTP transport (JSON-RPC 2.0).
- **Endpoint Structure**: `POST /api/mcp/{projectId}/mcp`
- **Security & Multi-Tenancy**:
  - Per-project bearer token generation: `d4l_live_...`
  - Authorization validation on every JSON-RPC handshake.
  - Zero shared credentials across client projects.
- **Live Tool Execution**:
  - `tools/list`: Emits JSON schemas for all standard and compressed tools.
  - `tools/call`: Executes handlers directly against the project's in-memory / cached index.
  - Response payload includes source markdown snippets and citation URLs for verifiable agent answers.

---

## 7. Multi-Surface Delivery Channels

1. **Web Dashboard (`app/convert`)**:
   - Real-time conversion visualizer: URL input -> TinyFish Agent crawl stream -> AI Analysis -> Live MCP Server Ready in < 60s.
   - Copy-paste configuration snippets for Cursor, Claude Desktop, VS Code, and Windsurf.
2. **npm CLI (`packages/cli` / `docs4llm`)**:
   - Single command editor installation:
     ```bash
     npx docs4llm add https://docs.stripe.com
     ```
   - Automatically detects installed editors (Cursor, Claude Desktop, VS Code) and updates their `mcpServers` configuration file.
3. **TypeScript SDK (`@docs4llm/sdk`)**:
   - Programmatic conversion and server management for CI/CD pipelines and custom AI agents:
     ```typescript
     import { Docs4LLM } from "@docs4llm/sdk";
     const client = new Docs4LLM({ apiKey: process.env.DOCS4LLM_API_KEY });
     const server = await client.convert("https://docs.langchain.com");
     console.log(server.mcpUrl, server.bearerToken);
     ```

---

## 8. Implementation & Execution Roadmap

- **Phase 1: TinyFish Autonomous Agent Integration**
  - Implement `@tiny-fish/sdk` client wrapper in `services/ingestion/tinyfish-agent.ts`.
  - Add task goal prompt engineering and result parsing into `CrawlResult[]`.
  - Add timeout management and error fallback handling.
- **Phase 2: Semantic Indexing & AI Analysis Upgrade**
  - Implement heading-aware section splitting in `lib/docs4llm/chunks.ts`.
  - Deploy hybrid weighted BM25+ scoring formula.
  - Refine OpenRouter analysis prompts for endpoint deduction and workflow extraction.
  - Wire automated `llms.txt` generation into the pipeline output.
- **Phase 3: MCP Server Runtime & Authentication**
  - Integrate dynamic JSON-RPC tool dispatcher with Streamable HTTP.
  - Enforce per-project bearer token verification in `/api/mcp/[id]/mcp`.
  - Connect `ask_documentation` to OpenRouter with source citations.
- **Phase 4: Multi-Surface Integration & Testing**
  - Update Web UI conversion progress bar to reflect TinyFish Agent stages.
  - Test CLI configuration generation with Cursor and Claude Desktop.
  - E2E Playwright test suite validating end-to-end URL-to-MCP generation under 60s.
- **Phase 5: Comprehensive Technical Documentation**
  - Author the full `System Architecture & Technical Design Document` based on this approved plan.
