// Renders tool cards from tools.json and boots the shared site chrome.

import {
  BRAND_COLORS,
  SUGGEST_TOOL_URL,
  escapeHTML,
  initSite,
  loadTools,
  spriteIcon,
} from "./site.js";

const STATUS_LABELS = { ready: "Ready", beta: "Beta", planned: "Planned" };

function safeColor(color) {
  return BRAND_COLORS.includes(color) ? color : "purple";
}

function toolCardMarkup(tool) {
  const status = STATUS_LABELS[tool.status] ? tool.status : "ready";
  const tags = Array.isArray(tool.tags) ? tool.tags : [];
  const badgeMarkup = status === "beta" ? `<span class="tool-card__badge tool-card__badge--beta">${escapeHTML(STATUS_LABELS[status])}</span>` : "";
  const cover = `
    <div class="tool-card__cover cover--${safeColor(tool.color)}" aria-hidden="true">
      ${badgeMarkup}
      ${spriteIcon(tool.icon || "cube", { root: "./", className: "tool-card__icon" })}
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
          <span class="tool-card__cta">${spriteIcon("clock", { root: "./" })} Coming soon</span>
        </div>
      </div>
    `;
  }

  return `
    <a class="tool-card" href="${escapeHTML(tool.href)}">
      ${cover}
      ${body}
      <div class="tool-card__footer">
        <span class="tool-card__cta">Open tool ${spriteIcon("arrow-right", { root: "./" })}</span>
      </div>
    </a>
  `;
}

function suggestCardMarkup() {
  return `
    <a class="tool-card tool-card--planned" href="${SUGGEST_TOOL_URL}" target="_blank" rel="noopener">
      <div class="tool-card__cover" aria-hidden="true">
        ${spriteIcon("plus", { root: "./", className: "tool-card__icon" })}
      </div>
      <div class="tool-card__body">
        <h3 class="tool-card__title">Got an idea for a tool?</h3>
        <p class="tool-card__desc">If something would save you time on a meeting night or before camp, suggest it on GitHub.</p>
      </div>
      <div class="tool-card__footer">
        <span class="tool-card__cta">Suggest a tool ${spriteIcon("external-link", { root: "./" })}</span>
      </div>
    </a>
  `;
}

async function renderTools() {
  const grid = document.querySelector("#tool-grid");
  if (!grid) return;

  try {
    const tools = await loadTools();
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

initSite();
renderTools();
