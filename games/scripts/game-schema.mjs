/**
 * Shared schema validation for the games library.
 *
 * The site and the command-line tools both use these constants, so the
 * JSON in data/games.json stays compatible with the browser scripts.
 */

import {
  COLORS,
  GAME_TYPES,
  ICON_OPTIONS,
  MESS_LEVELS,
  NOISE_LEVELS,
  PLAYER_OPTIONS,
  SECTIONS,
  SETTINGS,
  THEMES,
  TIME_BANDS,
} from "../assets/js/core.js";

export const VALID = {
  sections: SECTIONS.map((item) => item.value),
  timeBands: TIME_BANDS.map((item) => item.value),
  settings: [...SETTINGS.map((item) => item.value), "both"],
  gameTypes: GAME_TYPES,
  players: PLAYER_OPTIONS,
  energy: ["low", "medium", "high"],
  noise: NOISE_LEVELS,
  mess: MESS_LEVELS,
  themes: THEMES.map((item) => item.value),
  colors: COLORS.map((item) => item.value),
  icons: ICON_OPTIONS.map((item) => item.value),
};

export const SUBMISSION_START = "<!-- GAME_SUBMISSION_START -->";
export const SUBMISSION_END = "<!-- GAME_SUBMISSION_END -->";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFilledString(value, min = 1, max = Infinity) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function isStringArray(value, min = 0) {
  return Array.isArray(value) && value.length >= min && value.every((item) => isFilledString(item, 1, 400));
}

export function validateGame(game, context = {}) {
  const { knownIds = new Set(), gamesById = new Map() } = context;
  const errors = [];

  if (!isPlainObject(game)) {
    return ["Game entry must be a JSON object."];
  }

  if (!isFilledString(game.id, 2, 70) || !ID_PATTERN.test(game.id || "")) {
    errors.push("id: use lowercase letters, numbers and single hyphens (2–70 characters).");
  } else if (knownIds.has(game.id)) {
    errors.push(`id: “${game.id}” is already used in the library.`);
  }

  if (!isFilledString(game.title, 3, 80)) errors.push("title: use between 3 and 80 characters.");
  if (!isFilledString(game.summary, 10, 220)) errors.push("summary: use between 10 and 220 characters.");

  if (!isStringArray(game.sections, 1) || !game.sections.every((section) => VALID.sections.includes(section))) {
    errors.push(`sections: choose at least one of ${VALID.sections.join(", ")}.`);
  }

  if (!VALID.timeBands.includes(game.timeBand)) {
    errors.push(`timeBand: choose one of ${VALID.timeBands.join(", ")}.`);
  }

  if (!isFilledString(game.duration, 2, 30)) errors.push("duration: use a short guide such as “10–20 mins”.");

  if (!Number.isInteger(game.minutes) || game.minutes < 1 || game.minutes > 180) {
    errors.push("minutes: use a whole number between 1 and 180.");
  }

  if (!VALID.settings.includes(game.setting)) {
    errors.push(`setting: choose one of ${VALID.settings.join(", ")}.`);
  }

  if (!isFilledString(game.players, 1, 60)) errors.push("players: describe who plays, such as “Two teams”.");
  if (!isFilledString(game.gameType, 1, 40)) errors.push("gameType: add a game type.");
  if (!VALID.energy.includes(game.energy)) errors.push(`energy: choose one of ${VALID.energy.join(", ")}.`);
  if (!VALID.noise.includes(game.noise)) errors.push(`noise: choose one of ${VALID.noise.join(", ")}.`);
  if (!VALID.mess.includes(game.mess)) errors.push(`mess: choose one of ${VALID.mess.join(", ")}.`);

  if (!Array.isArray(game.themes) || !game.themes.every((theme) => VALID.themes.includes(theme))) {
    errors.push(`themes: use only these values: ${VALID.themes.join(", ")}.`);
  }

  if (!isStringArray(game.equipment, 1)) errors.push("equipment: list at least one item (use “None” if nothing is needed).");
  if (!isStringArray(game.setup, 1)) errors.push("setup: add at least one set-up step.");
  if (!isStringArray(game.steps, 1)) errors.push("steps: add at least one rule or step.");
  if (!isFilledString(game.winning, 10, 400)) errors.push("winning: explain how a winner is decided.");
  if (!isFilledString(game.safety, 10, 600)) errors.push("safety: add a useful safety note.");

  if (!Array.isArray(game.tips) || !game.tips.every((tip) => isPlainObject(tip) && isFilledString(tip.title, 1, 80) && isFilledString(tip.text, 1, 400))) {
    errors.push("tips: use a list of objects with a title and text.");
  }

  if (!Array.isArray(game.adaptations) || !game.adaptations.every((item) => isPlainObject(item) && isFilledString(item.title, 1, 80) && isFilledString(item.text, 1, 400))) {
    errors.push("adaptations: use a list of objects with a title and text.");
  }

  if (!Array.isArray(game.themedTwists)) {
    errors.push("themedTwists: use a list (it can be empty).");
  } else {
    game.themedTwists.forEach((twist, index) => {
      if (!isPlainObject(twist)) {
        errors.push(`themedTwists[${index}]: must be an object.`);
        return;
      }
      if (!VALID.themes.includes(twist.theme)) errors.push(`themedTwists[${index}].theme: choose a valid theme.`);
      if (!isFilledString(twist.title, 1, 80)) errors.push(`themedTwists[${index}].title: add a short title.`);
      if (!isFilledString(twist.text, 1, 400)) errors.push(`themedTwists[${index}].text: describe the twist.`);
    });
  }

  if (game.variantOf !== null && game.variantOf !== undefined) {
    if (!isFilledString(game.variantOf, 2, 70) || !ID_PATTERN.test(game.variantOf)) {
      errors.push("variantOf: use a valid game id or null.");
    } else if (game.variantOf === game.id) {
      errors.push("variantOf: a game cannot be a variant of itself.");
    } else if (!knownIds.has(game.variantOf) && !gamesById.has(game.variantOf)) {
      errors.push(`variantOf: “${game.variantOf}” is not in the library.`);
    } else {
      const base = gamesById.get(game.variantOf);
      if (base && base.variantOf) {
        errors.push(`variantOf: “${game.variantOf}” is itself a variant. Point at the original game instead.`);
      }
    }
  }

  if (typeof game.featured !== "boolean") errors.push("featured: use true or false.");

  if (!isPlainObject(game.art) || !VALID.colors.includes(game.art.color) || !VALID.icons.includes(game.art.icon)) {
    errors.push(`art: use a colour from ${VALID.colors.join(", ")} and a valid icon name.`);
  }

  if (!isFilledString(game.added, 1, 30) || !DATE_PATTERN.test(game.added || "")) {
    errors.push("added: use a date in YYYY-MM-DD format.");
  }

  if (!isFilledString(game.author, 1, 80)) errors.push("author: add a name or “Community contributor”.");

  return errors;
}

export function validateLibrary(games) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(games)) {
    return { errors: ["The games file must contain a JSON array."], warnings };
  }

  const gamesById = new Map();
  const ids = new Set();

  games.forEach((game, index) => {
    if (isPlainObject(game) && typeof game.id === "string") {
      if (ids.has(game.id)) errors.push(`games[${index}] (${game.id}): duplicate id.`);
      ids.add(game.id);
      gamesById.set(game.id, game);
    }
  });

  games.forEach((game, index) => {
    const label = isPlainObject(game) && game.title ? `“${game.title}”` : `games[${index}]`;
    const gameErrors = validateGame(game, { knownIds: new Set(), gamesById });
    gameErrors.forEach((error) => errors.push(`${label}: ${error}`));
  });

  const featuredCount = games.filter((game) => game.featured).length;
  if (featuredCount > 4) {
    warnings.push(`featured: ${featuredCount} games are marked as featured. Three or four works best on the home page.`);
  }

  const titles = games.map((game) => String(game.title || "").toLowerCase());
  const duplicateTitles = titles.filter((title, index) => title && titles.indexOf(title) !== index);
  [...new Set(duplicateTitles)].forEach((title) => warnings.push(`title: “${title}” appears more than once.`));

  return { errors, warnings };
}

export function parseSubmission(body) {
  if (typeof body !== "string" || body.length === 0) {
    return { game: null, found: false, error: "The issue body is empty." };
  }
  if (body.length > 30000) {
    return { game: null, found: true, error: "The issue body is too large to import safely." };
  }

  const start = body.indexOf(SUBMISSION_START);
  const end = body.indexOf(SUBMISSION_END);
  if (start === -1 || end === -1 || end <= start) {
    return { game: null, found: false, error: "No game submission markers were found." };
  }

  const section = body.slice(start + SUBMISSION_START.length, end);
  const codeMatch = section.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = (codeMatch ? codeMatch[1] : section).trim();

  try {
    return { game: JSON.parse(jsonText), found: true, error: "" };
  } catch (error) {
    return { game: null, found: true, error: `The submission is not valid JSON: ${error.message}` };
  }
}
