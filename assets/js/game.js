import {
  THEMES,
  escapeHTML,
  formatDate,
  gameCardMarkup,
  gameFamily,
  getGame,
  iconMarkup,
  initAccordions,
  initHeader,
  isSaved,
  loadGames,
  relatedGames,
  sectionLabels,
  settingLabel,
  sharePage,
  themeIcon,
  themeLabel,
  toggleSaved,
} from "./core.js";

const COLOR_VALUES = ["purple", "teal", "blue", "green", "orange", "pink", "navy", "yellow", "red", "mint"];
const ENERGY_LABELS = { low: "Low energy", medium: "Medium energy", high: "High energy" };
const NOISE_LABELS = { quiet: "Quiet", medium: "Medium noise", loud: "Loud" };
const MESS_LABELS = { none: "No mess", low: "A little mess", medium: "Messy" };
const ENERGY_ICONS = { low: "moon", medium: "zap", high: "zap" };
const NOISE_ICONS = { quiet: "speaker-off", medium: "volume", loud: "megaphone" };
const MESS_ICONS = { none: "check", low: "bucket", medium: "splat" };
const ADAPT_ICONS = ["lightbulb", "zap", "accessibility"];

const elements = {
  hero: document.querySelector("#game-hero"),
  eyebrow: document.querySelector("#game-eyebrow"),
  title: document.querySelector("#game-title"),
  summary: document.querySelector("#game-summary"),
  actions: document.querySelector("#game-actions"),
  emblem: document.querySelector("#game-emblem"),
  emblemIcon: document.querySelector("#game-emblem-icon use"),
  breadcrumb: document.querySelector("#breadcrumb-title"),
  shareTop: document.querySelector("#share-game-top"),
  save: document.querySelector("#save-game"),
  saveLabel: document.querySelector("#save-game-label"),
  share: document.querySelector("#share-game"),
  print: document.querySelector("#print-game"),
  loading: document.querySelector("#game-loading"),
  content: document.querySelector("#game-content"),
  main: document.querySelector("#game-main"),
  sidebar: document.querySelector("#game-sidebar"),
  twistsSection: document.querySelector("#twists-section"),
  twistGrid: document.querySelector("#twist-grid"),
  variantsSection: document.querySelector("#variants-section"),
  variantsTitle: document.querySelector("#variants-title"),
  variantFamily: document.querySelector("#variant-family"),
  variantsGrid: document.querySelector("#variants-grid"),
  relatedSection: document.querySelector("#related-section"),
  relatedGrid: document.querySelector("#related-grid"),
  notFound: document.querySelector("#game-not-found"),
};

let currentGame = null;

function safeColor(color) {
  return COLOR_VALUES.includes(color) ? color : "purple";
}

function label(value, lookup, fallback = "Not set") {
  return lookup[value] || fallback;
}

function metaPill(icon, text, modifier = "") {
  return `<span class="pill${modifier}">${iconMarkup(icon, "icon")}${escapeHTML(text)}</span>`;
}

function renderMetaPills(game) {
  const pills = [
    metaPill("users", sectionLabels(game.sections)),
    metaPill("clock", game.duration || "Flexible"),
    metaPill("map-pin", settingLabel(game.setting)),
    metaPill("gamepad", game.gameType || "Game"),
  ];
  if (game.players) pills.push(metaPill("users", game.players));
  if (game.energy) pills.push(metaPill(ENERGY_ICONS[game.energy] || "zap", label(game.energy, ENERGY_LABELS)));
  if (game.noise) pills.push(metaPill(NOISE_ICONS[game.noise] || "volume", label(game.noise, NOISE_LABELS)));
  if (game.mess) pills.push(metaPill(MESS_ICONS[game.mess] || "bucket", label(game.mess, MESS_LABELS)));
  (game.themes || []).forEach((theme) => {
    pills.push(metaPill(themeIcon(theme), themeLabel(theme), " pill--theme"));
  });
  if (game.variantOf) {
    pills.push(metaPill("layers", "Rules variant", " pill--variant"));
  }
  return `<div class="meta-row">${pills.join("")}</div>`;
}

function renderEquipment(game) {
  const equipment = game.equipment || [];
  const items = equipment.length
    ? equipment.map((item) => `<li>${iconMarkup("check", "icon")}${escapeHTML(item)}</li>`).join("")
    : `<li>${iconMarkup("check", "icon")}No special equipment needed</li>`;
  return `
    <section class="content-block" aria-labelledby="equipment-title">
      <h2 id="equipment-title">What you need</h2>
      <ul class="equipment-list">${items}</ul>
    </section>
  `;
}

function renderSteps(title, steps, id, compact = false) {
  if (!Array.isArray(steps) || steps.length === 0) return "";
  return `
    <section class="content-block" aria-labelledby="${id}">
      <h2 id="${id}">${escapeHTML(title)}</h2>
      <ol class="steps${compact ? " steps--compact" : ""}">
        ${steps.map((step) => `<li><span>${escapeHTML(step)}</span></li>`).join("")}
      </ol>
    </section>
  `;
}

function renderWinning(game) {
  if (!game.winning) return "";
  return `
    <section class="content-block" aria-labelledby="winning-title">
      <h2 id="winning-title">How to win</h2>
      <div class="winning-box">
        ${iconMarkup("trophy", "icon")}
        <p>${escapeHTML(game.winning)}</p>
      </div>
    </section>
  `;
}

function renderSafety(game) {
  if (!game.safety) return "";
  return `
    <section class="content-block" aria-labelledby="safety-title">
      <h2 id="safety-title">Safety</h2>
      <div class="safety-box">
        ${iconMarkup("alert-triangle", "icon")}
        <div>
          <h2>Before you play</h2>
          <p>${escapeHTML(game.safety)}</p>
        </div>
      </div>
    </section>
  `;
}

function renderAdaptations(game) {
  const adaptations = game.adaptations || [];
  if (adaptations.length === 0) return "";
  return `
    <section class="content-block" aria-labelledby="adapt-title">
      <h2 id="adapt-title">Adapt it for your section</h2>
      <div class="adapt-grid">
        ${adaptations
          .map(
            (item, index) => `
          <article class="adapt-card">
            <div class="adapt-card__icon">${iconMarkup(ADAPT_ICONS[index % ADAPT_ICONS.length], "icon")}</div>
            <h3>${escapeHTML(item.title || "Adaptation")}</h3>
            <p>${escapeHTML(item.text || "")}</p>
          </article>`,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMain(game) {
  return [
    `<p class="game-lede">${escapeHTML(game.summary)}</p>`,
    renderMetaPills(game),
    renderEquipment(game),
    renderSteps("Set up", game.setup, "setup-title", true),
    renderSteps("How to play", game.steps, "steps-title"),
    renderWinning(game),
    renderSafety(game),
    renderAdaptations(game),
  ].join("");
}

function glanceRow(icon, term, value) {
  return `
    <div class="glance__row">
      ${iconMarkup(icon, "icon")}
      <div>
        <dt>${escapeHTML(term)}</dt>
        <dd>${escapeHTML(value)}</dd>
      </div>
    </div>
  `;
}

function renderGlance(game) {
  const themes = (game.themes || []).map(themeLabel).join(", ") || "No theme tags";
  const extras = [label(game.energy, ENERGY_LABELS, ""), label(game.noise, NOISE_LABELS, ""), label(game.mess, MESS_LABELS, "")]
    .filter(Boolean)
    .join(" · ");
  const rows = [
    glanceRow("users", "Sections", sectionLabels(game.sections)),
    glanceRow("clock", "Time", game.duration || "Flexible"),
    glanceRow("map-pin", "Setting", settingLabel(game.setting)),
    glanceRow("gamepad", "Game type", game.gameType || "Game"),
    glanceRow("users", "Players", game.players || "Flexible"),
    extras ? glanceRow("zap", "Energy, noise and mess", extras) : "",
    glanceRow("sparkles", "Themes", themes),
    game.added ? glanceRow("calendar", "Added", formatDate(game.added)) : "",
    game.author ? glanceRow("heart", "Contributed by", game.author) : "",
  ].filter(Boolean);

  return `
    <div class="glance">
      <h2>At a glance</h2>
      <dl>${rows.join("")}</dl>
    </div>
  `;
}

function renderTips(game) {
  const tips = game.tips || [];
  const content = tips.length
    ? `<div class="accordion">
        ${tips
          .map(
            (tip, index) => `
          <div class="accordion__item">
            <button class="accordion__button" type="button" aria-expanded="false" aria-controls="tip-panel-${index}">
              ${escapeHTML(tip.title || `Tip ${index + 1}`)}
              ${iconMarkup("chevron-down", "icon")}
            </button>
            <div class="accordion__panel" id="tip-panel-${index}">
              <p>${escapeHTML(tip.text || "")}</p>
            </div>
          </div>`,
          )
          .join("")}
      </div>`
    : `<p class="field__hint">No leader tips yet. If you have one, add it through the game form.</p>`;

  return `
    <div class="tip-panel">
      <h2>Leader tips</h2>
      ${content}
    </div>
  `;
}

function renderSidebar(game) {
  return `
    ${renderGlance(game)}
    ${renderTips(game)}
    <div class="sidebar-cta">
      <h2>Make it yours</h2>
      <p>Change the rules? Add a variant. Keeping the rules and changing the story? Add a themed twist instead.</p>
      <a class="btn btn--light" href="add.html?variantOf=${encodeURIComponent(game.id)}">Add a variant</a>
      <a class="btn btn--ghost-light mt-2" href="add.html">Suggest an edit</a>
    </div>
  `;
}

function renderTwists(game) {
  const twists = game.themedTwists || [];
  if (twists.length === 0) {
    elements.twistsSection.hidden = true;
    return;
  }
  elements.twistGrid.innerHTML = twists
    .map(
      (twist) => `
      <article class="twist-card">
        <span class="twist-card__theme">
          ${iconMarkup(themeIcon(twist.theme), "icon")}
          ${escapeHTML(themeLabel(twist.theme))}
        </span>
        <h3>${escapeHTML(twist.title || "Themed twist")}</h3>
        <p>${escapeHTML(twist.text || "")}</p>
        <span class="twist-card__same">${iconMarkup("check", "icon")}Same rules as ${escapeHTML(game.title)}</span>
      </article>`,
    )
    .join("");
  elements.twistsSection.hidden = false;
}

function renderVariants(game, games) {
  const family = gameFamily(game, games);
  const cards = [];

  if (family.isVariant && family.base) {
    cards.push(family.base);
    family.variants.forEach((variant) => cards.push(variant));
  } else {
    family.variants.forEach((variant) => cards.push(variant));
  }

  const unique = cards.filter((item, index, list) => item && item.id !== game.id && list.findIndex((entry) => entry.id === item.id) === index);

  if (unique.length === 0) {
    elements.variantsSection.hidden = true;
    return;
  }

  if (family.isVariant && family.base) {
    elements.variantsTitle.textContent = `Variants of ${family.base.title}`;
    elements.variantFamily.innerHTML = `
      ${iconMarkup("layers", "icon")}
      <span class="variant-family__label">Part of the ${escapeHTML(family.base.title)} family.</span>
      <span>This version changes the rules. <a href="game.html?id=${encodeURIComponent(family.base.id)}">View the original game</a>.</span>
    `;
  } else {
    elements.variantsTitle.textContent = "Variants of this game";
    elements.variantFamily.innerHTML = `
      ${iconMarkup("layers", "icon")}
      <span class="variant-family__label">${unique.length} ${unique.length === 1 ? "variant" : "variants"} with different rules.</span>
      <span>Each one is a separate game with its own equipment and safety notes.</span>
    `;
  }

  elements.variantsGrid.innerHTML = unique.map((variant) => gameCardMarkup(variant)).join("");
  elements.variantsSection.hidden = false;
}

function renderRelated(game, games) {
  const related = relatedGames(game, games, 3);
  if (related.length === 0) {
    elements.relatedSection.hidden = true;
    return;
  }
  elements.relatedGrid.innerHTML = related.map((item) => gameCardMarkup(item)).join("");
  elements.relatedSection.hidden = false;
}

function updateSaveState() {
  if (!currentGame) return;
  const saved = isSaved(currentGame.id);
  elements.save.classList.toggle("is-saved", saved);
  elements.save.setAttribute("aria-pressed", String(saved));
  elements.saveLabel.textContent = saved ? "Saved" : "Save game";
  elements.save.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${currentGame.title}`);
}

function bindActions() {
  elements.save.addEventListener("click", () => {
    if (!currentGame) return;
    toggleSaved(currentGame.id);
  });

  document.addEventListener("savedchange", () => {
    updateSaveState();
    document.querySelectorAll("[data-save-id]").forEach((button) => {
      const saved = isSaved(button.dataset.saveId);
      button.classList.toggle("is-saved", saved);
      button.setAttribute("aria-pressed", String(saved));
      if (button.dataset.gameTitle) {
        button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${button.dataset.gameTitle}`);
      }
    });
  });

  const share = () => {
    if (!currentGame) return;
    sharePage({
      title: `${currentGame.title} — Scouts Games Library`,
      text: currentGame.summary,
      url: window.location.href,
    });
  };
  elements.share.addEventListener("click", share);
  elements.shareTop.addEventListener("click", share);
  elements.print.addEventListener("click", () => window.print());
}

function renderGame(game, games) {
  currentGame = game;
  const color = safeColor(game.art?.color);
  const icon = String(game.art?.icon || "gamepad").replace(/[^a-z0-9-]/g, "");

  document.title = `${game.title} — Scouts Games Library`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", game.summary || "");

  elements.eyebrow.textContent = `${game.gameType || "Game"} · ${sectionLabels(game.sections)}`;
  elements.title.textContent = game.title;
  elements.summary.textContent = game.summary || "";
  elements.breadcrumb.textContent = game.title;
  elements.emblem.className = `game-emblem cover--${color}`;
  elements.emblemIcon.setAttribute("href", `assets/img/icons.svg#${icon}`);

  elements.main.innerHTML = renderMain(game);
  elements.sidebar.innerHTML = renderSidebar(game);
  initAccordions(elements.sidebar);
  renderTwists(game);
  renderVariants(game, games);
  renderRelated(game, games);

  elements.loading.hidden = true;
  elements.content.hidden = false;
  elements.actions.hidden = false;
  elements.shareTop.hidden = false;
  updateSaveState();
}

function renderNotFound() {
  document.title = "Game not found — Scouts Games Library";
  elements.eyebrow.textContent = "Oops";
  elements.title.textContent = "Game not found";
  elements.summary.textContent = "That game is not in the library. It may have been renamed, or the link may be out of date.";
  elements.breadcrumb.textContent = "Not found";
  elements.emblem.hidden = true;
  elements.loading.hidden = true;
  elements.notFound.hidden = false;
}

async function init() {
  initHeader();
  bindActions();

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    renderNotFound();
    return;
  }

  try {
    const games = await loadGames();
    const game = getGame(games, id);
    if (!game) {
      renderNotFound();
      return;
    }
    renderGame(game, games);
  } catch (error) {
    elements.loading.innerHTML = `<div class="error-panel"><strong>We could not load this game.</strong><span>${escapeHTML(error.message)}</span><span>Try refreshing the page. If you are viewing the files locally, run a small web server rather than opening the HTML file directly.</span></div>`;
  }
}

init();
