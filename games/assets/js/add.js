import {
  COLORS,
  ENERGY_LEVELS,
  GAME_TYPES,
  ICON_OPTIONS,
  MESS_LEVELS,
  NOISE_LEVELS,
  PLAYER_OPTIONS,
  SECTIONS,
  SETTINGS,
  THEMES,
  TIME_BANDS,
  buildIssueMarkdown,
  buildIssueUrl,
  copyText,
  detectRepo,
  escapeHTML,
  iconMarkup,
  initHeader,
  loadGames,
  parseLines,
  previewCardMarkup,
  showToast,
  uniqueId,
} from "./core.js";

const AUTO_DURATIONS = { quick: "5–10 mins", normal: "10–20 mins", long: "20+ mins" };
const DEFAULT_MINUTES = { quick: 10, normal: 20, long: 30 };
const ENERGY_LABELS = { low: "Low", medium: "Medium", high: "High" };
const NOISE_LABELS = { quiet: "Quiet", medium: "Medium", loud: "Loud" };
const MESS_LABELS = { none: "None", low: "A little", medium: "Messy" };

const form = document.querySelector("#add-game-form");
const elements = {
  title: document.querySelector("#game-title"),
  summary: document.querySelector("#game-summary"),
  summaryCount: document.querySelector("#summary-count"),
  gameType: document.querySelector("#game-type"),
  setting: document.querySelector("#game-setting"),
  players: document.querySelector("#game-players"),
  duration: document.querySelector("#game-duration"),
  timeBand: document.querySelector("#game-timeband"),
  minutes: document.querySelector("#game-minutes"),
  energy: document.querySelector("#game-energy"),
  noise: document.querySelector("#game-noise"),
  mess: document.querySelector("#game-mess"),
  equipment: document.querySelector("#game-equipment"),
  setup: document.querySelector("#game-setup"),
  steps: document.querySelector("#game-steps"),
  winning: document.querySelector("#game-winning"),
  safety: document.querySelector("#game-safety"),
  tips: document.querySelector("#game-tips"),
  easier: document.querySelector("#game-easier"),
  harder: document.querySelector("#game-harder"),
  include: document.querySelector("#game-include"),
  sections: document.querySelector("#sections-group"),
  themes: document.querySelector("#themes-group"),
  color: document.querySelector("#game-color"),
  icon: document.querySelector("#game-icon"),
  colorPicker: document.querySelector("#color-picker"),
  iconPicker: document.querySelector("#icon-picker"),
  variant: document.querySelector("#game-variant"),
  author: document.querySelector("#game-author"),
  twistList: document.querySelector("#twist-list"),
  twistTemplate: document.querySelector("#twist-row-template"),
  addTwist: document.querySelector("#add-twist"),
  preview: document.querySelector("#preview-card"),
  checklist: document.querySelector("#preview-checklist"),
  exportPanel: document.querySelector("#export-panel"),
  formStatus: document.querySelector("#form-status"),
  jsonPreview: document.querySelector("#json-preview"),
  copyJson: document.querySelector("#copy-json"),
  downloadJson: document.querySelector("#download-json"),
  downloadLibrary: document.querySelector("#download-library"),
  submitIssue: document.querySelector("#submit-issue"),
  copyIssue: document.querySelector("#copy-issue"),
  issueHint: document.querySelector("#issue-hint"),
  reset: document.querySelector("#reset-form"),
  submit: document.querySelector("#prepare-game"),
};

let allGames = [];
let baseGames = [];
let libraryLoaded = false;
let currentGame = null;
let lastAutoDuration = AUTO_DURATIONS.normal;
let requestedVariant = "";

function fillSelect(select, options, { valueKey = "value", labelKey = "label" } = {}) {
  select.innerHTML = options
    .map((option) => {
      const value = typeof option === "string" ? option : option[valueKey];
      const label = typeof option === "string" ? option : option[labelKey];
      return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
    })
    .join("");
}

function populateFields() {
  fillSelect(elements.gameType, GAME_TYPES);
  fillSelect(elements.setting, [...SETTINGS, { value: "both", label: "Indoors or outdoors" }]);
  fillSelect(elements.players, PLAYER_OPTIONS);
  fillSelect(
    elements.timeBand,
    TIME_BANDS.map((band) => ({ value: band.value, label: `${band.label} (${band.detail})` })),
  );
  fillSelect(
    elements.energy,
    ENERGY_LEVELS.map((value) => ({ value, label: ENERGY_LABELS[value] })),
  );
  fillSelect(
    elements.noise,
    NOISE_LEVELS.map((value) => ({ value, label: NOISE_LABELS[value] })),
  );
  fillSelect(
    elements.mess,
    MESS_LEVELS.map((value) => ({ value, label: MESS_LABELS[value] })),
  );

  elements.gameType.value = "Active";
  elements.setting.value = "indoors";
  elements.players.value = "Whole section";
  elements.timeBand.value = "normal";
  elements.duration.value = AUTO_DURATIONS.normal;
  lastAutoDuration = AUTO_DURATIONS.normal;
  elements.energy.value = "medium";
  elements.noise.value = "medium";
  elements.mess.value = "none";

  elements.themes.innerHTML = THEMES.map(
    (theme) => `
      <label class="choice">
        <input type="checkbox" name="themes" value="${escapeHTML(theme.value)}">
        <span class="choice__dot" aria-hidden="true"></span>
        ${iconMarkup(theme.icon, "icon icon--sm")}
        ${escapeHTML(theme.label)}
      </label>`,
  ).join("");

  elements.colorPicker.innerHTML = COLORS.map(
    (color) => `
      <button class="swatch" type="button" data-color="${escapeHTML(color.value)}" aria-label="${escapeHTML(color.label)}" aria-pressed="false" title="${escapeHTML(color.label)}"></button>`,
  ).join("");

  elements.iconPicker.innerHTML = ICON_OPTIONS.map(
    (option) => `
      <button class="icon-choice" type="button" data-icon="${escapeHTML(option.value)}" aria-label="${escapeHTML(option.label)}" aria-pressed="false" title="${escapeHTML(option.label)}">
        ${iconMarkup(option.value, "icon")}
        <span class="icon-choice__label">${escapeHTML(option.label)}</span>
      </button>`,
  ).join("");

  setColor("purple");
  setIcon("gamepad");
}

function setColor(value) {
  const allowed = COLORS.some((color) => color.value === value) ? value : "purple";
  elements.color.value = allowed;
  elements.colorPicker.querySelectorAll("[data-color]").forEach((button) => {
    const active = button.dataset.color === allowed;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setIcon(value) {
  const allowed = ICON_OPTIONS.some((option) => option.value === value) ? value : "gamepad";
  elements.icon.value = allowed;
  elements.iconPicker.querySelectorAll("[data-icon]").forEach((button) => {
    const active = button.dataset.icon === allowed;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function populateVariants() {
  baseGames = allGames
    .filter((game) => !game.variantOf)
    .sort((a, b) => a.title.localeCompare(b.title, "en-GB"));
  elements.variant.innerHTML = `
    <option value="">No — this is a new original game</option>
    ${baseGames
      .map((game) => `<option value="${escapeHTML(game.id)}">${escapeHTML(game.title)}</option>`)
      .join("")}
  `;
  if (requestedVariant && baseGames.some((game) => game.id === requestedVariant)) {
    elements.variant.value = requestedVariant;
  }
}

function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function readTwists() {
  return [...elements.twistList.querySelectorAll("[data-twist-row]")].map((row) => ({
    theme: row.querySelector("[data-twist-theme]")?.value || "",
    title: row.querySelector("[data-twist-title]")?.value.trim() || "",
    text: row.querySelector("[data-twist-text]")?.value.trim() || "",
    row,
  }));
}

function addTwistRow(values = {}) {
  const fragment = elements.twistTemplate.content.cloneNode(true);
  const row = fragment.querySelector("[data-twist-row]");
  const themeSelect = row.querySelector("[data-twist-theme]");
  fillSelect(
    themeSelect,
    THEMES.map((theme) => ({ value: theme.value, label: theme.label })),
  );
  themeSelect.value = values.theme || THEMES[0].value;
  row.querySelector("[data-twist-title]").value = values.title || "";
  row.querySelector("[data-twist-text]").value = values.text || "";
  elements.twistList.append(row);
  return row;
}

function parseTips(value) {
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

function adaptationsFromForm() {
  return [
    { title: "Make it easier", text: elements.easier.value.trim() },
    { title: "Make it harder", text: elements.harder.value.trim() },
    { title: "Include everyone", text: elements.include.value.trim() },
  ].filter((item) => item.text);
}

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inferMinutes(duration, timeBand) {
  const explicit = Number(elements.minutes.value);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(180, Math.round(explicit));
  const match = String(duration).match(/\d+/);
  if (match) return Number(match[0]);
  return DEFAULT_MINUTES[timeBand] || 20;
}

function draftGame() {
  const title = elements.title.value.trim();
  const timeBand = elements.timeBand.value;
  const duration = elements.duration.value.trim();
  return {
    title,
    summary: elements.summary.value.trim(),
    sections: checkedValues("sections"),
    timeBand,
    duration,
    minutes: inferMinutes(duration, timeBand),
    setting: elements.setting.value,
    players: elements.players.value,
    gameType: elements.gameType.value,
    energy: elements.energy.value,
    noise: elements.noise.value,
    mess: elements.mess.value,
    themes: checkedValues("themes"),
    equipment: parseLines(elements.equipment.value),
    setup: parseLines(elements.setup.value),
    steps: parseLines(elements.steps.value),
    winning: elements.winning.value.trim(),
    safety: elements.safety.value.trim(),
    tips: parseTips(elements.tips.value),
    adaptations: adaptationsFromForm(),
    themedTwists: readTwists()
      .filter((twist) => twist.theme && twist.title && twist.text)
      .map(({ theme, title: twistTitle, text }) => ({ theme, title: twistTitle, text })),
    variantOf: elements.variant.value || null,
    featured: false,
    art: { color: elements.color.value, icon: elements.icon.value },
    added: todayISO(),
    author: elements.author.value.trim() || "Community contributor",
  };
}

function updatePreview() {
  const game = draftGame();
  elements.preview.innerHTML = previewCardMarkup(game);
  elements.summaryCount.textContent = String(elements.summary.value.length);

  const checks = [
    { label: "A clear title", done: game.title.length >= 3 },
    { label: "A short summary", done: game.summary.length >= 10 },
    { label: "At least one section", done: game.sections.length > 0 },
    { label: "Equipment list", done: game.equipment.length > 0 },
    { label: "Rules and set-up", done: game.steps.length > 0 && game.setup.length > 0 },
    { label: "Safety notes", done: game.safety.length >= 10 },
  ];
  elements.checklist.innerHTML = checks
    .map(
      (check) => `
      <span class="preview-check${check.done ? " is-done" : ""}">
        ${iconMarkup("check", "icon")}
        ${escapeHTML(check.label)}
      </span>`,
    )
    .join("");
}

function invalidateExport() {
  if (!currentGame) return;
  currentGame = null;
  elements.exportPanel.hidden = true;
  elements.formStatus.hidden = true;
  elements.jsonPreview.textContent = "";
}

function clearErrors() {
  form.querySelectorAll(".is-invalid").forEach((element) => element.classList.remove("is-invalid"));
  form.querySelectorAll("[aria-invalid='true']").forEach((element) => element.removeAttribute("aria-invalid"));
  form.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });
}

function setError(key, message) {
  const error = form.querySelector(`[data-error-for="${key}"]`);
  if (error) error.textContent = message;

  const fields = {
    title: [elements.title],
    summary: [elements.summary],
    sections: [...form.querySelectorAll('input[name="sections"]')],
    duration: [elements.duration],
    timeBand: [elements.timeBand],
    equipment: [elements.equipment],
    setup: [elements.setup],
    steps: [elements.steps],
    winning: [elements.winning],
    safety: [elements.safety],
    variantOf: [elements.variant],
    twists: [...elements.twistList.querySelectorAll(".input, .select, .textarea")],
  }[key] || [];

  fields.forEach((field) => {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
  });
  return fields[0] || null;
}

function validate() {
  clearErrors();
  const game = draftGame();
  const errors = [];

  if (game.title.length < 3) errors.push(["title", "Give the game a title of at least 3 characters."]);
  if (game.title.length > 80) errors.push(["title", "Keep the title under 80 characters."]);
  if (game.summary.length < 10) errors.push(["summary", "Write a summary of at least 10 characters."]);
  if (game.sections.length === 0) errors.push(["sections", "Choose at least one section."]);
  if (!game.duration) errors.push(["duration", "Add a guide duration, such as “10–20 mins”."]);
  if (!game.timeBand) errors.push(["timeBand", "Choose a time filter."]);
  if (game.equipment.length === 0) errors.push(["equipment", "List at least one piece of equipment, or write “None”."]);
  if (game.setup.length === 0) errors.push(["setup", "Add at least one set-up step."]);
  if (game.steps.length === 0) errors.push(["steps", "Add at least one rule or step."]);
  if (game.winning.length < 10) errors.push(["winning", "Explain how the game ends or how a team wins."]);
  if (game.safety.length < 10) errors.push(["safety", "Add a safety note of at least 10 characters."]);

  const incompleteTwists = readTwists().filter((twist) => {
    const hasAny = Boolean(twist.title || twist.text);
    const complete = Boolean(twist.theme && twist.title && twist.text);
    return hasAny && !complete;
  });
  if (incompleteTwists.length > 0) {
    errors.push(["twists", "Complete the theme, title and description for each twist, or remove the empty row."]);
  }

  if (game.variantOf && !baseGames.some((base) => base.id === game.variantOf)) {
    errors.push(["variantOf", "Choose a valid base game, or leave this as a new original game."]);
  }

  if (errors.length > 0) {
    let firstField = null;
    errors.forEach(([key, message]) => {
      const field = setError(key, message);
      if (!firstField && field) firstField = field;
    });
    elements.formStatus.textContent = "Please fix the highlighted fields before preparing the game.";
    elements.formStatus.classList.remove("is-success");
    elements.formStatus.hidden = false;
    firstField?.focus();
    return null;
  }

  return {
    ...game,
    id: uniqueId(game.title, allGames.map((item) => item.id)),
  };
}

function renderExport(game) {
  currentGame = game;
  const issueUrl = buildIssueUrl(game);
  const json = JSON.stringify(game, null, 2);
  elements.jsonPreview.textContent = json;
  elements.exportPanel.hidden = false;
  elements.formStatus.textContent = "Game prepared. Check the preview, then download the JSON or send it to us.";
  elements.formStatus.classList.add("is-success");
  elements.formStatus.hidden = false;

  if (issueUrl) {
    elements.submitIssue.href = issueUrl;
    elements.submitIssue.hidden = false;
    elements.issueHint.textContent = "This opens a GitHub issue with your game JSON already filled in. A leader will review it before it goes live.";
  } else {
    elements.submitIssue.hidden = true;
    elements.issueHint.textContent = detectRepo()
      ? "The GitHub issue link could not be built. Copy the issue text instead."
      : "The GitHub issue button appears once this site is published and the repository is configured. For now, download the JSON or copy the issue text.";
  }

  elements.exportPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function downloadText(text, filename, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindEvents() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    invalidateExport();
    const game = validate();
    if (!game) return;
    renderExport(game);
  });

  form.addEventListener("input", () => {
    invalidateExport();
    updatePreview();
  });

  form.addEventListener("change", () => {
    invalidateExport();
    updatePreview();
  });

  elements.timeBand.addEventListener("change", () => {
    const next = AUTO_DURATIONS[elements.timeBand.value] || AUTO_DURATIONS.normal;
    if (!elements.duration.value || elements.duration.value === lastAutoDuration) {
      elements.duration.value = next;
    }
    lastAutoDuration = next;
    updatePreview();
  });

  elements.summary.addEventListener("input", () => {
    elements.summaryCount.textContent = String(elements.summary.value.length);
  });

  elements.colorPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    invalidateExport();
    setColor(button.dataset.color);
    updatePreview();
  });

  elements.iconPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-icon]");
    if (!button) return;
    invalidateExport();
    setIcon(button.dataset.icon);
    updatePreview();
  });

  elements.addTwist.addEventListener("click", () => {
    invalidateExport();
    const row = addTwistRow();
    row.querySelector("[data-twist-title]").focus();
    updatePreview();
  });

  elements.twistList.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-twist]");
    if (!remove) return;
    invalidateExport();
    remove.closest("[data-twist-row]").remove();
    updatePreview();
  });

  elements.twistList.addEventListener("input", () => {
    invalidateExport();
    updatePreview();
  });

  elements.copyJson.addEventListener("click", () => {
    if (!currentGame) return;
    copyText(JSON.stringify(currentGame, null, 2), "Game JSON copied to clipboard.");
  });

  elements.downloadJson.addEventListener("click", () => {
    if (!currentGame) return;
    downloadText(JSON.stringify(currentGame, null, 2), `${currentGame.id}.json`);
    showToast("Game JSON downloaded.");
  });

  elements.downloadLibrary.addEventListener("click", () => {
    if (!currentGame) return;
    if (!libraryLoaded) {
      showToast("The existing library did not load, so only the single game download is available.");
      return;
    }
    const library = [...allGames, currentGame];
    downloadText(JSON.stringify(library, null, 2), "games.json");
    showToast("Updated games.json downloaded.");
  });

  elements.copyIssue.addEventListener("click", () => {
    if (!currentGame) return;
    copyText(buildIssueMarkdown(currentGame), "Issue text copied to clipboard.");
  });

  elements.reset.addEventListener("click", () => {
    window.setTimeout(() => {
      currentGame = null;
      elements.exportPanel.hidden = true;
      elements.formStatus.hidden = true;
      elements.jsonPreview.textContent = "";
      elements.twistList.innerHTML = "";
      clearErrors();
      setColor("purple");
      setIcon("gamepad");
      lastAutoDuration = elements.duration.value || AUTO_DURATIONS.normal;
      updatePreview();
      elements.title.focus();
    }, 0);
  });
}

async function init() {
  initHeader();
  populateFields();
  bindEvents();
  updatePreview();

  requestedVariant = new URLSearchParams(window.location.search).get("variantOf") || "";

  try {
    allGames = await loadGames();
    libraryLoaded = true;
    populateVariants();
    if (elements.submit) elements.submit.disabled = false;
    updatePreview();
  } catch (error) {
    libraryLoaded = false;
    if (elements.submit) elements.submit.disabled = false;
    elements.formStatus.textContent = "The existing games could not be loaded, so variant links and the full-library download may be unavailable. You can still fill in the form and download this game on its own.";
    elements.formStatus.classList.remove("is-success");
    elements.formStatus.hidden = false;
    elements.downloadLibrary.disabled = true;
  }
}

init();
