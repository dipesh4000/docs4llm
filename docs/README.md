# Docs4LLM Documentation Index

Welcome to the official documentation for **Docs4LLM** — documentation infrastructure for AI agents and coding assistants.

Docs4LLM transforms any public or private documentation site into a hosted, authenticated [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server in under 60 seconds.

---

## 📚 Documentation Sitemap

| Document | Description | Target Audience |
|---|---|---|
| **[System Architecture](https://github.com/dipesh4000/docs4llm/blob/main/docs/ARCHITECTURE.md)** | Full end-to-end architecture, system decomposition, data flow, and runtime mechanics. | Architects, System Engineers |
| **[Pipeline Specification](https://github.com/dipesh4000/docs4llm/blob/main/docs/PIPELINE_SPEC.md)** | Step-by-step breakdown of the 5-stage conversion pipeline from URL to live server. | Backend Engineers, Integrators |
| **[TinyFish Crawler Integration](https://github.com/dipesh4000/docs4llm/blob/main/docs/TINYFISH_INTEGRATION.md)** | Autonomous agentic web crawling using TinyFish: SPA handling, anti-bot bypass, and markdown extraction. | Crawler & Ingestion Engineers |
| **[Model Context Protocol (MCP) Spec](https://github.com/dipesh4000/docs4llm/blob/main/docs/MCP_SPEC.md)** | JSON-RPC 2.0 specifications, standard tools (`search`, `get_page`, `ask`, etc.), custom API tools, and client configs. | AI Agent Builders, IDE Users |
| **[Developer & Contributor Guide](https://github.com/dipesh4000/docs4llm/blob/main/docs/DEVELOPER_GUIDE.md)** | Local environment setup, running tests, CLI usage, environment variables, and deployment. | Contributors, Developers |

---

## ⚡ Quick Summary: How Docs4LLM Works

```
[User Doc URL]
       │
       ▼
[1. Source Detector]  ──► Identifies Mintlify, Docusaurus, GitBook, Nextra, or OpenAPI
       │
       ▼
[2. TinyFish Agent]   ──► Autonomous headless browser extracts clean, noise-free Markdown
       │
       ▼
[3. Indexer & AI]     ──► Heading-aware ATX chunking, BM25+ index, OpenRouter endpoint analysis
       │
       ▼
[4. MCP Server]       ──► Generates JSON-RPC 2.0 tools with Bearer token authentication
       │
       ▼
[5. Delivery]         ──► Connects to Cursor, Claude Desktop, VS Code, Windsurf, or LangChain
```

---

## 🚀 Key Features

1. **Zero-Setup Conversion**: Paste a link, get a working endpoint in < 60 seconds.
2. **Autonomous SPA Scraping**: TinyFish handles dynamic client-side rendering and bot protection.
3. **Hybrid Search (Option D)**: Exact-symbol BM25+ search combined with OpenRouter Q&A and endpoint deduction.
4. **Context-Safe**: Generates structured tools so agents only load the exact paragraphs they need, preventing context overflow.
5. **Universal Compatibility**: Works with Cursor, Claude, Windsurf, VS Code, and any MCP-compliant framework.
