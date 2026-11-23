/**
 * Public site configuration (Worker secrets live in Cloudflare, not here).
 */

export const SITE_SETTINGS = {
  siteName: "Scout Tools",
  githubRepo: "Jackson-Ryan/scouts",
  defaultBranch: "main",
  // Must match ALLOWED_ADMINS in worker/wrangler.toml.
  allowedAdmins: ["Jackson-Ryan"],
  githubClientId: "Ov23liXmvn18d4XaxQ4y",
  apiBase: "https://scout-tools-api.ryanj2921.workers.dev",
  // Must match SUBMISSION_LABEL in worker/wrangler.toml.
  submissionLabel: "pending-game-submission",
};

export function resolveApiBase() {
  const configured = String(SITE_SETTINGS.apiBase || "").trim().replace(/\/+$/, "");
  return configured || null;
}

export function isAllowedAdmin(login) {
  const clean = String(login || "").trim().toLowerCase();
  if (!clean) return false;
  return SITE_SETTINGS.allowedAdmins.some((allowed) => allowed.toLowerCase() === clean);
}
