/**
 * Scout Tools hub — home page behaviour.
 *
 * Renders the tool cards from /tools.json and wires up the mobile menu.
 * To add a new tool: create its folder, then add an entry to tools.json.
 */

const TOOLS_URL = new URL("../../tools.json", import.meta.url);
const TOOL_COLORS = ["purple", "teal", "blue", "green", "orange", "pink", "navy", "yellow", "red", "mint"];
const STATUS_LABELS = { ready: "Ready", beta: "Beta", planned: "Planned" };

function escapeHTML(value) {
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

function safeColor(color) {
  return TOOL_COLORS.includes(color) ? color : "purple";
}

function iconMarkup(name, className = "icon") {
  const safeName = String(name || "cube").replace(/[^a-z0-9-]/g, "");
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#${safeName}"></use></svg>`;
}

function toolCardMarkup(tool) {
  const status = STATUS_LABELS[tool.status] ? tool.status : "ready";
  const tags = Array.isArray(tool.tags) ? tool.tags : [];
  const cover = `
    <div class="tool-card__cover cover-tile--${safeColor(tool.color)}" aria-hidden="true">
      <span class="tool-card__badge tool-card__badge--${status}">${escapeHTML(STATUS_LABELS[status])}</span>
      <svg class="tool-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#${String(tool.icon || "cube").replace(/[^a-z0-9-]/g, "")}"></use></svg>
      ${tool.kicker ? `<span class="tool-card__kicker">${escapeHTML(tool.kicker)}</span>` : ""}
    </div>
  `;

  const body = `
    <div class="tool-card__body">
      <h3 class="tool-card__title">${escapeHTML(tool.title)}</h3>
      ${tool.tagline ? `<p class="tool-card__tagline">${escapeHTML(tool.tagline)}</p>` : ""}
      ${tool.description ? `<p class="tool-card__desc">${escapeHTML(tool.description)}</p>` : ""}
      ${
        tags.length
          ? `<ul class="tool-card__tags">${tags.map((tag) => `<li>${escapeHTML(tag)}</li>`).join("")}</ul>`
          : ""
      }
    </div>
  `;

  if (status === "planned" || !tool.href) {
    return `
      <div class="tool-card tool-card--planned">
        ${cover}
        ${body}
        <div class="tool-card__footer">
          <span class="tool-card__cta">${iconMarkup("clock", "icon")} Coming soon</span>
        </div>
      </div>
    `;
  }

  return `
    <a class="tool-card" href="${escapeHTML(tool.href)}">
      ${cover}
      ${body}
      <div class="tool-card__footer">
        <span class="tool-card__cta">Open tool ${iconMarkup("arrow-right", "icon")}</span>
      </div>
    </a>
  `;
}

function plannedCardMarkup() {
  return `
    <div class="tool-card tool-card--planned">
      <div class="tool-card__cover" aria-hidden="true">
        <span class="tool-card__badge tool-card__badge--planned">Planned</span>
        <svg class="tool-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#sparkles"></use></svg>
      </div>
      <div class="tool-card__body">
        <h3 class="tool-card__title">More tools are on the way</h3>
        <p class="tool-card__desc">The toolbox is built to grow — badge helpers, meeting planners and more can all live here alongside the games finder.</p>
      </div>
      <div class="tool-card__footer">
        <span class="tool-card__cta">Suggest a tool ${iconMarkup("external-link", "icon")}</span>
      </div>
    </div>
  `;
}

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

async function renderTools() {
  const grid = document.querySelector("#tool-grid");
  if (!grid) return;

  try {
    const response = await fetch(TOOLS_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`The tools list could not be loaded (${response.status}).`);
    }
    const data = await response.json();
    const tools = Array.isArray(data.tools) ? data.tools : [];
    const ready = tools.filter((tool) => tool.status !== "planned" && tool.href).length;

    document.querySelectorAll("[data-tool-count]").forEach((element) => {
      element.textContent = String(ready);
    });

    grid.innerHTML = tools.map(toolCardMarkup).join("") + plannedCardMarkup();
  } catch (error) {
    grid.innerHTML = `
      <div class="hub-error">
        <strong>We could not load the tools list.</strong>
        <span>${escapeHTML(error.message)}</span>
        <span>If you are viewing the files locally, run a small web server (for example <code>npm run serve</code>) rather than opening the HTML file directly.</span>
      </div>
    `;
  }
}

initMenu();
renderTools();
