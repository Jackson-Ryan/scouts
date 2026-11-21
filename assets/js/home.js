/**
 * Scout Tools — home page behaviour.
 *
 * Renders the tool cards from /tools.json and wires up the mobile menu.
 * To add a new tool: create its folder, then add an entry to tools.json.
 */

import { escapeHTML, initMenu } from "./site.js";

const TOOLS_URL = new URL("../../tools.json", import.meta.url);
const SUGGEST_TOOL_URL = "https://github.com/Jackson-Ryan/scouts/issues/new?title=%5BTool%20idea%5D%20";
const TOOL_COLORS = ["purple", "teal", "blue", "green", "orange", "pink", "navy", "yellow", "red", "mint"];
const STATUS_LABELS = { ready: "Ready", beta: "Beta", planned: "Planned" };

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
  const badgeMarkup = status === "beta" ? `<span class="tool-card__badge tool-card__badge--beta">${escapeHTML(STATUS_LABELS[status])}</span>` : "";
  const cover = `
    <div class="tool-card__cover cover-tile--${safeColor(tool.color)}" aria-hidden="true">
      ${badgeMarkup}
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

function suggestCardMarkup() {
  return `
    <a class="tool-card tool-card--planned" href="${SUGGEST_TOOL_URL}" target="_blank" rel="noopener">
      <div class="tool-card__cover" aria-hidden="true">
        <svg class="tool-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#plus"></use></svg>
      </div>
      <div class="tool-card__body">
        <h3 class="tool-card__title">Got an idea for a tool?</h3>
        <p class="tool-card__desc">If something would save you time on a meeting night or before camp, suggest it on GitHub.</p>
      </div>
      <div class="tool-card__footer">
        <span class="tool-card__cta">Suggest a tool ${iconMarkup("external-link", "icon")}</span>
      </div>
    </a>
  `;
}

async function renderTools() {
  const grid = document.querySelector("#tool-grid");
  if (!grid) return;

  try {
    const response = await fetch(TOOLS_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Could not load the tools list (${response.status}).`);
    }
    const data = await response.json();
    const tools = Array.isArray(data.tools) ? data.tools : [];
    const ready = tools.filter((tool) => tool.status !== "planned" && tool.href).length;

    document.querySelectorAll("[data-tool-count]").forEach((element) => {
      element.textContent = String(ready);
    });

    grid.innerHTML = tools.map(toolCardMarkup).join("") + suggestCardMarkup();
  } catch (error) {
    grid.innerHTML = `
      <div class="error-panel">
        <strong>Could not load the tools list.</strong>
        <span>${escapeHTML(error.message)}</span>
        <span>If you are running this locally, start a web server (such as <code>npm run serve</code>) instead of opening the HTML file directly.</span>
      </div>
    `;
  }
}

initMenu();
renderTools();
