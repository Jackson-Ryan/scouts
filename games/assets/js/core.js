import { SITE_CONFIG } from "./config.js";

export const SECTIONS = [
  { value: "beavers", label: "Beavers", ages: "6–8" },
  { value: "cubs", label: "Cubs", ages: "8–10½" },
  { value: "scouts", label: "Scouts", ages: "10½–14" },
];

export const TIME_BANDS = [
  { value: "quick", label: "Quick", detail: "5–10 mins" },
  { value: "normal", label: "Normal", detail: "10–20 mins" },
  { value: "long", label: "Long", detail: "20+ mins" },
];

export const THEMES = [
  { value: "halloween", label: "Halloween", icon: "pumpkin" },
  { value: "christmas", label: "Christmas", icon: "gift" },
  { value: "winter", label: "Winter", icon: "snowflake" },
  { value: "easter", label: "Easter", icon: "egg" },
  { value: "summer", label: "Summer", icon: "sun" },
  { value: "space", label: "Space", icon: "rocket" },
  { value: "pirates", label: "Pirates", icon: "anchor" },
  { value: "jungle", label: "Jungle", icon: "tree" },
  { value: "superheroes", label: "Superheroes", icon: "shield" },
  { value: "around-the-world", label: "Around the world", icon: "globe" },
  { value: "camp", label: "Camp", icon: "tent" },
];

export const SETTINGS = [
  { value: "indoors", label: "Indoors" },
  { value: "outdoors", label: "Outdoors" },
];

export const COLORS = [
  { value: "purple", label: "Purple" },
  { value: "teal", label: "Teal" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
  { value: "navy", label: "Navy" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "mint", label: "Mint" },
];

export const ICON_OPTIONS = [
  { value: "dodgeball", label: "Dodgeball" },
  { value: "football", label: "Football" },
  { value: "flag", label: "Flag" },
  { value: "target", label: "Target" },
  { value: "footprints", label: "Footprints" },
  { value: "fish", label: "Fish" },
  { value: "megaphone", label: "Megaphone" },
  { value: "zap", label: "Energy" },
  { value: "splat", label: "Splat" },
  { value: "apple", label: "Fruit" },
  { value: "grid", label: "Grid" },
  { value: "knot", label: "Knot" },
  { value: "layers", label: "Layers" },
  { value: "minus", label: "Stick" },
  { value: "bridge", label: "Bridge" },
  { value: "hazard", label: "Hazard" },
  { value: "parachute", label: "Parachute" },
  { value: "rope", label: "Rope" },
  { value: "balloon", label: "Balloon" },
  { value: "hockey", label: "Hockey" },
  { value: "bat", label: "Bat" },
  { value: "tree", label: "Tree" },
  { value: "camera", label: "Camera" },
  { value: "theatre", label: "Theatre" },
  { value: "hand", label: "Hand" },
  { value: "gift", label: "Gift" },
  { value: "pumpkin", label: "Pumpkin" },
  { value: "egg", label: "Egg" },
  { value: "paw", label: "Paw" },
  { value: "shield", label: "Shield" },
  { value: "globe", label: "Globe" },
  { value: "goal", label: "Goal" },
  { value: "bucket", label: "Bucket" },
  { value: "speaker-off", label: "Quiet" },
  { value: "fence", label: "Fence" },
  { value: "cube", label: "Cube" },
  { value: "plane", label: "Plane" },
  { value: "cup", label: "Cup" },
  { value: "moon", label: "Moon" },
  { value: "snowflake", label: "Snowflake" },
  { value: "ghost", label: "Ghost" },
  { value: "anchor", label: "Anchor" },
  { value: "users", label: "Team" },
  { value: "eye", label: "Eye" },
  { value: "rocket", label: "Rocket" },
  { value: "tent", label: "Tent" },
];

export const GAME_TYPES = [
  "Active",
  "Teamwork",
  "Relay",
  "Calm",
  "Wide game",
  "Parachute",
  "Name game",
  "STEM",
];

export const PLAYER_OPTIONS = [
  "Whole section",
  "Two teams",
  "Teams",
  "Small groups",
  "Pairs",
  "Individuals",
];

export const ENERGY_LEVELS = ["low", "medium", "high"];
export const NOISE_LEVELS = ["quiet", "medium", "loud"];
export const MESS_LEVELS = ["none", "low", "medium"];

const SECTION_LOOKUP = Object.fromEntries(SECTIONS.map((s) => [s.value, s]));
const THEME_LOOKUP = Object.fromEntries(THEMES.map((t) => [t.value, t]));
const SETTING_LOOKUP = Object.fromEntries(SETTINGS.map((s) => [s.value, s]));

let gamesCache = null;

export async function loadGames() {
  if (gamesCache) return gamesCache;
  const url = new URL("../../data/games.json", import.meta.url);
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load the games library (${response.status}).`);
  }
  gamesCache = await response.json();
  return gamesCache;
}

export function getGame(games, id) {
  return games.find((game) => game.id === id) || null;
}

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character];
  });
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function uniqueId(title, existingIds) {
  const base = slugify(title) || "new-game";
  const ids = new Set(existingIds);
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function iconMarkup(name, className = "icon") {
  const safeName = String(name || "gamepad").replace(/[^a-z0-9-]/g, "");
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#${safeName}"></use></svg>`;
}

export function sectionLabel(section) {
  return SECTION_LOOKUP[section]?.label || section;
}

export function sectionLabels(sections = []) {
  const labels = sections.map(sectionLabel);
  if (labels.length === 0) return "All sections";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} & ${labels[labels.length - 1]}`;
}

export function settingLabel(setting) {
  if (setting === "both") return "Indoors or outdoors";
  return SETTING_LOOKUP[setting]?.label || setting;
}

export function themeLabel(theme) {
  return THEME_LOOKUP[theme]?.label || theme;
}

export function themeIcon(theme) {
  return THEME_LOOKUP[theme]?.icon || "sparkles";
}

export function themeMatch(game, theme) {
  if (!theme) return null;
  if (Array.isArray(game.themes) && game.themes.includes(theme)) return theme;
  if (Array.isArray(game.themedTwists) && game.themedTwists.some((twist) => twist.theme === theme)) {
    return theme;
  }
  return null;
}

export function matchesFilters(game, filters) {
  const query = (filters.query || "").trim().toLowerCase();
  if (query) {
    const haystack = [
      game.title,
      game.summary,
      game.gameType,
      game.players,
      game.duration,
      ...(game.equipment || []),
      ...(game.sections || []).map(sectionLabel),
      ...(game.themes || []).map(themeLabel),
      ...(game.themedTwists || []).flatMap((twist) => [themeLabel(twist.theme), twist.title, twist.text]),
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.section && !(game.sections || []).includes(filters.section)) return false;

  if (filters.time && game.timeBand !== filters.time) return false;

  if (filters.theme && !themeMatch(game, filters.theme)) return false;

  if (filters.setting) {
    if (game.setting !== filters.setting && game.setting !== "both") return false;
  }

  if (filters.saved) {
    const saved = savedIds();
    if (!saved.includes(game.id)) return false;
  }

  return true;
}

export function sortGames(games, sort) {
  const list = [...games];
  if (sort === "shortest") {
    return list.sort((a, b) => (a.minutes || 99) - (b.minutes || 99) || a.title.localeCompare(b.title));
  }
  if (sort === "az") {
    return list.sort((a, b) => a.title.localeCompare(b.title, "en-GB"));
  }
  if (sort === "newest") {
    return list.sort((a, b) => String(b.added || "").localeCompare(String(a.added || "")) || a.title.localeCompare(b.title));
  }
  return list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

export function coverMarkup(game, options = {}) {
  const color = String(game.art?.color || "purple").replace(/[^a-z]/g, "");
  const icon = String(game.art?.icon || "gamepad").replace(/[^a-z0-9-]/g, "");
  const badge = options.badge || (options.featured ? "Featured" : "");
  const badgeClass = options.featured ? " game-cover__badge--featured" : options.badgeTheme ? " game-cover__badge--theme" : "";
  const badgeMarkup = badge
    ? `<span class="game-cover__badge${badgeClass}">${escapeHTML(badge)}</span>`
    : "";
  return `
    <div class="game-cover cover--${color}" aria-hidden="true">
      <div class="game-cover__stripes"></div>
      ${badgeMarkup}
      <svg class="game-cover__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#${icon}"></use></svg>
      <span class="game-cover__kicker">${escapeHTML(game.gameType || "Game")}</span>
    </div>
  `;
}

function cardMetaMarkup(game) {
  return `
    <span class="meta-item">${iconMarkup("clock", "icon icon--sm")}${escapeHTML(game.duration || "Flexible")}</span>
    <span class="meta-item">${iconMarkup("users", "icon icon--sm")}${escapeHTML(sectionLabels(game.sections))}</span>
    <span class="meta-item">${iconMarkup("map-pin", "icon icon--sm")}${escapeHTML(settingLabel(game.setting))}</span>
  `;
}

export function gameCardMarkup(game, options = {}) {
  const href = `game?id=${encodeURIComponent(game.id)}`;
  const saved = isSaved(game.id);
  const theme = options.theme || "";
  const twistMatch = theme && themeMatch(game, theme) && !(game.themes || []).includes(theme);
  const badge = options.featured
    ? "Featured"
    : twistMatch
      ? `${themeLabel(theme)} twist`
      : "";
  return `
    <article class="game-card${options.featured ? " game-card--featured" : ""}" data-game-id="${escapeHTML(game.id)}">
      <a class="game-card__link" href="${href}">
        ${coverMarkup(game, { featured: options.featured, badge, badgeTheme: twistMatch })}
        <div class="game-card__body">
          <h3 class="game-card__title">${escapeHTML(game.title)}</h3>
          <p class="game-card__summary">${escapeHTML(game.summary)}</p>
        </div>
      </a>
      <div class="game-card__meta">
        <a class="game-card__meta-link" href="${href}" aria-label="View ${escapeHTML(game.title)}">
          ${cardMetaMarkup(game)}
        </a>
        <button class="save-btn${saved ? " is-saved" : ""}" type="button" data-save-id="${escapeHTML(game.id)}" data-game-title="${escapeHTML(game.title)}" aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${escapeHTML(game.title)}">
          ${iconMarkup("bookmark")}
        </button>
      </div>
    </article>
  `;
}

export function previewCardMarkup(game) {
  const preview = {
    ...game,
    title: game.title || "Your game title",
    summary: game.summary || "A short, friendly summary of the game will appear here.",
    duration: game.duration || "10–20 mins",
    gameType: game.gameType || "Game",
  };
  return `
    <article class="game-card">
      <div class="game-card__link">
        ${coverMarkup(preview)}
        <div class="game-card__body">
          <h3 class="game-card__title">${escapeHTML(preview.title)}</h3>
          <p class="game-card__summary">${escapeHTML(preview.summary)}</p>
        </div>
      </div>
      <div class="game-card__meta">
        <div class="game-card__meta-link">${cardMetaMarkup(preview)}</div>
        <button class="save-btn" type="button" aria-hidden="true" tabindex="-1">${iconMarkup("bookmark")}</button>
      </div>
    </article>
  `;
}

export function gameFamily(game, games) {
  if (game.variantOf) {
    const base = getGame(games, game.variantOf);
    const variants = games.filter((item) => item.variantOf === game.variantOf && item.id !== game.id);
    return { base, variants, isVariant: true };
  }
  const variants = games.filter((item) => item.variantOf === game.id);
  return { base: null, variants, isVariant: false };
}

export function relatedGames(game, games, limit = 3) {
  const familyIds = new Set([game.id]);
  if (game.variantOf) familyIds.add(game.variantOf);
  games.forEach((item) => {
    if (item.variantOf === game.id || item.variantOf === game.variantOf) familyIds.add(item.id);
  });

  const scored = games
    .filter((item) => !familyIds.has(item.id))
    .map((item) => {
      let score = 0;
      const sharedSections = (item.sections || []).filter((section) => (game.sections || []).includes(section));
      score += sharedSections.length * 3;
      const sharedThemes = (item.themes || []).filter((theme) => (game.themes || []).includes(theme));
      score += sharedThemes.length * 2;
      if (item.gameType === game.gameType) score += 2;
      if (item.setting === game.setting || item.setting === "both" || game.setting === "both") score += 1;
      if (item.featured) score += 0.5;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function savedIds() {
  try {
    const raw = localStorage.getItem(SITE_CONFIG.savedKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isSaved(id) {
  return savedIds().includes(id);
}

export function toggleSaved(id) {
  const saved = savedIds();
  const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
  try {
    localStorage.setItem(SITE_CONFIG.savedKey, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private modes; the UI still works for this page.
  }
  document.dispatchEvent(new CustomEvent("savedchange", { detail: { id, saved: next.includes(id), ids: next } }));
  updateSavedCount();
  return next.includes(id);
}

export function updateSavedCount() {
  const count = savedIds().length;
  document.querySelectorAll("[data-saved-count]").forEach((element) => {
    element.textContent = String(count);
    element.dataset.count = String(count);
  });
}

export function showToast(message, duration = 2600) {
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

export async function copyText(text, successMessage = "Copied to clipboard.") {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast(successMessage);
    return true;
  } catch {
    showToast("Could not copy automatically. Please select the text and copy it.");
    return false;
  }
}

export async function sharePage({ title, text, url = window.location.href }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(url, "Link copied to clipboard.");
}

export function initHeader() {
  const toggle = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (toggle && nav) {
    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) close();
    });
  }
  updateSavedCount();
  document.addEventListener("savedchange", updateSavedCount);
}

export function initAccordions(root = document) {
  root.querySelectorAll(".accordion__button").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const item = button.closest(".accordion__item");
      const open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
    });
  });
}

export function detectRepo() {
  if (SITE_CONFIG.githubRepo) return SITE_CONFIG.githubRepo;
  const host = window.location.hostname;
  if (host.endsWith(".github.io")) {
    const owner = host.split(".")[0];
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length > 0 && !parts[0].includes(".")) {
      return `${owner}/${parts[0]}`;
    }
    return `${owner}/${owner}.github.io`;
  }
  return "";
}

export function buildIssueBody(game) {
  const json = JSON.stringify(game, null, 2);
  return [
    "## New game submission",
    "",
    `**Game:** ${game.title}`,
    `**Sections:** ${sectionLabels(game.sections)}`,
    `**Time:** ${game.duration}`,
    "",
    "Please check the game and add it to the library. The JSON between the markers is used by the submission workflow.",
    "",
    "<!-- GAME_SUBMISSION_START -->",
    "```json",
    json,
    "```",
    "<!-- GAME_SUBMISSION_END -->",
  ].join("\n");
}

export function buildIssueUrl(game) {
  const repo = detectRepo();
  if (!repo) return "";
  const title = `[Game] ${game.title}`;
  const body = buildIssueBody(game);
  const params = new URLSearchParams({
    title,
    body,
    labels: SITE_CONFIG.issueLabel,
  });
  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}

export function buildIssueMarkdown(game) {
  const repo = detectRepo();
  return [
    `# New game: ${game.title}`,
    "",
    repo ? `Submit this as an issue at https://github.com/${repo}/issues/new` : "Create an issue in your games repository and paste this in.",
    "",
    buildIssueBody(game),
  ].join("\n");
}

export function parseLines(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
