import { canSubmitInApp, submitPublicGame } from "../../../assets/js/auth.js";
import {
  COLORS,
  ICON_OPTIONS,
  copyText,
  escapeHTML,
  iconMarkup,
  initHeader,
  loadGames,
  parseLines,
  previewCardMarkup,
  showToast,
  uniqueId,
} from "./core.js";
import {
  AUTO_DURATIONS,
  appendTwistRow,
  inferMinutes,
  parseTips,
  populateGameSelects,
  readTwistRows,
  renderColorSwatches,
  renderIconChoices,
  renderThemeCheckboxes,
  todayISO,
  validateGameFields,
} from "./game-editor.js";

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
  iconSearch: document.querySelector("#icon-search"),
  iconCount: document.querySelector("#icon-count"),
  variant: document.querySelector("#game-variant"),
  author: document.querySelector("#game-author"),
  website: document.querySelector("#game-website"),
  twistList: document.querySelector("#twist-list"),
  twistTemplate: document.querySelector("#twist-row-template"),
  addTwist: document.querySelector("#add-twist"),
  preview: document.querySelector("#preview-card"),
  checklist: document.querySelector("#preview-checklist"),
  exportPanel: document.querySelector("#export-panel"),
  exportTitle: document.querySelector("#export-title"),
  exportMessage: document.querySelector("#export-message"),
  submitAnother: document.querySelector("#submit-another"),
  formStatus: document.querySelector("#form-status"),
  jsonPreview: document.querySelector("#json-preview"),
  copyJson: document.querySelector("#copy-json"),
  downloadJson: document.querySelector("#download-json"),
  reset: document.querySelector("#reset-form"),
  submit: document.querySelector("#prepare-game"),
};

let allGames = [];
let baseGames = [];
let currentGame = null;
let lastAutoDuration = AUTO_DURATIONS.normal;
let requestedVariant = "";
let submitting = false;

function populateFields() {
  populateGameSelects({
    gameType: elements.gameType,
    setting: elements.setting,
    players: elements.players,
    timeBand: elements.timeBand,
    energy: elements.energy,
    noise: elements.noise,
    mess: elements.mess,
  });

  elements.gameType.value = "Active";
  elements.setting.value = "indoors";
  elements.players.value = "Whole section";
  elements.timeBand.value = "normal";
  elements.duration.value = AUTO_DURATIONS.normal;
  lastAutoDuration = AUTO_DURATIONS.normal;
  elements.energy.value = "medium";
  elements.noise.value = "medium";
  elements.mess.value = "none";

  renderThemeCheckboxes(elements.themes);
  renderColorSwatches(elements.colorPicker, "purple");
  renderIconChoices(elements.iconPicker, elements.iconCount, { query: "", activeIcon: "gamepad" });

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
    <option value="">No, this is a standalone game</option>
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

function adaptationsFromForm() {
  return [
    { title: "Make it easier", text: elements.easier.value.trim() },
    { title: "Make it harder", text: elements.harder.value.trim() },
    { title: "Include everyone", text: elements.include.value.trim() },
  ].filter((item) => item.text);
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
    minutes: inferMinutes(duration, timeBand, elements.minutes.value),
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
    themedTwists: readTwistRows(elements.twistList)
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
    { label: "Title", done: game.title.length >= 3 },
    { label: "Short summary", done: game.summary.length >= 10 },
    { label: "At least one section", done: game.sections.length > 0 },
    { label: "Equipment list", done: game.equipment.length > 0 },
    { label: "Set-up and rules", done: game.steps.length > 0 && game.setup.length > 0 },
    { label: "How to win", done: game.winning.length >= 10 },
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

function invalidateSubmission() {
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
  const twists = readTwistRows(elements.twistList);
  const errors = validateGameFields(game, twists, baseGames);

  if (errors.length > 0) {
    let firstField = null;
    errors.forEach(([key, message]) => {
      const field = setError(key, message);
      if (!firstField && field) firstField = field;
    });
    elements.formStatus.textContent = "Please fix the highlighted fields before submitting.";
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

function showResultPanel(game, { submitted, title, message }) {
  currentGame = game;
  elements.jsonPreview.textContent = JSON.stringify(game, null, 2);
  elements.exportTitle.textContent = title;
  elements.exportMessage.textContent = message;
  elements.exportPanel.hidden = false;
  elements.formStatus.textContent = submitted
    ? "Game submitted! A maintainer will review and publish it to the library."
    : message;
  elements.formStatus.classList.toggle("is-success", submitted);
  elements.formStatus.hidden = false;
  elements.exportPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function handleSubmit() {
  if (submitting) return;
  invalidateSubmission();
  const game = validate();
  if (!game) return;

  if (!canSubmitInApp()) {
    showResultPanel(game, {
      submitted: false,
      title: "Submission service not connected yet",
      message:
        "Live in-app submissions need the Scout Tools submission worker configured in assets/js/site-config.js. In the meantime you can download or copy your game JSON below.",
    });
    return;
  }

  submitting = true;
  const originalLabel = elements.submit.innerHTML;
  elements.submit.disabled = true;
  elements.submit.textContent = "Submitting…";

  try {
    const result = await submitPublicGame(game, { website: elements.website?.value || "" });
    showResultPanel(game, {
      submitted: true,
      title: "Thanks — your game has been submitted",
      message:
        result.message ||
        "Your game is now in the review queue and will appear in the Games Finder once approved.",
    });
    showToast("Game submitted for review.");
  } catch (error) {
    elements.formStatus.textContent = error.message || "Could not submit your game. Please try again.";
    elements.formStatus.classList.remove("is-success");
    elements.formStatus.hidden = false;
    showResultPanel(game, {
      submitted: false,
      title: "Could not send automatically",
      message:
        "Your game details are valid, so you can try submitting again or download a JSON copy below so nothing is lost.",
    });
  } finally {
    submitting = false;
    elements.submit.disabled = false;
    elements.submit.innerHTML = originalLabel;
  }
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

function resetWholeForm() {
  form.reset();
  window.setTimeout(() => {
    currentGame = null;
    elements.exportPanel.hidden = true;
    elements.formStatus.hidden = true;
    elements.jsonPreview.textContent = "";
    elements.twistList.innerHTML = "";
    clearErrors();
    if (elements.iconSearch) {
      elements.iconSearch.value = "";
      renderIconChoices(elements.iconPicker, elements.iconCount, { query: "", activeIcon: "gamepad" });
    }
    setColor("purple");
    setIcon("gamepad");
    elements.duration.value = AUTO_DURATIONS.normal;
    lastAutoDuration = AUTO_DURATIONS.normal;
    updatePreview();
    elements.title.focus();
  }, 0);
}

function bindEvents() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });

  form.addEventListener("input", (event) => {
    if (event.target === elements.iconSearch) return;
    invalidateSubmission();
    updatePreview();
  });

  form.addEventListener("change", (event) => {
    if (event.target === elements.iconSearch) return;
    invalidateSubmission();
    updatePreview();
  });

  if (elements.iconSearch) {
    elements.iconSearch.addEventListener("input", () => {
      renderIconChoices(elements.iconPicker, elements.iconCount, {
        query: elements.iconSearch.value,
        activeIcon: elements.icon.value,
      });
    });
  }

  elements.timeBand.addEventListener("change", () => {
    const next = AUTO_DURATIONS[elements.timeBand.value] || AUTO_DURATIONS.normal;
    if (!elements.duration.value || elements.duration.value === lastAutoDuration) {
      elements.duration.value = next;
    }
    lastAutoDuration = next;
    updatePreview();
  });

  elements.colorPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-color]");
    if (!button) return;
    invalidateSubmission();
    setColor(button.dataset.color);
    updatePreview();
  });

  elements.iconPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-icon]");
    if (!button) return;
    invalidateSubmission();
    setIcon(button.dataset.icon);
    updatePreview();
  });

  elements.addTwist.addEventListener("click", () => {
    invalidateSubmission();
    const row = appendTwistRow(elements.twistList, elements.twistTemplate);
    row.querySelector("[data-twist-title]").focus();
    updatePreview();
  });

  elements.twistList.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-twist]");
    if (!remove) return;
    invalidateSubmission();
    remove.closest("[data-twist-row]").remove();
    updatePreview();
  });

  elements.twistList.addEventListener("input", () => {
    invalidateSubmission();
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

  elements.submitAnother?.addEventListener("click", resetWholeForm);

  elements.reset.addEventListener("click", () => {
    window.setTimeout(() => {
      currentGame = null;
      elements.exportPanel.hidden = true;
      elements.formStatus.hidden = true;
      elements.jsonPreview.textContent = "";
      elements.twistList.innerHTML = "";
      clearErrors();
      if (elements.iconSearch) {
        elements.iconSearch.value = "";
        renderIconChoices(elements.iconPicker, elements.iconCount, { query: "", activeIcon: "gamepad" });
      }
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
    populateVariants();
    if (elements.submit) elements.submit.disabled = false;
    updatePreview();
  } catch {
    if (elements.submit) elements.submit.disabled = false;
    elements.formStatus.textContent = "The existing games did not load, so variant links are unavailable right now. You can still submit your game.";
    elements.formStatus.classList.remove("is-success");
    elements.formStatus.hidden = false;
  }
}

init();
