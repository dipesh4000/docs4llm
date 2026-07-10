#!/usr/bin/env node
/**
 * Upsert GitHub Actions secrets (passed as env) into Vercel project env.
 * Uses Vercel REST API to remove branch-scoped duplicates before re-adding.
 */

const token = process.env.VERCEL_TOKEN;
const orgId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!(token && orgId && projectId)) {
  console.error("Missing VERCEL_TOKEN, VERCEL_ORG_ID, or VERCEL_PROJECT_ID");
  process.exit(1);
}

/** @type {Array<{ name: string; required?: boolean }>} */
const VARS = [
  { name: "AUTH_SECRET", required: true },
  { name: "POSTGRES_URL", required: true },
  { name: "NEXT_PUBLIC_APP_URL", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true },
  { name: "GEMINI_API_KEY", required: true },
  { name: "ADMIN_EMAILS" },
  { name: "GEMINI_MODEL" },
  { name: "GEMINI_IMAGE_MODEL" },
  { name: "KV_REST_API_URL" },
  { name: "KV_REST_API_TOKEN" },
  { name: "KV_REST_API_READ_ONLY_TOKEN" },
  { name: "QSTASH_TOKEN" },
  { name: "QSTASH_CURRENT_SIGNING_KEY" },
  { name: "QSTASH_NEXT_SIGNING_KEY" },
  { name: "QSTASH_URL" },
  { name: "RAZORPAY_KEY_ID" },
  { name: "RAZORPAY_KEY_SECRET" },
  { name: "RAZORPAY_WEBHOOK_SECRET" },
  { name: "NEXT_PUBLIC_RAZORPAY_KEY_ID" },
  { name: "TAVILY_API_KEY" },
  { name: "BRAVE_SEARCH_API_KEY" },
  { name: "EXA_API_KEY" },
  { name: "JINA_API_KEY" },
  { name: "MCP_REGISTRY_GITHUB_TOKEN" },
];

const API = "https://api.vercel.com";

async function vercelApi(path, { method = "GET", body } = {}) {
  const url = new URL(`${API}${path}`);
  url.searchParams.set("teamId", orgId);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel API ${method} ${path}: ${res.status} ${text}`);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

async function listProjectEnv() {
  const data = await vercelApi(`/v9/projects/${projectId}/env`);
  return Array.isArray(data?.envs) ? data.envs : [];
}

async function deleteEnvEntry(id) {
  await vercelApi(`/v9/projects/${projectId}/env/${id}`, { method: "DELETE" });
}

async function createEnvEntry(key, value) {
  await vercelApi(`/v10/projects/${projectId}/env`, {
    method: "POST",
    body: {
      key,
      value,
      type: "encrypted",
      target: ["production", "preview"],
    },
  });
}

const existing = await listProjectEnv();
const keysToSync = new Set(VARS.map((v) => v.name));

for (const entry of existing) {
  if (!keysToSync.has(entry.key)) {
    continue;
  }
  console.log(
    `delete ${entry.key} (id=${entry.id}, targets=${entry.target?.join(",")}, branch=${entry.gitBranch ?? "all"})`
  );
  await deleteEnvEntry(entry.id);
}

let synced = 0;
let skipped = 0;

for (const { name, required } of VARS) {
  const value = process.env[name]?.trim();
  if (!value) {
    if (required) {
      console.error(`Missing required secret/env: ${name}`);
      process.exit(1);
    }
    console.log(`skip ${name} (not set)`);
    skipped += 1;
    continue;
  }

  console.log(`create ${name} → production + preview`);
  await createEnvEntry(name, value);
  synced += 1;
}

console.log(`Done. Synced ${synced} variable(s), skipped ${skipped}.`);
