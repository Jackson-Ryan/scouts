import { escapeHTML, initSite, spriteIcon } from "../../../assets/js/site.js";
import { SITE_CONFIG } from "./config.js";

export { escapeHTML };

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
  // Sports & active
  { value: "gamepad", label: "Games" },
  { value: "dodgeball", label: "Dodgeball" },
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "tennis", label: "Tennis" },
  { value: "rugby", label: "Rugby" },
  { value: "volleyball", label: "Volleyball" },
  { value: "hockey", label: "Hockey" },
  { value: "bat", label: "Bat & ball" },
  { value: "ping-pong", label: "Ping-pong" },
  { value: "bowling", label: "Bowling" },
  { value: "bowling-pin", label: "Skittles" },
  { value: "goal", label: "Goal" },
  { value: "target", label: "Target" },
  { value: "bow", label: "Archery" },
  { value: "runner", label: "Running" },
  { value: "footprints", label: "Footprints" },
  { value: "whistle", label: "Whistle" },
  { value: "stopwatch", label: "Timer" },
  { value: "medal", label: "Medal" },
  { value: "trophy", label: "Trophy" },
  { value: "flag", label: "Flag" },
  { value: "flags", label: "Bunting" },
  { value: "cone", label: "Cone" },
  { value: "hoop", label: "Hoop" },
  { value: "frisbee", label: "Frisbee" },
  { value: "kite", label: "Kite" },
  { value: "parachute", label: "Parachute" },
  { value: "rope", label: "Rope" },
  { value: "bike", label: "Bike" },
  { value: "swim", label: "Swim" },
  { value: "dumbbell", label: "Strength" },

  // Outdoors, camp & nature
  { value: "tent", label: "Tent" },
  { value: "fire", label: "Campfire" },
  { value: "compass", label: "Compass" },
  { value: "map", label: "Map" },
  { value: "binoculars", label: "Binoculars" },
  { value: "telescope", label: "Telescope" },
  { value: "torch", label: "Torch" },
  { value: "lantern", label: "Lantern" },
  { value: "backpack", label: "Rucksack" },
  { value: "boot", label: "Boot" },
  { value: "knot", label: "Knot" },
  { value: "bridge", label: "Bridge" },
  { value: "fence", label: "Fence" },
  { value: "tree", label: "Tree" },
  { value: "leaf", label: "Leaf" },
  { value: "clover", label: "Clover" },
  { value: "flower", label: "Flower" },
  { value: "mushroom", label: "Mushroom" },
  { value: "feather", label: "Feather" },
  { value: "shell", label: "Shell" },
  { value: "mountain", label: "Mountain" },
  { value: "sun", label: "Sun" },
  { value: "moon", label: "Moon" },
  { value: "cloud", label: "Cloud" },
  { value: "cloud-rain", label: "Rain" },
  { value: "umbrella", label: "Umbrella" },
  { value: "snowflake", label: "Snowflake" },
  { value: "wind", label: "Wind" },
  { value: "rainbow", label: "Rainbow" },
  { value: "waves", label: "Water" },
  { value: "droplet", label: "Splash" },

  // Animals & creatures
  { value: "paw", label: "Animal" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bunny", label: "Bunny" },
  { value: "fox", label: "Fox" },
  { value: "bird", label: "Bird" },
  { value: "duck", label: "Duck" },
  { value: "owl", label: "Owl" },
  { value: "fish", label: "Fish" },
  { value: "shark", label: "Shark" },
  { value: "crab", label: "Crab" },
  { value: "turtle", label: "Turtle" },
  { value: "frog", label: "Frog" },
  { value: "snake", label: "Snake" },
  { value: "bug", label: "Bug" },
  { value: "butterfly", label: "Butterfly" },
  { value: "spider", label: "Spider" },
  { value: "dinosaur", label: "Dinosaur" },

  // Props, toys, craft & STEM
  { value: "balloon", label: "Balloon" },
  { value: "bucket", label: "Bucket" },
  { value: "cup", label: "Cup" },
  { value: "bottle", label: "Bottle" },
  { value: "spoon", label: "Spoon" },
  { value: "chair", label: "Chair" },
  { value: "minus", label: "Stick" },
  { value: "dice", label: "Dice" },
  { value: "domino", label: "Domino" },
  { value: "cards", label: "Cards" },
  { value: "puzzle", label: "Puzzle" },
  { value: "chess", label: "Strategy" },
  { value: "cube", label: "Cube" },
  { value: "hourglass", label: "Countdown" },
  { value: "plane", label: "Paper plane" },
  { value: "key", label: "Key" },
  { value: "lock", label: "Lock" },
  { value: "bell", label: "Bell" },
  { value: "drum", label: "Drum" },
  { value: "music", label: "Music" },
  { value: "guitar", label: "Guitar" },
  { value: "microphone", label: "Mic" },
  { value: "megaphone", label: "Megaphone" },
  { value: "camera", label: "Camera" },
  { value: "film", label: "Film" },
  { value: "paintbrush", label: "Paint" },
  { value: "pencil", label: "Drawing" },
  { value: "scissors", label: "Craft" },
  { value: "magnet", label: "Magnet" },
  { value: "flask", label: "Science" },
  { value: "atom", label: "STEM" },
  { value: "gear", label: "Build" },
  { value: "scale", label: "Balance" },
  { value: "lightbulb", label: "Idea" },
  { value: "wand", label: "Magic" },

  // Themes, stories, vehicles & food
  { value: "pumpkin", label: "Pumpkin" },
  { value: "ghost", label: "Ghost" },
  { value: "skull", label: "Skull" },
  { value: "witch-hat", label: "Witch" },
  { value: "gift", label: "Gift" },
  { value: "snowman", label: "Snowman" },
  { value: "candy-cane", label: "Festive" },
  { value: "egg", label: "Egg" },
  { value: "rocket", label: "Rocket" },
  { value: "planet", label: "Planet" },
  { value: "ufo", label: "UFO" },
  { value: "anchor", label: "Anchor" },
  { value: "helm", label: "Ship wheel" },
  { value: "ship", label: "Pirate ship" },
  { value: "treasure", label: "Treasure" },
  { value: "gem", label: "Gem" },
  { value: "coin", label: "Coin" },
  { value: "sword", label: "Sword" },
  { value: "crown", label: "Crown" },
  { value: "castle", label: "Castle" },
  { value: "shield", label: "Shield" },
  { value: "mask", label: "Hero mask" },
  { value: "robot", label: "Robot" },
  { value: "globe", label: "Globe" },
  { value: "car", label: "Car" },
  { value: "train", label: "Train" },
  { value: "submarine", label: "Submarine" },
  { value: "apple", label: "Fruit" },
  { value: "pizza", label: "Pizza" },
  { value: "cookie", label: "Cookie" },
  { value: "cake", label: "Cake" },
  { value: "ice-cream", label: "Ice cream" },

  // People, mind, calm & symbols
  { value: "users", label: "Team" },
  { value: "hand", label: "Hand" },
  { value: "eye", label: "Eye" },
  { value: "ear", label: "Listen" },
  { value: "brain", label: "Memory" },
  { value: "smile", label: "Fun" },
  { value: "theatre", label: "Drama" },
  { value: "book", label: "Story" },
  { value: "message", label: "Word game" },
  { value: "zzz", label: "Sleepy" },
  { value: "speaker-off", label: "Quiet" },
  { value: "volume", label: "Loud" },
  { value: "zap", label: "Energy" },
  { value: "splat", label: "Splat" },
  { value: "grid", label: "Grid" },
  { value: "layers", label: "Layers" },
  { value: "hazard", label: "Hazard" },
  { value: "heart", label: "Kindness" },
  { value: "star", label: "Star" },
  { value: "sparkles", label: "Sparkle" },
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
  return spriteIcon(name || "gamepad", { root: "../", className });
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
      <svg class="game-cover__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="../assets/img/icons.svg#${icon}"></use></svg>
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
    summary: game.summary || "A short summary of the game will appear here.",
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
    // localStorage may be unavailable in private browsing.
  }
  document.dispatchEvent(new CustomEvent("savedchange", { detail: { id, saved: next.includes(id), ids: next } }));
  return next.includes(id);
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
    showToast("Could not copy automatically. Select the text and copy it instead.");
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
  initSite();
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

export function buildEditIssueUrl(game) {
  const repo = detectRepo();
  if (!repo) return "";
  const params = new URLSearchParams({
    title: `[Edit] ${game.title}`,
    body: `Game: ${game.title} (\`${game.id}\`)\n\nWhat should be updated?\n`,
  });
  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}

export function parseLines(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
