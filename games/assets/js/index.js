import {
  SECTIONS,
  THEMES,
  TIME_BANDS,
  gameCardMarkup,
  initHeader,
  loadGames,
  matchesFilters,
  savedIds,
  sortGames,
  toggleSaved,
} from "./core.js";

const GAMES_PER_PAGE = 12;
const SORT_OPTIONS = ["featured", "shortest", "az", "newest"];
const SECTION_VALUES = SECTIONS.map((section) => section.value);
const THEME_VALUES = THEMES.map((theme) => theme.value);
const TIME_VALUES = TIME_BANDS.map((band) => band.value);

const state = {
  query: "",
  section: "",
  time: "",
  theme: "",
  setting: "",
  saved: false,
  sort: "featured",
  page: 1,
};

const elements = {
  filters: document.querySelector("#filters"),
  search: document.querySelector("#filter-search"),
  section: document.querySelector("#filter-section"),
  time: document.querySelector("#filter-time"),
  theme: document.querySelector("#filter-theme"),
  setting: document.querySelector("#filter-setting"),
  sort: document.querySelector("#sort-games"),
  quickChips: document.querySelector("#quick-chips"),
  clearFilters: document.querySelector("#clear-filters"),
  featuredSection: document.querySelector("#featured-section"),
  featuredGrid: document.querySelector("#featured-grid"),
  results: document.querySelector("#results"),
  resultsTitle: document.querySelector("#results-title"),
  resultsCount: document.querySelector("#results-count"),
  loading: document.querySelector("#games-loading"),
  grid: document.querySelector("#game-grid"),
  empty: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-state h2"),
  emptyText: document.querySelector("#empty-state p"),
  emptyReset: document.querySelector("#empty-reset"),
  emptyRandom: document.querySelector("#empty-random"),
  pagination: document.querySelector("#pagination"),
  random: document.querySelector("#random-game"),
};

let allGames = [];
let filteredGames = [];
let searchTimer = 0;

function populateThemeOptions() {
  elements.theme.insertAdjacentHTML(
    "beforeend",
    THEMES.map((theme) => `<option value="${theme.value}">${theme.label}</option>`).join(""),
  );
}

function readStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");
  const time = params.get("time");
  const theme = params.get("theme");
  const setting = params.get("setting");
  const sort = params.get("sort");
  const page = Number(params.get("page"));

  state.query = (params.get("q") || "").trim();
  state.section = SECTION_VALUES.includes(section) ? section : "";
  state.time = TIME_VALUES.includes(time) ? time : "";
  state.theme = THEME_VALUES.includes(theme) ? theme : "";
  state.setting = ["indoors", "outdoors"].includes(setting) ? setting : "";
  state.saved = params.get("saved") === "1";
  state.sort = SORT_OPTIONS.includes(sort) ? sort : "featured";
  state.page = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  elements.search.value = state.query;
  elements.section.value = state.section;
  elements.time.value = state.time;
  elements.theme.value = state.theme;
  elements.setting.value = state.setting;
  elements.sort.value = state.sort;
}

function writeStateToURL() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.section) params.set("section", state.section);
  if (state.time) params.set("time", state.time);
  if (state.theme) params.set("theme", state.theme);
  if (state.setting) params.set("setting", state.setting);
  if (state.saved) params.set("saved", "1");
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

function hasActiveFilters() {
  return Boolean(state.query || state.section || state.time || state.theme || state.setting || state.saved);
}

function filtersForState() {
  return {
    query: state.query,
    section: state.section,
    time: state.time,
    theme: state.theme,
    setting: state.setting,
    saved: state.saved,
  };
}

function applyFilters({ resetPage = true, scroll = false } = {}) {
  if (resetPage) state.page = 1;
  filteredGames = sortGames(allGames.filter((game) => matchesFilters(game, filtersForState())), state.sort);
  const pageCount = Math.max(1, Math.ceil(filteredGames.length / GAMES_PER_PAGE));
  state.page = Math.min(Math.max(1, state.page), pageCount);
  renderResults();
  updateQuickChipStates();
  updateHeadings();
  writeStateToURL();
  if (scroll) {
    elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function updateHeadings() {
  if (state.saved) {
    elements.resultsTitle.textContent = "Saved games";
  } else if (state.section) {
    const section = SECTIONS.find((item) => item.value === state.section);
    elements.resultsTitle.textContent = `Games for ${section?.label || "your section"}`;
  } else if (state.query) {
    elements.resultsTitle.textContent = "Search results";
  } else if (state.theme) {
    const theme = THEMES.find((item) => item.value === state.theme);
    elements.resultsTitle.textContent = `${theme?.label || "Themed"} ideas`;
  } else {
    elements.resultsTitle.textContent = "All games";
  }

  if (filteredGames.length === 0) {
    elements.resultsCount.textContent = "No games found";
  } else if (hasActiveFilters()) {
    elements.resultsCount.innerHTML = `<strong>${filteredGames.length}</strong> ${filteredGames.length === 1 ? "game matches" : "games match"} your filters`;
  } else {
    elements.resultsCount.innerHTML = `<strong>${filteredGames.length}</strong> games in the library`;
  }

  elements.clearFilters.hidden = !hasActiveFilters();
  elements.featuredSection.hidden = hasActiveFilters();
}

function renderResults() {
  const pageCount = Math.max(1, Math.ceil(filteredGames.length / GAMES_PER_PAGE));
  const start = (state.page - 1) * GAMES_PER_PAGE;
  const pageGames = filteredGames.slice(start, start + GAMES_PER_PAGE);

  elements.loading.hidden = true;
  elements.grid.hidden = pageGames.length === 0;
  elements.empty.hidden = pageGames.length > 0;

  if (pageGames.length === 0) {
    if (state.saved) {
      elements.emptyTitle.textContent = "No saved games yet";
      elements.emptyText.textContent = "Tap the bookmark on any game to keep it here. Your saved games stay in this browser, ready for your next meeting.";
    } else {
      elements.emptyTitle.textContent = "No games match those filters";
      elements.emptyText.textContent = "Try a different section, a longer game, or clear the search box. There are plenty more games waiting.";
    }
  }

  elements.grid.innerHTML = pageGames.map((game) => gameCardMarkup(game, { theme: state.theme })).join("");
  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  elements.pagination.innerHTML = "";
  if (pageCount <= 1) return;

  const pages = new Set([1, pageCount, state.page - 1, state.page, state.page + 1]);
  if (state.page <= 3) pages.add(2).add(3);
  if (state.page >= pageCount - 2) pages.add(pageCount - 1).add(pageCount - 2);
  const visible = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);

  const fragment = document.createDocumentFragment();
  fragment.append(
    paginationButton({
      label: "Previous page",
      content: `<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#chevron-left"></use></svg>`,
      page: state.page - 1,
      disabled: state.page === 1,
      ariaLabel: "Previous page",
    }),
  );

  let lastPage = 0;
  visible.forEach((page) => {
    if (lastPage && page - lastPage > 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination__ellipsis";
      ellipsis.setAttribute("aria-hidden", "true");
      ellipsis.textContent = "…";
      fragment.append(ellipsis);
    }
    fragment.append(
      paginationButton({
        label: String(page),
        content: String(page),
        page,
        active: page === state.page,
        ariaLabel: `Page ${page}`,
      }),
    );
    lastPage = page;
  });

  fragment.append(
    paginationButton({
      label: "Next page",
      content: `<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#chevron-right"></use></svg>`,
      page: state.page + 1,
      disabled: state.page === pageCount,
      ariaLabel: "Next page",
    }),
  );

  elements.pagination.append(fragment);
}

function paginationButton({ label, content, page, disabled = false, active = false, ariaLabel }) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.page = String(page);
  button.innerHTML = content;
  button.setAttribute("aria-label", ariaLabel || label);
  if (disabled) button.disabled = true;
  if (active) {
    button.classList.add("is-active");
    button.setAttribute("aria-current", "page");
  }
  return button;
}

function goToPage(page) {
  state.page = page;
  renderResults();
  writeStateToURL();
  elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderQuickChips() {
  const chips = [
    { key: "all", label: "All games", icon: "grid", count: allGames.length },
    { key: "section:beavers", label: "Beavers", icon: "users", count: countGames({ section: "beavers" }) },
    { key: "section:cubs", label: "Cubs", icon: "users", count: countGames({ section: "cubs" }) },
    { key: "section:scouts", label: "Scouts", icon: "users", count: countGames({ section: "scouts" }) },
    { key: "time:quick", label: "Quick games", icon: "zap", count: countGames({ time: "quick" }) },
    { key: "saved", label: "Saved", icon: "bookmark", count: savedIds().length },
  ];

  elements.quickChips.innerHTML = `
    <span class="quick-chips__label">Quick picks</span>
    ${chips
      .map(
        (chip) => `
        <button class="chip" type="button" data-chip="${chip.key}">
          <svg class="icon icon--sm" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#${chip.icon}"></use></svg>
          ${chip.label}
          <span class="chip__count">${chip.count}</span>
        </button>`,
      )
      .join("")}
  `;
  updateQuickChipStates();
}

function countGames(filters) {
  return allGames.filter((game) => matchesFilters(game, filters)).length;
}

function updateQuickChipStates() {
  elements.quickChips.querySelectorAll("[data-chip]").forEach((chip) => {
    const key = chip.dataset.chip;
    let active = false;
    if (key === "all") active = !hasActiveFilters();
    if (key === "saved") active = state.saved;
    if (key.startsWith("section:")) active = state.section === key.split(":")[1];
    if (key.startsWith("time:")) active = state.time === key.split(":")[1];
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
}

function resetFilters() {
  state.query = "";
  state.section = "";
  state.time = "";
  state.theme = "";
  state.setting = "";
  state.saved = false;
  elements.search.value = "";
  elements.section.value = "";
  elements.time.value = "";
  elements.theme.value = "";
  elements.setting.value = "";
  applyFilters({ scroll: true });
}

function pickRandomGame() {
  const pool = filteredGames.length > 0 ? filteredGames : allGames;
  if (pool.length === 0) return;
  const game = pool[Math.floor(Math.random() * pool.length)];
  window.location.href = `game?id=${encodeURIComponent(game.id)}`;
}

function updateSaveButtons() {
  const saved = savedIds();
  document.querySelectorAll("[data-save-id]").forEach((button) => {
    const isSaved = saved.includes(button.dataset.saveId);
    button.classList.toggle("is-saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${button.dataset.gameTitle || "game"}`);
  });
}

function bindEvents() {
  elements.filters.addEventListener("submit", (event) => event.preventDefault());

  elements.search.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = elements.search.value.trim();
      applyFilters();
    }, 220);
  });

  elements.section.addEventListener("change", () => {
    state.section = elements.section.value;
    applyFilters();
  });
  elements.time.addEventListener("change", () => {
    state.time = elements.time.value;
    applyFilters();
  });
  elements.theme.addEventListener("change", () => {
    state.theme = elements.theme.value;
    applyFilters();
  });
  elements.setting.addEventListener("change", () => {
    state.setting = elements.setting.value;
    applyFilters();
  });
  elements.sort.addEventListener("change", () => {
    state.sort = elements.sort.value;
    applyFilters({ resetPage: false });
  });

  elements.quickChips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-chip]");
    if (!chip) return;
    const [type, value] = chip.dataset.chip.split(":");
    if (type === "all") {
      resetFilters();
      return;
    }
    if (type === "saved") {
      state.saved = !state.saved;
    }
    if (type === "section") {
      state.section = state.section === value ? "" : value;
      elements.section.value = state.section;
    }
    if (type === "time") {
      state.time = state.time === value ? "" : value;
      elements.time.value = state.time;
    }
    applyFilters();
  });

  elements.clearFilters.addEventListener("click", resetFilters);
  elements.emptyReset.addEventListener("click", resetFilters);
  elements.random.addEventListener("click", pickRandomGame);
  elements.emptyRandom.addEventListener("click", pickRandomGame);

  elements.pagination.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button || button.disabled) return;
    goToPage(Number(button.dataset.page));
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-id]");
    if (!button) return;
    toggleSaved(button.dataset.saveId);
  });

  document.addEventListener("savedchange", () => {
    updateSaveButtons();
    renderQuickChips();
    if (state.saved) applyFilters({ resetPage: false });
  });
}

async function init() {
  initHeader();
  populateThemeOptions();
  readStateFromURL();
  bindEvents();

  try {
    allGames = await loadGames();
    document.querySelectorAll("[data-game-count]").forEach((element) => {
      element.textContent = String(allGames.length);
    });
    renderQuickChips();
    elements.featuredGrid.innerHTML = allGames
      .filter((game) => game.featured)
      .slice(0, 3)
      .map((game) => gameCardMarkup(game, { featured: true }))
      .join("");
    applyFilters({ resetPage: false });
  } catch (error) {
    elements.loading.innerHTML = `<div class="error-panel"><strong>We could not load the games.</strong><span>${error.message}</span><span>Try refreshing the page. If you are viewing the files locally, run a small web server rather than opening the HTML file directly.</span></div>`;
    elements.featuredGrid.innerHTML = "";
    elements.resultsCount.textContent = "Games could not be loaded";
  }
}

init();
