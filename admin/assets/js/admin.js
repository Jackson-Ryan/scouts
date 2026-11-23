/**
 * Scout Tools Admin Console — shell, GitHub SSO gate and tool registry.
 *
 * Designed so any future editable tool can plug in cleanly by adding one
 * module to ADMIN_TOOLS below.
 */

import {
  completeGitHubLoginIfPresent,
  getAdminSession,
  isGitHubSsoConfigured,
  signOut,
  startGitHubLogin,
  verifySession,
} from "../../../assets/js/auth.js";
import { SITE_SETTINGS } from "../../../assets/js/site-config.js";
import { confirmDialog, escapeHTML, initSite, spriteIcon } from "../../../assets/js/site.js";
import { createGamesAdminTool } from "./tools/games-admin.js";

/**
 * Registry of admin-editable tools.
 * To add admin support for another tool later, create admin/assets/js/tools/<tool>-admin.js
 * and append its factory here.
 */
const ADMIN_TOOLS = [createGamesAdminTool()];

const el = {
  authSection: document.querySelector("#admin-auth"),
  workspace: document.querySelector("#admin-workspace"),
  githubLoginBtn: document.querySelector("#btn-github-login"),
  setupNote: document.querySelector("#auth-setup-note"),
  authStatus: document.querySelector("#auth-status"),
  avatar: document.querySelector("#admin-avatar"),
  userName: document.querySelector("#admin-user-name"),
  userDetail: document.querySelector("#admin-user-detail"),
  modePill: document.querySelector("#admin-mode-pill"),
  signOutBtn: document.querySelector("#btn-sign-out"),
  toolTabs: document.querySelector("#admin-tool-tabs"),
  toolRoot: document.querySelector("#admin-tool-root"),
};

let activeSession = null;
let activeTool = null;

function setAuthStatus(message, { isError = true } = {}) {
  if (!message) {
    el.authStatus.hidden = true;
    el.authStatus.textContent = "";
    return;
  }
  el.authStatus.textContent = message;
  el.authStatus.classList.toggle("is-success", !isError);
  el.authStatus.hidden = false;
}

function showSignInGate(message = "") {
  activeSession = null;
  if (activeTool?.unmount) activeTool.unmount();
  activeTool = null;
  el.toolRoot.innerHTML = "";

  el.workspace.hidden = true;
  el.authSection.hidden = false;

  const ssoReady = isGitHubSsoConfigured();
  el.setupNote.hidden = ssoReady;
  el.githubLoginBtn.disabled = !ssoReady;

  if (message) setAuthStatus(message, { isError: true });
}

function renderToolTabs(activeId) {
  el.toolTabs.innerHTML = `
    ${ADMIN_TOOLS.map(
      (tool) => `
        <button class="admin-tool-tab${tool.id === activeId ? " is-active" : ""}" type="button" data-admin-tool="${escapeHTML(tool.id)}">
          ${spriteIcon(tool.icon || "gamepad", { root: "../", className: "icon icon--sm" })}
          ${escapeHTML(tool.title)}
          <span class="admin-tool-tab__badge" data-tool-badge="${escapeHTML(tool.id)}">—</span>
        </button>
      `,
    ).join("")}
    <span class="admin-tool-tabs__hint">Only tools with editable data appear here.</span>
  `;
}

async function selectTool(toolId) {
  const next = ADMIN_TOOLS.find((tool) => tool.id === toolId) || ADMIN_TOOLS[0];
  if (!next || next === activeTool) return;

  if (activeTool?.hasUnsavedChanges?.()) {
    const leave = await confirmDialog({
      title: "Discard unsaved changes?",
      message: `You have unpublished edits in ${activeTool.title}. Switching tools will discard them.`,
      confirmLabel: "Discard & switch",
      cancelLabel: "Stay here",
      tone: "danger",
    });
    if (!leave) return;
  }

  if (activeTool?.unmount) activeTool.unmount();
  activeTool = next;
  renderToolTabs(activeTool.id);

  await activeTool.mount(el.toolRoot, {
    session: activeSession,
    setBadge(countText) {
      const badge = el.toolTabs.querySelector(`[data-tool-badge="${activeTool.id}"]`);
      if (badge) badge.textContent = String(countText);
    },
  });
}

async function enterWorkspace(session) {
  activeSession = session;
  setAuthStatus("");
  el.authSection.hidden = true;
  el.workspace.hidden = false;

  if (session.user.avatar_url) {
    el.avatar.innerHTML = `<img src="${escapeHTML(session.user.avatar_url)}" alt="${escapeHTML(session.user.login)}">`;
  } else {
    el.avatar.innerHTML = spriteIcon("github", { root: "../" });
  }
  el.userName.textContent = session.user.name || session.user.login;
  el.userDetail.textContent = `@${session.user.login} · ${SITE_SETTINGS.githubRepo} (${SITE_SETTINGS.defaultBranch})`;
  el.modePill.textContent = "GitHub SSO";

  await selectTool(ADMIN_TOOLS[0].id);
}

function bindEvents() {
  el.githubLoginBtn.addEventListener("click", async () => {
    setAuthStatus("");
    try {
      await startGitHubLogin();
    } catch (error) {
      setAuthStatus(error.message || "Could not start GitHub sign-in.");
    }
  });

  el.signOutBtn.addEventListener("click", async () => {
    if (activeTool?.hasUnsavedChanges?.()) {
      const leave = await confirmDialog({
        title: "Sign out with unsaved changes?",
        message: "You have unpublished changes that have not been saved yet. Signing out will discard them.",
        confirmLabel: "Sign out anyway",
        cancelLabel: "Keep editing",
        tone: "danger",
      });
      if (!leave) return;
    }
    signOut();
    showSignInGate("");
  });

  el.toolTabs.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-admin-tool]");
    if (!btn) return;
    selectTool(btn.dataset.adminTool);
  });

  window.addEventListener("beforeunload", (event) => {
    if (activeTool?.hasUnsavedChanges?.()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}

async function boot() {
  initSite();
  bindEvents();

  // 1. Handle GitHub OAuth redirect callback (?code=...&state=...)
  const params = new URLSearchParams(window.location.search);
  if (params.has("code") || params.has("error")) {
    el.githubLoginBtn.disabled = true;
    setAuthStatus("Verifying your GitHub account…", { isError: false });
    try {
      const session = await completeGitHubLoginIfPresent();
      if (session) {
        await enterWorkspace(session);
        return;
      }
    } catch (error) {
      showSignInGate(error.message || "GitHub sign-in failed.");
      return;
    }
  }

  // 2. Restore existing verified session if present
  const existing = getAdminSession();
  if (existing) {
    try {
      const verified = await verifySession(existing);
      if (verified) {
        await enterWorkspace(verified);
        return;
      }
    } catch (error) {
      showSignInGate(error.message || "Your session expired. Please sign in again.");
      return;
    }
  }

  showSignInGate("");
}

boot();
