# Branching & Release Workflow

doc2mcp uses a three-tier flow so every change is previewed, QA'd, and
released deliberately.

```
feature/*   →   own preview URL per branch   (Vercel auto preview)
   │  PR
   ▼
staging     →   stable QA URL                 (Vercel branch domain)
   │  PR (when QA passes)
   ▼
main        →   production, tag-gated         (deploy only on vX.Y.Z tag)
```

## Branches

| Branch       | Purpose                          | Deploys to                                  |
| ------------ | -------------------------------- | ------------------------------------------- |
| `feature/*`  | One change / one developer       | Unique preview URL per push (auto)          |
| `staging`    | Integration branch for QA        | Stable staging URL (e.g. `staging.doc2mcp.site`) |
| `main`       | Released code                    | Production — **only when a `v*` tag is pushed** |

**Developers always cut from `staging`:**

```bash
git switch staging
git pull
git switch -c feature/my-change
# ...commit, push...
git push -u origin feature/my-change   # → opens a preview URL
```

Open a PR into `staging`. Each push to the feature branch updates its own
preview URL. QA happens on the `staging` URL after the PR merges.

## How production deploys are gated

- `vercel.json` sets `git.deploymentEnabled.main = false`, so pushing to
  `main` does **not** trigger a Vercel deploy.
- `.github/workflows/deploy-production.yml` runs only on `v*` tags and deploys
  the prebuilt app to production via the Vercel CLI.
- Feature and `staging` branches still get automatic preview deployments.

## Cutting a release

1. Open a PR from `staging` → `main`, get it reviewed, and merge.
2. Tag the merge commit and push the tag:

   ```bash
   git switch main
   git pull
   git tag v1.4.0
   git push origin v1.4.0
   ```

3. The **Deploy Production** workflow builds and ships that tag to production.

Use [semantic versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

## One-time setup

### GitHub Actions secrets (Settings → Secrets and variables → Actions)

| Secret              | Where to find it                                            |
| ------------------- | ----------------------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel → Account Settings → Tokens                          |
| `VERCEL_ORG_ID`     | `.vercel/project.json` after `vercel link` (`orgId`)        |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` (`projectId`)    |

```bash
# Locally, to read the org/project ids:
vercel link
cat .vercel/project.json
```

### Vercel dashboard

1. **Production branch** = `main` (Settings → Git).
2. **Staging branch domain**: Settings → Domains → add `staging.doc2mcp.site`
   (or use the auto `*-git-staging-*.vercel.app` URL) and assign it to the
   `staging` branch so QA always has a stable link.
3. **Environment variables**: ensure `POSTGRES_URL` and Supabase vars exist
   for **Preview** so feature/staging deployments can authenticate and use
   database-backed routes (`/api/history`, `/api/chat`, dashboard, project
   reads). Keep `NEXT_PUBLIC_APP_URL` set only for **Production**
   (`https://doc2mcp.site`); leave it unset on Preview so previews resolve
   their own deployment origin. See
   [CONTRIBUTING.md](./CONTRIBUTING.md#working-with-vercel-preview-deployments).

### Supabase Auth redirect URLs

Add wildcards so login works on every preview/staging URL (Authentication →
URL Configuration → Redirect URLs):

```
https://doc2mcp.site/**
https://doc2mcp-*-<team>.vercel.app/**
https://staging.doc2mcp.site/**
http://localhost:3000/**
```
