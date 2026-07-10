# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in doc2mcp, please report it
**privately**. Do not open a public GitHub issue.

- Email: **doc2mcp@gmail.com**
- Or use GitHub's private vulnerability reporting:
  <https://github.com/doc2mcp/doc2mcp/security/advisories/new>

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce (a proof of concept if possible).
- Affected version, deployment type (hosted / self-hosted), and environment.

We aim to acknowledge reports within 72 hours and to provide a remediation
timeline after triage. Please give us a reasonable window to release a fix
before any public disclosure.

## Supported versions

Security fixes are applied to the latest release on the `main` branch.

## Scope

In scope: the application code in this repository, MCP endpoints, and auth
flows. Out of scope: third-party services (Supabase, Vercel, Upstash) — report
those to the respective vendor.

## Please do not

- Run automated scanners against the production environment.
- Access, modify, or delete data that does not belong to you.
- Perform denial-of-service testing.
