/**
 * Authentication, repository persistence and public submission client for Scout Tools.
 *
 * - Admin sign-in uses GitHub OAuth 2.0 + PKCE backed by the Cloudflare Worker in /worker.
 * - Admin access is locked to SITE_SETTINGS.allowedAdmins (enforced server-side in the
 *   Worker, verified here, and backed by GitHub repository push permissions).
 * - Public game submissions POST straight to <apiBase>/api/submissions (no GitHub account needed).
 *
 * Free of top-level DOM side effects so Node scripts can import it safely.
 */

import { SITE_SETTINGS, isAllowedAdmin, resolveApiBase } from "./site-config.js";

export const SESSION_STORAGE_KEY = "scout-tools.admin.session.v1";
const PKCE_VERIFIER_KEY = "scout-tools.oauth.verifier.v1";
const PKCE_STATE_KEY = "scout-tools.oauth.state.v1";
const PENDING_START = "<!-- PENDING_GAME_SUBMISSION_START -->";
const PENDING_END = "<!-- PENDING_GAME_SUBMISSION_END -->";

/* ==========================================================================
   UTF-8 Base64 & PKCE helpers
   ========================================================================== */

function base64UrlEncode(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToUtf8(base64) {
  const binary = atob(String(base64 || "").replace(/\s+/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function randomBase64Url(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function currentRedirectUri() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

/* ==========================================================================
   Session storage
   ========================================================================== */

export function getAdminSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || session.mode !== "github" || !session.token || !isAllowedAdmin(session.user?.login)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveAdminSession(session) {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Session storage unavailable; caller still holds the returned session in memory.
  }
}

export function signOut() {
  try {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    window.sessionStorage.removeItem(PKCE_STATE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

/* ==========================================================================
   GitHub OAuth 2.0 + PKCE SSO
   ========================================================================== */

export function isGitHubSsoConfigured() {
  const clientId = String(SITE_SETTINGS.githubClientId || "").trim();
  const apiBase = String(SITE_SETTINGS.apiBase || "").trim();
  return Boolean(clientId && apiBase);
}

export async function startGitHubLogin() {
  if (!isGitHubSsoConfigured()) {
    throw new Error("GitHub SSO is not configured yet. Add githubClientId and apiBase in assets/js/site-config.js (see worker/README.md).");
  }

  const verifier = randomBase64Url(48);
  const state = randomBase64Url(24);
  const challenge = await sha256Base64Url(verifier);

  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  window.sessionStorage.setItem(PKCE_STATE_KEY, state);

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", SITE_SETTINGS.githubClientId.trim());
  authUrl.searchParams.set("redirect_uri", currentRedirectUri());
  authUrl.searchParams.set("scope", "repo read:user");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  window.location.assign(authUrl.toString());
}

export async function completeGitHubLoginIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");

  if (!error && !code) return null;

  // Strip OAuth params from URL immediately so codes cannot be replayed or bookmarked.
  window.history.replaceState({}, document.title, currentRedirectUri());

  if (error) {
    const desc = params.get("error_description") || "GitHub sign-in was cancelled or denied.";
    throw new Error(desc);
  }

  const expectedState = window.sessionStorage.getItem(PKCE_STATE_KEY);
  const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(PKCE_STATE_KEY);
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);

  if (!state || !expectedState || state !== expectedState || !verifier) {
    throw new Error("Sign-in session check failed. Please try signing in again.");
  }

  const apiBase = resolveApiBase();
  if (!apiBase) {
    throw new Error("Auth worker URL is not configured in assets/js/site-config.js.");
  }

  const response = await fetch(`${apiBase}/api/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      redirect_uri: currentRedirectUri(),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || `Sign-in failed (${response.status}).`);
  }

  const user = payload.user || (await fetchGitHubUser(payload.access_token));
  if (!isAllowedAdmin(user.login)) {
    throw new Error(`Access denied: @${user.login} is not authorised to manage Scout Tools.`);
  }

  await verifyGitHubRepoAccess(payload.access_token);

  const session = {
    mode: "github",
    token: payload.access_token,
    user: {
      login: user.login,
      name: user.name || user.login,
      avatar_url: user.avatar_url || "",
      html_url: user.html_url || `https://github.com/${user.login}`,
    },
  };
  saveAdminSession(session);
  return session;
}

async function githubRequest(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || `GitHub API error (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function fetchGitHubUser(token) {
  return githubRequest(token, "/user");
}

async function verifyGitHubRepoAccess(token) {
  const repo = await githubRequest(token, `/repos/${SITE_SETTINGS.githubRepo}`);
  if (!repo?.permissions?.push) {
    throw new Error(`Your GitHub account does not have write permission on ${SITE_SETTINGS.githubRepo}.`);
  }
  return repo;
}

export async function verifySession(session = getAdminSession()) {
  if (!session || session.mode !== "github") return null;

  try {
    const user = await fetchGitHubUser(session.token);
    if (!isAllowedAdmin(user.login)) {
      signOut();
      throw new Error(`Access denied: @${user.login} is not authorised to manage Scout Tools.`);
    }
    await verifyGitHubRepoAccess(session.token);
    const updated = {
      ...session,
      user: {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url || "",
        html_url: user.html_url || `https://github.com/${user.login}`,
      },
    };
    saveAdminSession(updated);
    return updated;
  } catch (error) {
    signOut();
    throw error;
  }
}

/* ==========================================================================
   Repository file read/write (GitHub Contents API)
   ========================================================================== */

export async function readRepoFile(session, filePath) {
  if (!session) throw new Error("Sign in to read repository files.");

  const branch = encodeURIComponent(SITE_SETTINGS.defaultBranch || "main");
  const data = await githubRequest(
    session.token,
    `/repos/${SITE_SETTINGS.githubRepo}/contents/${filePath}?ref=${branch}`,
  );
  return {
    content: base64ToUtf8(data.content || ""),
    sha: data.sha,
  };
}

export async function writeRepoFile(session, filePath, content, message, sha) {
  if (!session) throw new Error("Sign in to publish changes.");

  const data = await githubRequest(
    session.token,
    `/repos/${SITE_SETTINGS.githubRepo}/contents/${filePath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: message || `Update ${filePath}`,
        content: utf8ToBase64(content),
        sha,
        branch: SITE_SETTINGS.defaultBranch || "main",
      }),
    },
  );
  return {
    sha: data.content?.sha || sha,
    commitUrl: data.commit?.html_url || "",
  };
}

/* ==========================================================================
   Public in-app submissions & admin moderation queue
   ========================================================================== */

export function canSubmitInApp() {
  return Boolean(resolveApiBase());
}

export async function submitPublicGame(game, { website = "" } = {}) {
  const apiBase = resolveApiBase();
  if (!apiBase) {
    throw new Error("In-app submissions are not connected yet. Download the JSON file below or ask the site maintainer to configure the submission endpoint.");
  }

  const response = await fetch(`${apiBase}/api/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ game, website }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Could not submit your game (${response.status}).`);
  }
  return data;
}

function parsePendingSubmissionBody(body) {
  if (typeof body !== "string") return null;
  const start = body.indexOf(PENDING_START);
  const end = body.indexOf(PENDING_END);
  if (start === -1 || end === -1 || end <= start) return null;
  const section = body.slice(start + PENDING_START.length, end);
  const match = section.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const rawJson = (match ? match[1] : section).trim();
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

export async function listPendingSubmissions(session) {
  if (!session) return [];

  const label = encodeURIComponent(SITE_SETTINGS.submissionLabel || "pending-game-submission");
  const issues = await githubRequest(
    session.token,
    `/repos/${SITE_SETTINGS.githubRepo}/issues?state=open&labels=${label}&per_page=100`,
  );

  return (Array.isArray(issues) ? issues : [])
    .map((issue) => {
      const game = parsePendingSubmissionBody(issue.body);
      if (!game) return null;
      return {
        submissionId: String(issue.number),
        createdAt: issue.created_at,
        url: issue.html_url,
        game,
      };
    })
    .filter(Boolean);
}

export async function closePendingSubmission(session, submissionId, { status = "approved", note = "" } = {}) {
  if (!session || !submissionId) return;

  const commentText =
    note ||
    (status === "approved"
      ? "Approved and published via Scout Tools Admin."
      : "Declined via Scout Tools Admin.");

  await githubRequest(
    session.token,
    `/repos/${SITE_SETTINGS.githubRepo}/issues/${encodeURIComponent(submissionId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body: commentText }),
    },
  );

  await githubRequest(
    session.token,
    `/repos/${SITE_SETTINGS.githubRepo}/issues/${encodeURIComponent(submissionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" }),
    },
  );
}
