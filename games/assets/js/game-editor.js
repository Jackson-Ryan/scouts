/**
 * Shared game form & editor helpers used by both /games/add and /admin.
 *
 * Keeps option labels, icon search, colour swatches, twist rows, tip parsing
 * and validation consistent across public submissions and admin editing.
 */

import {
  COLORS,
  ENERGY_LEVELS,
  GAME_TYPES,
  ICON_OPTIONS,
  MESS_LEVELS,
  NOISE_LEVELS,
  PLAYER_OPTIONS,
  SETTINGS,
  THEMES,
  TIME_BANDS,
  escapeHTML,
  iconMarkup,
  parseLines,
} from "./core.js";

export const AUTO_DURATIONS = { quick: "5–10 mins", normal: "10–20 mins", long: "20+ mins" };
export const DEFAULT_MINUTES = { quick: 10, normal: 20, long: 30 };
export const ENERGY_LABELS = { low: "Low", medium: "Medium", high: "High" };
export const NOISE_LABELS = { quiet: "Quiet", medium: "Medium", loud: "Loud" };
export const MESS_LABELS = { none: "None", low: "A little", medium: "Messy" };

export function fillSelect(select, options, { valueKey = "value", labelKey = "label" } = {}) {
  select.innerHTML = options
    .map((option) => {
      const value = typeof option === "string" ? option : option[valueKey];
      const label = typeof option === "string" ? option : option[labelKey];
      return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
    })
    .join("");
}

export function populateGameSelects({ gameType, setting, players, timeBand, energy, noise, mess }) {
  fillSelect(gameType, GAME_TYPES);
  fillSelect(setting, [...SETTINGS, { value: "both", label: "Indoors or outdoors" }]);
  fillSelect(players, PLAYER_OPTIONS);
  fillSelect(
    timeBand,
    TIME_BANDS.map((band) => ({ value: band.value, label: `${band.label} (${band.detail})` })),
  );
  fillSelect(
    energy,
    ENERGY_LEVELS.map((value) => ({ value, label: ENERGY_LABELS[value] })),
  );
  fillSelect(
    noise,
    NOISE_LEVELS.map((value) => ({ value, label: NOISE_LABELS[value] })),
  );
  fillSelect(
    mess,
    MESS_LEVELS.map((value) => ({ value, label: MESS_LABELS[value] })),
  );
}

export function renderThemeCheckboxes(container, selected = [], name = "themes") {
  const picked = new Set(selected);
  container.innerHTML = THEMES.map(
    (theme) => `
      <label class="choice">
        <input type="checkbox" name="${escapeHTML(name)}" value="${escapeHTML(theme.value)}"${picked.has(theme.value) ? " checked" : ""}>
        <span class="choice__dot" aria-hidden="true"></span>
        ${iconMarkup(theme.icon, "icon icon--sm")}
        ${escapeHTML(theme.label)}
      </label>`,
  ).join("");
}

export function renderColorSwatches(container, activeColor = "purple") {
  container.innerHTML = COLORS.map((color) => {
    const active = color.value === activeColor;
    return `<button class="swatch${active ? " is-active" : ""}" type="button" data-color="${escapeHTML(color.value)}" aria-label="${escapeHTML(color.label)}" aria-pressed="${active}" title="${escapeHTML(color.label)}"></button>`;
  }).join("");
}

export function renderIconChoices(container, countEl, { query = "", activeIcon = "gamepad" } = {}) {
  const term = String(query || "").trim().toLowerCase();
  const matches = term
    ? ICON_OPTIONS.filter(
        (option) => option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term),
      )
    : ICON_OPTIONS;

  if (countEl) {
    countEl.textContent = term
      ? `${matches.length} of ${ICON_OPTIONS.length} icons`
      : `${ICON_OPTIONS.length} icons`;
  }

  if (matches.length === 0) {
    container.innerHTML = `<p class="icon-picker__empty">No icons match “${escapeHTML(term)}”.</p>`;
    return;
  }

  container.innerHTML = matches
    .map((option) => {
      const active = option.value === activeIcon;
      return `
        <button class="icon-choice${active ? " is-active" : ""}" type="button" data-icon="${escapeHTML(option.value)}" aria-label="${escapeHTML(option.label)}" aria-pressed="${active}" title="${escapeHTML(option.label)}">
          ${iconMarkup(option.value, "icon")}
          <span class="icon-choice__label">${escapeHTML(option.label)}</span>
        </button>`;
    })
    .join("");
}

export function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function inferMinutes(duration, timeBand, explicitMinutes = "") {
  const explicit = Number(explicitMinutes);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(180, Math.round(explicit));
  const match = String(duration).match(/\d+/);
  if (match) return Math.min(180, Math.max(1, Number(match[0])));
  return DEFAULT_MINUTES[timeBand] || 20;
}

export function parseTips(value) {
  return parseLines(value)
    .map((line, index) => {
      const colon = line.indexOf(":");
      if (colon > 0 && colon < 60) {
        return { title: line.slice(0, colon).trim(), text: line.slice(colon + 1).trim() };
      }
      return { title: `Leader tip ${index + 1}`, text: line };
    })
    .filter((tip) => tip.text);
}

export function formatTips(tips = []) {
  return (Array.isArray(tips) ? tips : [])
    .map((tip) => (tip?.title ? `${tip.title}: ${tip.text}` : tip?.text || ""))
    .filter(Boolean)
    .join("\n");
}

export function findAdaptation(adaptations = [], heading) {
  const lower = heading.toLowerCase();
  const match = (Array.isArray(adaptations) ? adaptations : []).find(
    (item) => String(item?.title || "").trim().toLowerCase() === lower,
  );
  return match?.text || "";
}

export function appendTwistRow(container, template, values = {}) {
  const fragment = template.content.cloneNode(true);
  const row = fragment.querySelector("[data-twist-row]");
  const themeSelect = row.querySelector("[data-twist-theme]");
  fillSelect(
    themeSelect,
    THEMES.map((theme) => ({ value: theme.value, label: theme.label })),
  );
  themeSelect.value = values.theme || THEMES[0].value;
  row.querySelector("[data-twist-title]").value = values.title || "";
  row.querySelector("[data-twist-text]").value = values.text || "";
  container.append(row);
  return row;
}

export function readTwistRows(container) {
  return [...container.querySelectorAll("[data-twist-row]")].map((row) => ({
    theme: row.querySelector("[data-twist-theme]")?.value || "",
    title: row.querySelector("[data-twist-title]")?.value.trim() || "",
    text: row.querySelector("[data-twist-text]")?.value.trim() || "",
    row,
  }));
}

export function validateGameFields(game, twists, baseGames = []) {
  const errors = [];

  if (game.title.length < 3) errors.push(["title", "Give the game a title of at least 3 characters."]);
  if (game.title.length > 80) errors.push(["title", "Keep the title under 80 characters."]);
  if (game.summary.length < 10) errors.push(["summary", "Write a summary of at least 10 characters."]);
  if (game.summary.length > 220) errors.push(["summary", "Keep the summary under 220 characters."]);
  if (game.sections.length === 0) errors.push(["sections", "Choose at least one section."]);
  if (!game.duration) errors.push(["duration", "Add a guide duration, such as “10–20 mins”."]);
  if (!game.timeBand) errors.push(["timeBand", "Choose a time filter."]);
  if (game.equipment.length === 0) errors.push(["equipment", "List at least one item, or write “None”."]);
  if (game.setup.length === 0) errors.push(["setup", "Add at least one set-up step."]);
  if (game.steps.length === 0) errors.push(["steps", "Add at least one rule or step."]);
  if (game.winning.length < 10) errors.push(["winning", "Explain how the game ends or how a team wins."]);
  if (game.safety.length < 10) errors.push(["safety", "Add a safety note of at least 10 characters."]);

  const incompleteTwists = (twists || []).filter((twist) => {
    const hasAny = Boolean(twist.title || twist.text);
    const complete = Boolean(twist.theme && twist.title && twist.text);
    return hasAny && !complete;
  });
  if (incompleteTwists.length > 0) {
    errors.push(["twists", "Fill in the theme, title and description for each twist, or remove the incomplete row."]);
  }

  if (game.variantOf && !baseGames.some((base) => base.id === game.variantOf)) {
    errors.push(["variantOf", "Choose a valid base game, or leave this as a standalone game."]);
  }

  return errors;
}
