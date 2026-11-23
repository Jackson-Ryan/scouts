/**
 * Shared public site configuration for Scout Tools.
 *
 * Safe to commit: contains only public identifiers and endpoints.
 * Secrets (GITHUB_CLIENT_SECRET, GITHUB_SUBMISSIONS_TOKEN) live exclusively
 * in Cloudflare Worker secrets (see worker/README.md).
 */

export const SITE_SETTINGS = {
  siteName: "Scout Tools",
  githubRepo: "Jackson-Ryan/scouts",
  defaultBranch: "main",

  // GitHub logins authorised to access /admin (also enforced server-side in worker/src/index.js).
  allowedAdmins: ["Jackson-Ryan"],

  // Public Client ID of your GitHub OAuth App (from GitHub Settings -> Developer settings -> OAuth Apps).
  githubClientId: "Ov23liXmvn18d4XaxQ4y",

  // Base URL of your deployed Cloudflare Worker, e.g. "https://scout-tools-api.your-subdomain.workers.dev"
  // When blank on localhost/127.0.0.1, scripts/dev-server.mjs handles /api/* locally.
  apiBase: "https://scout-tools-api.ryanj2921.workers.dev",

  // Label applied by the Worker to queued community game submissions for /admin review.
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
