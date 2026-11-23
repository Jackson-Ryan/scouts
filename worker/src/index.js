/**
 * Scout Tools API Worker (Cloudflare Workers free tier).
 *
 * Handles the two things a static GitHub Pages site cannot do safely in the browser:
 *   1. POST /api/auth/exchange  - GitHub OAuth 2.0 + PKCE token exchange, locked to ALLOWED_ADMINS.
 *   2. POST /api/submissions    - In-app public game submissions (no GitHub account needed),
 *                                 validated and queued for /admin review.
 *   3. GET  /api/health         - Simple liveness check.
 */

const PENDING_START = "<!-- PENDING_GAME_SUBMISSION_START -->";
const PENDING_END = "<!-- PENDING_GAME_SUBMISSION_END -->";

const VALID_SECTIONS = new Set(["beavers", "cubs", "scouts"]);
const VALID_TIME_BANDS = new Set(["quick", "normal", "long"]);
const VALID_SETTINGS = new Set(["indoors", "outdoors", "both"]);
const VALID_ENERGY = new Set(["low", "medium", "high"]);
const VALID_NOISE = new Set(["quiet", "medium", "loud"]);
const VALID_MESS = new Set(["none", "low", "medium"]);
const VALID_COLORS = new Set(["purple", "teal", "blue", "green", "orange", "pink", "navy", "yellow", "red", "mint"]);
const VALID_THEMES = new Set([
  "halloween",
  "christmas",
  "winter",
  "easter",
  "summer",
  "space",
  "pirates",
  "jungle",
  "superheroes",
  "around-the-world",
  "camp",
]);

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_SUBMISSIONS = 6;
const rateBuckets = new Map();

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function allowedAdmins(env) {
  return String(env.ALLOWED_ADMINS || "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function corsHeadersFor(request, env) {
  const origin = (request.headers.get("Origin") || "").replace(/\/+$/, "");
  const allowed = allowedOrigins(env);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && (allowed.length === 0 || allowed.includes(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonResponse(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeadersFor(request, env),
    },
  });
}

function checkRateLimit(ip) {
  const now = Date.now();
  const list = (rateBuckets.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX_SUBMISSIONS) {
    rateBuckets.set(ip, list);
    return false;
  }
  list.push(now);
  rateBuckets.set(ip, list);
  return true;
}

function isNonEmptyString(value, min = 1, max = 600) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function isStringList(value, min = 1, maxItems = 40) {
  return (
    Array.isArray(value) &&
    value.length >= min &&
    value.length <= maxItems &&
    value.every((item) => isNonEmptyString(item, 1, 400))
  );
}

function sanitiseGame(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "Game payload must be a JSON object." };
  }

  const title = String(raw.title || "").trim();
  const summary = String(raw.summary || "").trim();
  const duration = String(raw.duration || "").trim();
  const winning = String(raw.winning || "").trim();
  const safety = String(raw.safety || "").trim();
  const players = String(raw.players || "").trim();
  const gameType = String(raw.gameType || "").trim();
  const author = String(raw.author || "Community contributor").trim().slice(0, 80) || "Community contributor";

  if (!isNonEmptyString(title, 3, 80)) return { error: "Title must be 3–80 characters." };
  if (!isNonEmptyString(summary, 10, 220)) return { error: "Summary must be 10–220 characters." };
  if (!Array.isArray(raw.sections) || raw.sections.length === 0 || !raw.sections.every((s) => VALID_SECTIONS.has(s))) {
    return { error: "Choose at least one valid section." };
  }
  if (!VALID_TIME_BANDS.has(raw.timeBand)) return { error: "Invalid timeBand." };
  if (!isNonEmptyString(duration, 2, 30)) return { error: "Invalid duration." };
  const minutes = Math.round(Number(raw.minutes));
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return { error: "Minutes must be 1–180." };
  if (!VALID_SETTINGS.has(raw.setting)) return { error: "Invalid setting." };
  if (!isNonEmptyString(players, 1, 60)) return { error: "Invalid players value." };
  if (!isNonEmptyString(gameType, 1, 40)) return { error: "Invalid gameType." };
  if (!VALID_ENERGY.has(raw.energy) || !VALID_NOISE.has(raw.noise) || !VALID_MESS.has(raw.mess)) {
    return { error: "Invalid energy, noise or mess level." };
  }
  if (!isStringList(raw.equipment, 1)) return { error: "Add at least one equipment item." };
  if (!isStringList(raw.setup, 1)) return { error: "Add at least one set-up step." };
  if (!isStringList(raw.steps, 1)) return { error: "Add at least one rule or step." };
  if (!isNonEmptyString(winning, 10, 400)) return { error: "Explain how to win (10–400 characters)." };
  if (!isNonEmptyString(safety, 10, 600)) return { error: "Add safety notes (10–600 characters)." };

  const themes = Array.isArray(raw.themes) ? raw.themes.filter((t) => VALID_THEMES.has(t)) : [];
  const tips = Array.isArray(raw.tips)
    ? raw.tips
        .filter((t) => t && isNonEmptyString(t.title, 1, 80) && isNonEmptyString(t.text, 1, 400))
        .slice(0, 15)
        .map((t) => ({ title: t.title.trim(), text: t.text.trim() }))
    : [];
  const adaptations = Array.isArray(raw.adaptations)
    ? raw.adaptations
        .filter((a) => a && isNonEmptyString(a.title, 1, 80) && isNonEmptyString(a.text, 1, 400))
        .slice(0, 10)
        .map((a) => ({ title: a.title.trim(), text: a.text.trim() }))
    : [];
  const themedTwists = Array.isArray(raw.themedTwists)
    ? raw.themedTwists
        .filter((tw) => tw && VALID_THEMES.has(tw.theme) && isNonEmptyString(tw.title, 1, 80) && isNonEmptyString(tw.text, 1, 400))
        .slice(0, 12)
        .map((tw) => ({ theme: tw.theme, title: tw.title.trim(), text: tw.text.trim() }))
    : [];

  const color = VALID_COLORS.has(raw.art?.color) ? raw.art.color : "purple";
  const icon = /^[a-z0-9-]{2,32}$/.test(String(raw.art?.icon || "")) ? raw.art.icon : "gamepad";
  const variantOf =
    typeof raw.variantOf === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.variantOf) ? raw.variantOf : null;

  const slug =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "new-game";

  const id = typeof raw.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.id) ? raw.id.slice(0, 70) : slug;
  const added = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.added || ""))
    ? raw.added
    : new Date().toISOString().slice(0, 10);

  return {
    game: {
      id,
      title,
      summary,
      sections: [...new Set(raw.sections)],
      timeBand: raw.timeBand,
      duration,
      minutes,
      setting: raw.setting,
      players,
      gameType,
      energy: raw.energy,
      noise: raw.noise,
      mess: raw.mess,
      themes: [...new Set(themes)],
      equipment: raw.equipment.map((s) => s.trim()),
      setup: raw.setup.map((s) => s.trim()),
      steps: raw.steps.map((s) => s.trim()),
      winning,
      safety,
      tips,
      adaptations,
      themedTwists,
      variantOf,
      featured: false,
      art: { color, icon },
      added,
      author,
    },
  };
}

async function handleAuthExchange(request, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return jsonResponse({ error: "Worker is missing GitHub OAuth credentials." }, 500, request, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400, request, env);
  }

  const { code, code_verifier: codeVerifier, redirect_uri: redirectUri } = body || {};
  if (!code || !codeVerifier || !redirectUri) {
    return jsonResponse({ error: "Missing code, code_verifier or redirect_uri." }, 400, request, env);
  }

  // Ensure redirect_uri belongs to an allowed origin.
  const allowed = allowedOrigins(env);
  try {
    const parsedRedirect = new URL(redirectUri);
    if (allowed.length > 0 && !allowed.includes(parsedRedirect.origin)) {
      return jsonResponse({ error: "Redirect URI origin is not allowed." }, 403, request, env);
    }
  } catch {
    return jsonResponse({ error: "Invalid redirect_uri." }, 400, request, env);
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "scout-tools-api",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) {
    return jsonResponse(
      { error: tokenData.error_description || tokenData.error || "GitHub rejected the sign-in code." },
      400,
      request,
      env,
    );
  }

  // Verify the signed-in GitHub user server-side before ever returning the token.
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "scout-tools-api",
    },
  });
  const user = await userRes.json().catch(() => null);
  if (!userRes.ok || !user?.login) {
    return jsonResponse({ error: "Could not verify your GitHub account." }, 401, request, env);
  }

  const admins = allowedAdmins(env);
  if (admins.length === 0 || !admins.includes(String(user.login).toLowerCase())) {
    return jsonResponse(
      { error: `Access denied: @${user.login} is not authorised to access Scout Tools Admin.` },
      403,
      request,
      env,
    );
  }

  // Double-check push access on the configured repository.
  if (env.GITHUB_REPO) {
    const repoRes = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "scout-tools-api",
      },
    });
    const repo = await repoRes.json().catch(() => null);
    if (!repoRes.ok || !repo?.permissions?.push) {
      return jsonResponse(
        { error: `Account @${user.login} does not have write permission on ${env.GITHUB_REPO}.` },
        403,
        request,
        env,
      );
    }
  }

  return jsonResponse(
    {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || "bearer",
      scope: tokenData.scope || "",
      user: {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url || "",
        html_url: user.html_url || `https://github.com/${user.login}`,
      },
    },
    200,
    request,
    env,
  );
}

async function handleSubmission(request, env) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 24_000) {
    return jsonResponse({ error: "Submission payload is too large." }, 413, request, env);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: "Too many submissions in a short time. Please try again later." }, 429, request, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400, request, env);
  }

  // Honeypot field — bots fill it in; return polite no-op.
  if (body?.website && String(body.website).trim().length > 0) {
    return jsonResponse({ ok: true, id: "accepted", message: "Game submitted for review." }, 200, request, env);
  }

  const { game, error } = sanitiseGame(body?.game);
  if (error) {
    return jsonResponse({ error }, 400, request, env);
  }

  if (!env.GITHUB_SUBMISSIONS_TOKEN || !env.GITHUB_REPO) {
    return jsonResponse({ error: "Submission service is not configured yet." }, 503, request, env);
  }

  const issueBody = [
    "## Pending community game submission",
    "",
    `**Game:** ${game.title}`,
    `**Contributed by:** ${game.author}`,
    `**Sections:** ${game.sections.join(", ")}`,
    `**Duration:** ${game.duration}`,
    "",
    "Review and approve or decline this game inside Scout Tools `/admin/`.",
    "",
    PENDING_START,
    "```json",
    JSON.stringify(game, null, 2),
    "```",
    PENDING_END,
  ].join("\n");

  const label = env.SUBMISSION_LABEL || "pending-game-submission";
  const createRes = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_SUBMISSIONS_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "scout-tools-api",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: `[Pending game] ${game.title}`,
      body: issueBody,
      labels: [label],
    }),
  });

  const issue = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    return jsonResponse(
      { error: "Could not save your submission right now. Please try again shortly." },
      502,
      request,
      env,
    );
  }

  return jsonResponse(
    {
      ok: true,
      id: game.id,
      submissionId: String(issue.number || ""),
      message: "Thanks! Your game has been submitted for review.",
    },
    201,
    request,
    env,
  );
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeadersFor(request, env) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return jsonResponse({ ok: true, service: "scout-tools-api" }, 200, request, env);
    }

    if (url.pathname === "/api/auth/exchange" && request.method === "POST") {
      return handleAuthExchange(request, env);
    }

    if (url.pathname === "/api/submissions" && request.method === "POST") {
      return handleSubmission(request, env);
    }

    return jsonResponse({ error: "Not found" }, 404, request, env);
  },
};
