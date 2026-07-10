---
title: Privacy Policy
description: What doc2mcp collects, why, and how to control it.
category: Legal
order: 2
---

# Privacy Policy

Last updated: {{ date }}

## What we collect

| Data | When | Purpose |
|------|------|---------|
| Email + name | At sign up | Authentication, billing receipts |
| Project metadata (source URL, conversion timestamps, page count) | When you convert docs | Show the project on your dashboard |
| Crawled documentation content | During conversion | Power the MCP tools (`list`, `get`, `search`, `ask`) |
| Usage logs (request paths, error traces) | Continuously | Reliability and abuse prevention |
| Cookies (session, theme) | While signed in | Keep you logged in, remember preferences |

We do **not** collect:

- Your code or repository content (unless you explicitly paste it into chat)
- Cursor mcp.json files or their tokens after they leave the convert page

## Third parties we share data with

doc2mcp processes data through a small number of vendors:

- **Google Gemini (generativelanguage.googleapis.com)** — receives doc excerpts and chat messages when generating MCP tools or answering `ask_documentation`.
- **Supabase** — stores project rows, crawled pages, chunks, and tokens.
- **Vercel** — hosts the application and edge functions.
- **Web search providers (optional)** — Tavily / Brave / Exa receive search queries when configured.
- **Jina Reader (optional)** — receives URLs to render when configured.

We do not sell or rent personal data. We do not use your data to train models.

## Your rights

You may:

- Export all project data via the dashboard.
- Delete a project (irreversibly deletes its crawled content, chunks, and token).
- Delete your account (removes all projects and personal data).
- Request a copy of your data: doc2mcp@gmail.com

GDPR / UK GDPR / CCPA requests are honoured within 30 days.

## Security

See the [Security](/docs/security) page for technical details — token isolation, transport, data flow.

## Children

doc2mcp is not directed at children under 13 and we do not knowingly collect their data.

## Changes

We will notify users by email of material changes at least 14 days before they take effect.

## Contact

Privacy questions: doc2mcp@gmail.com
