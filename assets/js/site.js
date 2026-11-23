/**
 * Shared site chrome, navigation, tools manifest and control bootstrapping.
 *
 * Every page uses one shared header and footer template driven by tools.json,
 * plus automatic custom themed controls. Adding a new tool to tools.json
 * automatically wires it into the home page, navbar and footer.
 *
 * Kept free of top-level DOM side effects so Node scripts can import helpers.
 */

import { confirmDialog, enhanceControls, observeControls } from "./controls.js";

export { confirmDialog, enhanceControls };

export const SUGGEST_TOOL_URL = "https://github.com/Jackson-Ryan/scouts/issues/new?title=%5BTool%20idea%5D%20";
export const REPO_URL = "https://github.com/Jackson-Ryan/scouts";
export const BRAND_COLORS = ["purple", "teal", "blue", "green", "orange", "pink", "navy", "yellow", "red", "mint"];

const TOOLS_URL = new URL("../../tools.json", import.meta.url);

// Fallback list used for synchronous first paint before tools.json resolves.
const DEFAULT_TOOLS = [
  { id: "games", title: "Games finder", href: "games/", status: "ready" },
  { id: "kit-list", title: "Kit list generator", href: "kit-list/", status: "ready" },
];

let toolsPromise = null;

export function escapeHTML(value) {
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

function normaliseRoot(root) {
  if (!root || root === ".") return "./";
  return root.endsWith("/") ? root : `${root}/`;
}

function resolveHref(root, path) {
  const prefix = root === "./" ? "" : root;
  if (!path || path === "./") return root;
  return `${prefix}${path}`;
}

export function spriteIcon(name, { root = "./", className = "icon" } = {}) {
  const safeName = String(name || "cube").replace(/[^a-z0-9-]/g, "");
  const href = resolveHref(normaliseRoot(root), `assets/img/icons.svg#${safeName}`);
  return `<svg class="${escapeHTML(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${escapeHTML(href)}"></use></svg>`;
}

export async function loadTools() {
  if (!toolsPromise) {
    toolsPromise = fetch(TOOLS_URL, { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load the tools list (${response.status}).`);
        }
        return response.json();
      })
      .then((data) => (Array.isArray(data?.tools) ? data.tools : []))
      .catch((error) => {
        toolsPromise = null;
        throw error;
      });
  }
  return toolsPromise;
}

function navLabel(title) {
  const text = String(title || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function activeTools(tools) {
  return (Array.isArray(tools) ? tools : DEFAULT_TOOLS).filter((tool) => tool.status !== "planned" && tool.href);
}

function renderHeader(header, tools) {
  const root = normaliseRoot(header.dataset.root || "./");
  const active = header.dataset.active || "";
  const exact = header.dataset.exact !== "false";
  const list = activeTools(tools);

  const linkAttrs = (id) => {
    const isActive = active === id;
    const classes = `site-nav__link${isActive ? " is-active" : ""}`;
    const current = isActive && exact ? ' aria-current="page"' : "";
    return `class="${classes}"${current}`;
  };

  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="brand" href="${escapeHTML(root)}" aria-label="Scout Tools home">
        <picture>
          <source srcset="${escapeHTML(resolveHref(root, "assets/img/scouts-white.svg"))}" media="(prefers-color-scheme: dark)">
          <img src="${escapeHTML(resolveHref(root, "assets/img/scouts-black.svg"))}" alt="Scouts" width="176" height="50">
        </picture>
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Main navigation">
        <a ${linkAttrs("home")} href="${escapeHTML(root)}">All tools</a>
        ${list
          .map(
            (tool) =>
              `<a ${linkAttrs(tool.id)} href="${escapeHTML(resolveHref(root, tool.href))}">${escapeHTML(navLabel(tool.title))}</a>`,
          )
          .join("")}
        <a ${linkAttrs("about")} href="${escapeHTML(resolveHref(root, "about"))}">About</a>
        <a class="site-nav__link site-nav__link--mobile" href="${SUGGEST_TOOL_URL}" target="_blank" rel="noopener">Suggest a tool</a>
      </nav>
      <div class="header-actions">
        <a class="btn btn--primary btn--small header-cta" href="${SUGGEST_TOOL_URL}" target="_blank" rel="noopener">Suggest a tool</a>
      </div>
      <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
        ${spriteIcon("menu", { root, className: "icon icon--lg" })}
      </button>
    </div>
  `;
}

function renderFooter(footer, tools) {
  const root = normaliseRoot(footer.dataset.root || "./");
  const list = activeTools(tools);

  footer.innerHTML = `
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="${escapeHTML(resolveHref(root, "assets/img/scouts-stack-white.svg"))}" alt="Scouts" width="110" height="80">
          <p>Free, practical tools for Beaver, Cub and Scout leaders.</p>
        </div>
        <div>
          <h2>Toolbox</h2>
          <ul class="footer-links">
            <li><a href="${escapeHTML(root)}">All tools</a></li>
            ${list
              .map(
                (tool) =>
                  `<li><a href="${escapeHTML(resolveHref(root, tool.href))}">${escapeHTML(navLabel(tool.title))}</a></li>`,
              )
              .join("")}
            <li><a href="${SUGGEST_TOOL_URL}" target="_blank" rel="noopener">Suggest a tool</a></li>
          </ul>
        </div>
        <div>
          <h2>Games by section</h2>
          <ul class="footer-links">
            <li><a href="${escapeHTML(resolveHref(root, "games/?section=beavers"))}">Beavers</a></li>
            <li><a href="${escapeHTML(resolveHref(root, "games/?section=cubs"))}">Cubs</a></li>
            <li><a href="${escapeHTML(resolveHref(root, "games/?section=scouts"))}">Scouts</a></li>
            <li><a href="${escapeHTML(resolveHref(root, "games/"))}">All games</a></li>
          </ul>
        </div>
        <div>
          <h2>Help</h2>
          <ul class="footer-links">
            <li><a href="${escapeHTML(resolveHref(root, "about"))}">About Scout Tools</a></li>
            <li><a href="${escapeHTML(resolveHref(root, "about#how-it-works"))}">How it works</a></li>
            <li><a href="${escapeHTML(resolveHref(root, "about#safety"))}">Safety notes</a></li>
            <li><a href="${escapeHTML(resolveHref(root, "about#credits"))}">Credits</a></li>
          </ul>
        </div>
        <div>
          <h2>GitHub</h2>
          <ul class="footer-links">
            <li><a href="${REPO_URL}" target="_blank" rel="noopener">Repository</a></li>
            <li><a href="${REPO_URL}#readme" target="_blank" rel="noopener">README</a></li>
            <li><a href="${REPO_URL}/releases" target="_blank" rel="noopener">Releases</a></li>
            <li><a href="${REPO_URL}/issues/new" target="_blank" rel="noopener">Report an issue</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-legal">
        <p>An independent, volunteer-made toolbox for Scout leaders. Not an official Scouts publication, and not endorsed by The Scout Association. Always follow your own risk assessment and safeguarding procedures. Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.</p>
        <span class="footer-badge">Independent resource</span>
      </div>
    </div>
  `;
}

export function initMenu() {
  const toggle = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (!toggle || !nav || toggle.dataset.menuBound === "true") return;
  toggle.dataset.menuBound = "true";

  const close = ({ restoreFocus = false } = {}) => {
    if (!nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    if (restoreFocus) toggle.focus();
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
    if (event.key === "Escape") close({ restoreFocus: true });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) close();
  });
}

async function syncChromeFromManifest(header, footer) {
  if (typeof fetch !== "function") return;
  try {
    const tools = activeTools(await loadTools());
    const signature = (list) => list.map((t) => `${t.id}:${t.href}:${navLabel(t.title)}`).join("|");
    if (tools.length > 0 && signature(tools) !== signature(DEFAULT_TOOLS)) {
      if (header && header.isConnected) {
        renderHeader(header, tools);
        initMenu();
      }
      if (footer && footer.isConnected) renderFooter(footer, tools);
    }
  } catch {
    // Fallback tools already rendered synchronously.
  }
}

export function initSite() {
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");

  if (header) renderHeader(header, DEFAULT_TOOLS);
  if (footer) renderFooter(footer, DEFAULT_TOOLS);

  initMenu();
  enhanceControls(document);
  observeControls(document);

  if (header || footer) {
    syncChromeFromManifest(header, footer);
  }
}
