/**
 * Kit List Generator — interactive wizard.
 */

import {
  SECTIONS,
  TRIP_TYPES,
  ACCOMMODATIONS,
  SEASONS,
  WEATHER,
  ACTIVITIES,
  MEALS,
  UNIFORM,
  PERSONAL,
  EXTRAS,
  buildKitList,
  clampNights,
  defaultAnswers,
  formatTripDates,
  getAccommodation,
  getActivity,
  getSection,
  getTripType,
  nightsBetween,
  normaliseAnswers,
  plainTextList,
  tripTitle,
} from "./kit-data.js";
import { downloadCsv } from "./kit-csv.js";
import { downloadKitListPdf } from "./kit-pdf.js";

const STORAGE_KEY = "scout-tools.kit-list.v1";
const form = document.querySelector("#kit-form");
const builder = document.querySelector("#builder");
const results = document.querySelector("#results");
const resultsTitle = document.querySelector("#results-title");
const statusLine = document.querySelector("#result-status");
const pdfButton = document.querySelector("#download-pdf");

let state = loadState();
let step = 1;
let currentList = null;

const QUESTION_DEFAULTS = {
  "water.sessions": "1",
  "water.wetsuit": "provided",
  "water.showers": "unknown",
  "hiking.length": "half",
  "hiking.terrain": "paths",
  "climbing.where": "indoor",
  "cycling.bikes": "hired",
  "cycling.terrain": "trafficfree",
  "campfire.cooking": "no",
};

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */

function loadState() {
  const defaults = defaultAnswers();
  const params = new URLSearchParams(window.location.search);
  const requestedSection = params.get("section");
  if (SECTIONS.some((section) => section.id === requestedSection)) {
    defaults.section = requestedSection;
    defaults.nights = getSection(requestedSection).defaultNights;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        const restored = normaliseAnswers({ ...defaults, ...parsed });
        if (requestedSection && SECTIONS.some((section) => section.id === requestedSection)) {
          restored.section = requestedSection;
          if (restored.tripType === "weekend") restored.nights = getSection(requestedSection).defaultNights;
        }
        return restored;
      }
    }
  } catch {
    // Local storage can be unavailable in private browsing. The form still works.
  }

  return normaliseAnswers(defaults);
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

/* --------------------------------------------------------------------------
   Small helpers
   -------------------------------------------------------------------------- */

function escapeHTML(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[character];
  });
}

function icon(name, className = "icon") {
  return `<svg class="${className}" aria-hidden="true" focusable="false"><use href="../assets/img/icons.svg#${escapeHTML(name)}"></use></svg>`;
}

function checked(name, value) {
  return state[name] === value ? " checked" : "";
}

function arrayChecked(name, value) {
  return Array.isArray(state[name]) && state[name].includes(value) ? " checked" : "";
}

function getCheckedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setStatus(message, tone = "") {
  statusLine.textContent = message;
  statusLine.classList.toggle("is-error", tone === "error");
  statusLine.classList.toggle("is-success", tone === "success");
}

/* --------------------------------------------------------------------------
   Option rendering
   -------------------------------------------------------------------------- */

function optionCards(items, name, selected, options = {}) {
  const { type = "radio", activity = false, showAges = false } = options;
  return items
    .map((item) => {
      const isChecked = type === "checkbox" ? selected.includes(item.id) : selected === item.id;
      return `
        <label class="option-card${activity ? " option-card--activity" : ""}">
          <input type="${type}" name="${escapeHTML(name)}" value="${escapeHTML(item.id)}"${isChecked ? " checked" : ""}>
          <span class="option-card__icon">${icon(item.icon || "cube")}</span>
          <span class="option-card__body">
            <span class="option-card__title">${escapeHTML(item.name)}</span>
            ${showAges && item.ages ? `<span class="option-card__meta">Ages ${escapeHTML(item.ages)}</span>` : ""}
            ${item.blurb ? `<span class="option-card__desc">${escapeHTML(item.blurb)}</span>` : ""}
          </span>
        </label>
      `;
    })
    .join("");
}

function chipOptions(items, name, selected, type = "checkbox") {
  return items
    .map(
      (item) => `
        <label class="chip-choice">
          <input type="${type}" name="${escapeHTML(name)}" value="${escapeHTML(item.id)}"${type === "checkbox" ? (selected.includes(item.id) ? " checked" : "") : selected === item.id ? " checked" : ""}>
          <span>${escapeHTML(item.name)}</span>
        </label>
      `,
    )
    .join("");
}

function renderStaticOptions() {
  document.querySelector("#section-options").innerHTML = optionCards(SECTIONS, "section", state.section, { showAges: true });
  document.querySelector("#trip-options").innerHTML = optionCards(TRIP_TYPES, "tripType", state.tripType);
  document.querySelector("#accommodation-options").innerHTML = optionCards(ACCOMMODATIONS, "accommodation", state.accommodation);
  document.querySelector("#meal-options").innerHTML = optionCards(MEALS, "meals", state.meals);
  document.querySelector("#weather-options").innerHTML = WEATHER.map(
    (item) => `
      <label class="chip-choice">
        <input type="checkbox" name="weather" value="${item.id}"${arrayChecked("weather", item.id)}>
        <span>${escapeHTML(item.name)}</span>
      </label>
    `,
  ).join("");
  document.querySelector("#uniform-options").innerHTML = chipOptions(UNIFORM, "uniform", state.uniform);
  document.querySelector("#personal-options").innerHTML = chipOptions(PERSONAL, "personal", state.personal);
  document.querySelector("#extra-options").innerHTML = chipOptions(EXTRAS, "extras", state.extras);
  document.querySelector("#activity-grid").innerHTML = optionCards(ACTIVITIES, "activities", state.activities, { type: "checkbox", activity: true });

  document.querySelector("#season").innerHTML = SEASONS.map(
    (season) => `<option value="${season.id}"${state.season === season.id ? " selected" : ""}>${escapeHTML(season.name)}</option>`,
  ).join("");

  document.querySelectorAll('input[name="ownTents"]').forEach((input) => {
    input.checked = input.value === state.ownTents;
  });
  document.querySelectorAll('input[name="showers"]').forEach((input) => {
    input.checked = input.value === state.showers;
  });
  document.querySelectorAll('input[name="laundry"]').forEach((input) => {
    input.checked = input.value === state.laundry;
  });

  document.querySelector("#include-leader-kit").checked = Boolean(state.includeLeaderKit);
}

function renderTextFields() {
  const values = {
    "trip-name": state.tripName,
    "group-name": state.groupName,
    venue: state.venue,
    "start-date": state.startDate,
    "end-date": state.endDate,
    "custom-items": state.customItems,
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.value = value || "";
  });
}

function renderNights() {
  const select = document.querySelector("#nights");
  const trip = getTripType(state.tripType);
  const section = getSection(state.section);

  let min = 1;
  let max = 4;
  if (trip.id === "day") {
    min = 0;
    max = 0;
  } else if (trip.id === "sleepover") {
    min = 1;
    max = 1;
  } else if (trip.id === "weekend") {
    min = 1;
    max = 4;
  } else if (trip.id === "long") {
    min = 2;
    max = 14;
  } else if (trip.id === "international") {
    min = 1;
    max = 21;
  }

  state.nights = clampNights(state.nights, trip.id, section.id);
  const options = [];
  for (let nights = min; nights <= max; nights += 1) {
    options.push(`<option value="${nights}">${nights === 0 ? "Day trip" : `${nights} night${nights === 1 ? "" : "s"}`}</option>`);
  }
  select.innerHTML = options.join("");
  select.value = String(state.nights);
  select.disabled = trip.id === "day" || trip.id === "sleepover";

  const hint = document.querySelector("#nights-hint");
  if (trip.id === "day") {
    hint.textContent = "No overnight stay — sleeping kit will not be added.";
  } else if (trip.id === "sleepover") {
    hint.textContent = "An indoor sleepover is one night.";
  } else if (trip.id === "weekend") {
    hint.textContent = `${section.name} weekend camps default to ${section.defaultNights === 1 ? "one night" : "two nights"}. Change it if you need to.`;
  } else {
    hint.textContent = "Set the number of nights so the quantities are right.";
  }
}

function renderActivityOptions() {
  const container = document.querySelector("#activity-options");
  const selected = state.activities.map((id) => getActivity(id)).filter(Boolean);

  if (!selected.length) {
    container.innerHTML = `
      <div class="info-panel">
        ${icon("info")}
        <p>No activities selected yet. The list will still cover the essentials — add activities for specialist kit.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = selected
    .map((activity) => {
      const options = state.activityOptions[activity.id] || {};
      const questions = (activity.questions || [])
        .map((question) => {
          if (question.type === "select") {
            const value = options[question.id] ?? QUESTION_DEFAULTS[`${activity.id}.${question.id}`] ?? "";
            return `
              <div class="question">
                <label class="field__label" for="q-${activity.id}-${question.id}">${escapeHTML(question.label)}</label>
                ${question.hint ? `<p class="field__hint">${escapeHTML(question.hint)}</p>` : ""}
                <select class="select" id="q-${activity.id}-${question.id}" name="${activity.id}.${question.id}">
                  ${question.options
                    .map((option) => `<option value="${escapeHTML(option.value)}"${value === option.value ? " selected" : ""}>${escapeHTML(option.label)}</option>`)
                    .join("")}
                </select>
              </div>
            `;
          }

          const value = options[question.id] ?? QUESTION_DEFAULTS[`${activity.id}.${question.id}`] ?? "";
          const type = question.type === "checkbox" ? "checkbox" : "radio";
          return `
            <fieldset class="question">
              <legend>${escapeHTML(question.label)}</legend>
              ${question.hint ? `<p class="field__hint">${escapeHTML(question.hint)}</p>` : ""}
              <div class="mini-options">
                ${question.options
                  .map(
                    (option) => `
                      <label class="mini-option">
                        <input type="${type}" name="${activity.id}.${question.id}" value="${escapeHTML(option.value)}"${
                          type === "checkbox" ? (Array.isArray(value) && value.includes(option.value) ? " checked" : "") : value === option.value ? " checked" : ""
                        }>
                        <span>
                          <strong>${escapeHTML(option.label)}</strong>
                          ${option.desc ? `<small>${escapeHTML(option.desc)}</small>` : ""}
                        </span>
                      </label>
                    `,
                  )
                  .join("")}
              </div>
            </fieldset>
          `;
        })
        .join("");

      return `
        <section class="activity-panel" aria-labelledby="activity-${activity.id}-title">
          <div class="activity-panel__head">
            ${icon(activity.icon)}
            <h4 id="activity-${activity.id}-title">${escapeHTML(activity.name)}</h4>
            <button class="text-button" type="button" data-remove-activity="${activity.id}">Remove</button>
          </div>
          <div class="question-grid">${questions}</div>
        </section>
      `;
    })
    .join("");
}

function updateConditionalVisibility() {
  const trip = getTripType(state.tripType);
  const day = trip.id === "day";
  const sleepover = trip.id === "sleepover";
  document.querySelector("#accommodation-fieldset").hidden = day || sleepover;
  const note = document.querySelector("#trip-note");
  const noteText = document.querySelector("#trip-note-text");
  note.hidden = !(day || sleepover);
  if (day) {
    noteText.textContent = "This is a day trip, so sleeping kit will not be added. Weather and activity choices still shape the list.";
  } else if (sleepover) {
    noteText.textContent = "This is an indoor sleepover, so we will pack for a hall or hut rather than a tent.";
  }
  const tentSelected = ["tent", "mixed"].includes(state.accommodation) && !day && !sleepover;
  document.querySelector("#own-tents-fieldset").hidden = !tentSelected;
  form.querySelectorAll('input[name="accommodation"]').forEach((input) => {
    input.checked = input.value === state.accommodation;
  });
}

function updateActivityCount() {
  const count = state.activities.length;
  const label = document.querySelector("#activity-count");
  label.textContent = count === 0 ? "No activities selected yet" : `${count} activit${count === 1 ? "y" : "ies"} selected`;
}

/* --------------------------------------------------------------------------
   Sidebar and review
   -------------------------------------------------------------------------- */

function renderSidebar() {
  const section = getSection(state.section);
  const trip = getTripType(state.tripType);
  const accommodation = getAccommodation(state.accommodation);
  const season = SEASONS.find((item) => item.id === state.season)?.name || "Mixed";
  const list = buildKitList(state);

  document.querySelector("#sidebar-title").textContent = tripTitle(state);
  document.querySelector("#sidebar-meta").textContent =
    `${state.nights === 0 ? "Day trip" : `${state.nights} night${state.nights === 1 ? "" : "s"}`} • ${state.nights === 0 ? "No overnight stay" : accommodation.name} • ${season}`;
  document.querySelector("#sidebar-activities").textContent = state.activities.length ? `${state.activities.length} selected` : "None yet";
  document.querySelector("#sidebar-items").textContent = String(list.totalItems);

  const tags = document.querySelector("#sidebar-activity-list");
  tags.innerHTML = state.activities
    .map((id) => getActivity(id))
    .filter(Boolean)
    .map((activity) => `<li>${escapeHTML(activity.name)}</li>`)
    .join("");

  const title = document.querySelector("#sidebar-title");
  title.dataset.section = section.id;
  title.dataset.trip = trip.id;
}

function renderReview() {
  const container = document.querySelector("#review-summary");
  const section = getSection(state.section);
  const trip = getTripType(state.tripType);
  const accommodation = getAccommodation(state.accommodation);
  const activityNames = state.activities.map((id) => getActivity(id)?.name).filter(Boolean);
  const personalNames = state.personal.map((id) => PERSONAL.find((item) => item.id === id)?.name).filter(Boolean);
  const extraNames = state.extras.map((id) => EXTRAS.find((item) => item.id === id)?.name).filter(Boolean);
  const uniformNames = state.uniform.map((id) => UNIFORM.find((item) => item.id === id)?.name).filter(Boolean);
  const weatherNames = state.weather.map((id) => WEATHER.find((item) => item.id === id)?.name).filter(Boolean);
  const meal = MEALS.find((item) => item.id === state.meals)?.name || "Catered";
  const list = buildKitList(state);

  const row = (title, value, stepTarget) => `
    <div class="review-row">
      <div class="review-row__body">
        <h4>${escapeHTML(title)}</h4>
        <p>${value}</p>
      </div>
      <button class="btn btn--ghost review-row__edit" type="button" data-step-target="${stepTarget}">Edit</button>
    </div>
  `;

  container.innerHTML = [
    row("Section & trip", `${escapeHTML(section.name)} • ${escapeHTML(trip.name)} • ${escapeHTML(formatTripDates(state))}${state.nights ? ` • ${state.nights} night${state.nights === 1 ? "" : "s"}` : ""}${state.nights ? ` • ${escapeHTML(accommodation.name)}` : ""}`, 1),
    row("Activities", activityNames.length ? activityNames.map(escapeHTML).join(" • ") : "No specialist activities selected.", 3),
    row("Season & weather", `${escapeHTML(SEASONS.find((item) => item.id === state.season)?.name || "Mixed")} • ${weatherNames.length ? weatherNames.map(escapeHTML).join(", ") : "Mixed"} • Showers: ${escapeHTML(state.showers === "unknown" ? "not sure" : state.showers)}`, 2),
    row("Food & uniform", `${escapeHTML(meal)}${uniformNames.length ? ` • ${uniformNames.map(escapeHTML).join(", ")}` : " • no uniform needed"}`, 4),
    row("Personal & extras", `${personalNames.length ? personalNames.map(escapeHTML).join(", ") : "No extra needs"}${extraNames.length ? ` • ${extraNames.map(escapeHTML).join(", ")}` : ""}`, 4),
    row("Leader & group kit", state.includeLeaderKit ? "Included — first aid, consent forms, fire kit, water and more." : "Not included.", 4),
    state.customItems.trim()
      ? row("Your additions", state.customItems.split(/\r?\n|;/).map((line) => escapeHTML(line.trim())).filter(Boolean).join(" • "), 4)
      : "",
    `<div class="review-total"><span>Estimated personal and group items</span><strong>${list.totalItems}</strong></div>`,
  ].join("");
}

/* --------------------------------------------------------------------------
   Wizard navigation
   -------------------------------------------------------------------------- */

function goToStep(nextStep, options = {}) {
  const target = Math.min(5, Math.max(1, Number(nextStep) || 1));
  step = target;

  document.querySelectorAll(".step").forEach((section) => {
    section.hidden = Number(section.dataset.step) !== target;
  });

  document.querySelectorAll("#wizard-steps button").forEach((button) => {
    const buttonStep = Number(button.dataset.stepTarget);
    if (buttonStep === target) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
    button.classList.toggle("is-complete", buttonStep < target);
  });

  document.querySelector("#wizard-bar").style.width = `${target * 20}%`;
  document.querySelector("#wizard-hint").textContent = `Step ${target} of 5`;
  document.querySelector("#back-btn").hidden = target === 1;
  document.querySelector("#next-btn").hidden = target === 5;
  document.querySelector("#generate-btn").hidden = target !== 5;

  if (target === 5) renderReview();

  if (options.scroll !== false) {
    builder.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }

  if (options.focus !== false) {
    const heading = document.querySelector(`.step[data-step="${target}"] h3`);
    if (heading) {
      window.setTimeout(() => heading.focus({ preventScroll: true }), 80);
    }
  }
}

function showFormError(message) {
  const error = document.querySelector("#form-error");
  error.textContent = message;
  error.hidden = !message;
}

/* --------------------------------------------------------------------------
   Results
   -------------------------------------------------------------------------- */

function renderKitDocument(list) {
  const meta = [
    ["Section", list.section],
    ["Trip", list.tripType],
    ["Dates", list.dates],
    ["Nights", list.nights === 0 ? "Day trip" : String(list.nights)],
    ["Sleeping", list.nights === 0 ? "Not staying over" : list.accommodation],
    ["Weather", list.weather.length ? list.weather.join(", ") : "Mixed"],
  ];

  const sections = list.groups
    .map(
      (group) => `
        <section class="kit-doc__section">
          <div class="kit-doc__section-head">
            <h3>${escapeHTML(group.title)}</h3>
            <span>${group.items.length} item${group.items.length === 1 ? "" : "s"}</span>
          </div>
          <ul class="kit-doc__items">
            ${group.items
              .map(
                (item) => `
                  <li class="kit-doc__item">
                    <span class="kit-doc__check" aria-hidden="true"></span>
                    <span class="kit-doc__item-body">
                      <span class="kit-doc__item-name">${escapeHTML(item.name)}</span>
                      ${item.note ? `<span class="kit-doc__item-note">${escapeHTML(item.note)}</span>` : ""}
                    </span>
                    <span class="kit-doc__qty">${item.qty ? escapeHTML(item.qty) : ""}${item.optional ? `<span class="kit-doc__optional">Optional</span>` : ""}</span>
                  </li>
                `,
              )
              .join("")}
          </ul>
        </section>
      `,
    )
    .join("");

  const metaLine = [list.section, list.dates, list.nights ? `${list.nights} night${list.nights === 1 ? "" : "s"}` : "Day trip", list.nights ? list.accommodation : "", list.venue, list.groupName]
    .filter(Boolean)
    .map(escapeHTML)
    .join("  •  ");

  const generated = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(list.generatedAt);

  return `
    <header class="kit-doc__header">
      <img class="kit-doc__logo" src="../assets/img/scouts-white.svg" alt="Scouts" width="176" height="50">
      <p class="kit-doc__eyebrow">Kit list</p>
      <h2 class="kit-doc__title">${escapeHTML(list.title)}</h2>
      <p class="kit-doc__meta">${metaLine}</p>
    </header>
    <dl class="kit-doc__summary">
      ${meta.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`).join("")}
    </dl>
    <p class="kit-doc__note">Work through this list with a grown-up and tick each item as it goes into your bag. It is a starting point — always check your event kit list and risk assessment too.</p>
    ${list.activities.length ? `<p class="kit-doc__activities"><strong>Activities:</strong> ${list.activities.map(escapeHTML).join(", ")}</p>` : ""}
    <div class="kit-doc__body">${sections}</div>
    <div class="kit-doc__tips">
      <h3>Before you go</h3>
      <ul>${list.tips.map((tip) => `<li>${escapeHTML(tip)}</li>`).join("")}</ul>
    </div>
    <div class="kit-doc__footer">
      <span>Generated with Scout Tools • ${escapeHTML(generated)}</span>
      <span>Independent resource • Not an official Scouts publication</span>
    </div>
  `;
}

function showResults(list) {
  currentList = list;
  document.querySelector("#kit-doc").innerHTML = renderKitDocument(list);
  document.querySelector("#results-subtitle").textContent = `${list.totalItems} items across ${list.groups.length} sections, tailored for ${list.section} and ${list.activities.length ? list.activities.length + " activities" : "the essentials"}.`;
  results.hidden = false;
  builder.hidden = true;
  setStatus("Your PDF and CSV are ready to download.", "success");
  results.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  window.setTimeout(() => resultsTitle.focus({ preventScroll: true }), 120);
}

/* --------------------------------------------------------------------------
   Change handling
   -------------------------------------------------------------------------- */

function updateFromControl(target) {
  const name = target.name;
  if (!name) return;

  const arrayFields = new Set(["weather", "uniform", "personal", "extras"]);
  if (arrayFields.has(name)) {
    state[name] = getCheckedValues(name);
  } else if (name === "activities") {
    state.activities = getCheckedValues("activities");
    state.activities.forEach((id) => {
      if (!state.activityOptions[id]) state.activityOptions[id] = {};
    });
    renderActivityOptions();
    updateActivityCount();
  } else if (name.includes(".")) {
    const [activityId, questionId] = name.split(".");
    if (!state.activityOptions[activityId]) state.activityOptions[activityId] = {};
    if (target.type === "checkbox") {
      const values = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
      state.activityOptions[activityId][questionId] = values;
    } else {
      state.activityOptions[activityId][questionId] = target.value;
    }
  } else if (name === "includeLeaderKit") {
    state.includeLeaderKit = target.checked;
  } else if (name === "nights") {
    state.nights = Number(target.value);
  } else if (name === "section" || name === "tripType") {
    state[name] = target.value;
    const trip = getTripType(state.tripType);
    const section = getSection(state.section);
    if (trip.id === "day") {
      state.nights = 0;
    } else if (trip.id === "sleepover") {
      state.nights = 1;
      state.accommodation = "indoor";
    } else if (state.startDate && state.endDate) {
      const dateNights = nightsBetween(state.startDate, state.endDate);
      state.nights = dateNights == null ? section.defaultNights : clampNights(dateNights, trip.id, section.id);
    } else if (trip.id === "weekend") {
      state.nights = section.defaultNights;
    } else {
      state.nights = clampNights(trip.nights ?? section.defaultNights, trip.id, section.id);
    }
  } else if (name === "startDate" || name === "endDate") {
    state[name] = target.value;
    if (state.startDate) document.querySelector("#end-date").min = state.startDate;
    if (state.startDate && state.endDate) {
      const dateNights = nightsBetween(state.startDate, state.endDate);
      if (dateNights != null) state.nights = clampNights(dateNights, state.tripType, state.section);
    }
  } else if (["tripName", "groupName", "venue", "customItems", "season", "ownTents", "showers", "laundry", "accommodation", "meals"].includes(name)) {
    state[name] = target.value;
  } else {
    state[name] = target.value;
  }

  state = normaliseAnswers(state);
  saveState();
  renderNights();
  updateConditionalVisibility();
  renderSidebar();
  updateActivityCount();
  if (step === 5) renderReview();
}

function handleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
  if (event.type === "input" && !["text", "textarea", "search"].includes(target.type)) return;
  updateFromControl(target);
}

/* --------------------------------------------------------------------------
   Downloads and reset
   -------------------------------------------------------------------------- */

async function handlePdfDownload() {
  if (!currentList) currentList = buildKitList(state);
  pdfButton.disabled = true;
  pdfButton.classList.add("is-busy");
  setStatus("Building your PDF…");
  try {
    await downloadKitListPdf(buildKitList(state));
    setStatus("PDF downloaded. Check your downloads folder.", "success");
  } catch (error) {
    console.error(error);
    setStatus(`${error.message || "The PDF could not be built."} You can use Print and choose “Save as PDF” instead.`, "error");
  } finally {
    pdfButton.disabled = false;
    pdfButton.classList.remove("is-busy");
  }
}

function handleCsvDownload() {
  const list = buildKitList(state);
  downloadCsv(list);
  setStatus("CSV downloaded — open it in a spreadsheet or copy the item column into OSM.", "success");
}

async function copyList() {
  const list = buildKitList(state);
  const text = plainTextList(list);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    const button = document.querySelector("#copy-list");
    const original = button.innerHTML;
    button.innerHTML = `${icon("check")} Copied`;
    setStatus("Kit list copied to your clipboard.", "success");
    window.setTimeout(() => {
      button.innerHTML = original;
    }, 2200);
  } catch {
    setStatus("Copying did not work in this browser. Try the PDF or print instead.", "error");
  }
}

function resetAll() {
  if (!window.confirm("Start a new kit list? Your current answers will be cleared from this device.")) return;
  state = normaliseAnswers(defaultAnswers());
  currentList = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  renderStaticOptions();
  renderTextFields();
  renderNights();
  renderActivityOptions();
  updateConditionalVisibility();
  renderSidebar();
  updateActivityCount();
  renderReview();
  results.hidden = true;
  builder.hidden = false;
  showFormError("");
  goToStep(1);
  setStatus("");
}

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */

form.addEventListener("change", handleChange);
form.addEventListener("input", handleChange);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  showFormError("");
  if (step === 5) {
    showResults(buildKitList(state));
  } else {
    goToStep(step + 1);
  }
});
form.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (["checkbox", "radio", "date"].includes(target.type)) return;
  event.preventDefault();
  showFormError("");
  if (step === 5) {
    showResults(buildKitList(state));
  } else {
    goToStep(step + 1);
  }
});

form.addEventListener("click", (event) => {
  const stepButton = event.target.closest("[data-step-target]");
  if (stepButton) {
    event.preventDefault();
    showFormError("");
    goToStep(stepButton.dataset.stepTarget);
    return;
  }

  const removeButton = event.target.closest("[data-remove-activity]");
  if (removeButton) {
    const id = removeButton.dataset.removeActivity;
    state.activities = state.activities.filter((activityId) => activityId !== id);
    delete state.activityOptions[id];
    form.querySelectorAll(`input[name="activities"][value="${id}"]`).forEach((input) => {
      input.checked = false;
    });
    saveState();
    renderActivityOptions();
    updateActivityCount();
    renderSidebar();
    return;
  }
});

document.querySelector("#next-btn").addEventListener("click", () => {
  showFormError("");
  if (step === 5) {
    showResults(buildKitList(state));
    return;
  }
  goToStep(step + 1);
});

document.querySelector("#back-btn").addEventListener("click", () => goToStep(step - 1));

document.querySelector("#generate-btn").addEventListener("click", () => {
  showFormError("");
  showResults(buildKitList(state));
});

document.querySelector("#clear-activities").addEventListener("click", () => {
  state.activities = [];
  state.activityOptions = {};
  form.querySelectorAll('input[name="activities"]').forEach((input) => {
    input.checked = false;
  });
  saveState();
  renderActivityOptions();
  updateActivityCount();
  renderSidebar();
});

document.querySelector("#start-again").addEventListener("click", resetAll);
document.querySelector("#start-again-results").addEventListener("click", resetAll);

document.querySelector("#download-pdf").addEventListener("click", handlePdfDownload);
document.querySelector("#download-csv").addEventListener("click", handleCsvDownload);
document.querySelector("#print-list").addEventListener("click", () => window.print());
document.querySelector("#copy-list").addEventListener("click", copyList);
document.querySelector("#edit-answers").addEventListener("click", () => {
  results.hidden = true;
  builder.hidden = false;
  goToStep(5);
});

document.querySelectorAll('a[href="#builder"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!builder.hidden) return;
    event.preventDefault();
    results.hidden = true;
    builder.hidden = false;
    goToStep(1);
  });
});

document.querySelector("#accommodation-options").addEventListener("change", () => {
  updateConditionalVisibility();
});

/* Mobile menu -------------------------------------------------------------- */

function initMenu() {
  const toggle = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (!toggle || !nav) return;

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

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

renderStaticOptions();
renderTextFields();
renderNights();
renderActivityOptions();
updateConditionalVisibility();
renderSidebar();
updateActivityCount();
renderReview();
initMenu();
goToStep(1, { scroll: false, focus: false });