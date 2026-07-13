export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://docs4llm.site";

export const CONTACT_EMAIL = "docs4llm@gmail.com";

export const GITHUB_ORG_URL = "https://github.com/docs4llm";
/** Public marketing / MCP Registry manifest repo (open source). */
export const GITHUB_REGISTRY_REPO_URL =
  "https://github.com/docs4llm/docs4llm-registry";
/** Private product repo — do not link publicly for cloning. */
export const GITHUB_REPO_URL = GITHUB_REGISTRY_REPO_URL;
export const LINKEDIN_URL = "https://www.linkedin.com/company/docs4llm";
