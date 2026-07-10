---
title: Custom domains
description: Serve your MCP from mcp.your-domain.com on Team or Enterprise plans.
category: Enterprise
order: 1
---

# Custom domains

Serve a hosted MCP from your own hostname, e.g. `mcp.acme.com`, instead of the default `doc2mcp.site` URL.

**Plans:** Team or Enterprise (request via Settings or admin).

## Why use a custom domain

- Branded endpoint for customers and internal teams
- Clear separation from the public doc2mcp hostname
- Same Bearer token and MCP tools — only the host changes

## Step 1 — Pick a hostname

We recommend `mcp.your-domain.com`. Any subdomain works.

## Step 2 — Add DNS records

At your registrar (Cloudflare, Namecheap, Route 53, etc.):

| Type | Host | Value |
|------|------|-------|
| CNAME | `mcp` | `cname.doc2mcp.app` |
| TXT | `_doc2mcp` | `doc2mcp-verify=<code-from-support>` |

TTL `3600` or Auto is fine. Propagation usually takes 1–10 minutes.

## Step 3 — Request attachment

**Self-serve (settings):** Dashboard → Settings → Custom domain → **Request setup**.

**Admin:** Admins can attach domains directly at `/admin/domains` — enter hostname, toggle **Verified** after TLS is live, Save.

## Step 4 — Update MCP client config

Replace the host in your `mcp.json`:

```diff
- "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp"
+ "url": "https://mcp.your-domain.com/api/mcp/<projectId>/mcp"
```

The Bearer token does **not** change.

## Verification checklist

- [ ] DNS CNAME resolves to doc2mcp edge
- [ ] TXT record present (if required for your project)
- [ ] Admin marked domain **Verified**
- [ ] HTTPS works in browser
- [ ] Cursor / Claude connects with existing token

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Token unchanged — check Authorization header |
| SSL error | Wait for cert provisioning or contact support |
| Wrong project | Each domain maps to one `PlatformProject` row |

See also [MCP access tokens](/docs/mcp-access-tokens) and [Deployment (hosted)](/docs/deployment-hosted).
