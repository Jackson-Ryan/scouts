/**
 * Games Finder Admin Tool Module.
 *
 * Provides full library management inside /admin/:
 *   - Browse, search & filter all games
 *   - Add a new game, edit any existing game, duplicate or delete
 *   - Bulk create games via a multi-row batch form OR JSON paste/upload
 *   - Bulk select & delete or toggle Featured
 *   - Review, edit, approve or decline community game submissions from /games/add
 *   - Stage all edits and publish in a single validated atomic commit
 */

import {
  closePendingSubmission,
  listPendingSubmissions,
  readRepoFile,
  writeRepoFile,
} from "../../../../assets/js/auth.js";
import { confirmDialog, enhanceControls, escapeHTML, spriteIcon } from "../../../../assets/js/site.js";
import {
  COLORS,
  GAME_TYPES,
  ICON_OPTIONS,
  SECTIONS,
  THEMES,
  parseLines,
  previewCardMarkup,
  sectionLabels,
  settingLabel,
  showToast,
  uniqueId,
} from "../../../../games/assets/js/core.js";
import {
  AUTO_DURATIONS,
  appendTwistRow,
  findAdaptation,
  formatTips,
  inferMinutes,
  parseTips,
  populateGameSelects,
  readTwistRows,
  renderColorSwatches,
  renderIconChoices,
  renderThemeCheckboxes,
  todayISO,
  validateGameFields,
} from "../../../../games/assets/js/game-editor.js";
import { validateGame, validateLibrary } from "../../../../games/scripts/game-schema.mjs";

const GAMES_FILE_PATH = "games/data/games.json";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableGameJson(game) {
  return JSON.stringify(game);
}

export function createGamesAdminTool() {
  let root = null;
  let session = null;
  let setBadge = () => {};

  let fileSha = "";
  let originalGames = [];
  let stagedGames = [];
  let pendingSubmissions = [];
  let approvedSubmissionIds = new Set();

  let subView = "library"; // "library" | "bulk" | "submissions"
  let bulkMode = "batch"; // "batch" | "json"
  let selectedIds = new Set();
  let filters = { query: "", section: "", theme: "", type: "" };
  let bulkDrafts = [];
  let importParsed = [];
  let importError = "";
  let publishing = false;
  let commitMessage = "";
  let activeModal = null;

  function computeDiff() {
    const origMap = new Map(originalGames.map((g) => [g.id, g]));
    const stagedMap = new Map(stagedGames.map((g) => [g.id, g]));

    let added = 0;
    let edited = 0;
    let deleted = 0;

    for (const game of stagedGames) {
      const prev = origMap.get(game.id);
      if (!prev) added += 1;
      else if (stableGameJson(prev) !== stableGameJson(game)) edited += 1;
    }
    for (const game of originalGames) {
      if (!stagedMap.has(game.id)) deleted += 1;
    }

    return {
      added,
      edited,
      deleted,
      approvals: approvedSubmissionIds.size,
      total: added + edited + deleted,
    };
  }

  function defaultCommitMessage(diff) {
    const parts = [];
    if (diff.added) parts.push(`add ${diff.added} game${diff.added === 1 ? "" : "s"}`);
    if (diff.edited) parts.push(`edit ${diff.edited}`);
    if (diff.deleted) parts.push(`remove ${diff.deleted}`);
    if (!parts.length) return "Update games library";
    const text = parts.join(", ");
    return `Games Finder: ${text.charAt(0).toUpperCase() + text.slice(1)}`;
  }

  function rowStatus(game) {
    const orig = originalGames.find((item) => item.id === game.id);
    if (!orig) return "new";
    if (stableGameJson(orig) !== stableGameJson(game)) return "edited";
    return "";
  }

  function filteredGames() {
    const q = filters.query.trim().toLowerCase();
    return stagedGames.filter((game) => {
      if (q) {
        const hay = `${game.title} ${game.summary} ${game.id} ${game.gameType} ${game.author || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.section && !(game.sections || []).includes(filters.section)) return false;
      if (filters.theme) {
        const inThemes = (game.themes || []).includes(filters.theme);
        const inTwists = (game.themedTwists || []).some((t) => t.theme === filters.theme);
        if (!inThemes && !inTwists) return false;
      }
      if (filters.type && game.gameType !== filters.type) return false;
      return true;
    });
  }

  function createEmptyBulkDraft(index = 0) {
    const color = COLORS[index % COLORS.length].value;
    return {
      _key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: "",
      summary: "",
      sections: ["cubs"],
      timeBand: "normal",
      duration: "10–20 mins",
      setting: "indoors",
      players: "Whole section",
      gameType: "Active",
      energy: "medium",
      noise: "medium",
      mess: "none",
      equipment: "",
      setup: "",
      steps: "",
      winning: "",
      safety: "",
      color,
      icon: "gamepad",
      author: session?.user?.login || "Scout Tools",
      featured: false,
      errors: [],
    };
  }

  function renderPublishBar() {
    const diff = computeDiff();
    if (diff.total === 0) return "";
    const parts = [];
    if (diff.added) parts.push(`${diff.added} added`);
    if (diff.edited) parts.push(`${diff.edited} edited`);
    if (diff.deleted) parts.push(`${diff.deleted} deleted`);
    if (diff.approvals) parts.push(`${diff.approvals} submission${diff.approvals === 1 ? "" : "s"} approved`);
    const placeholder = defaultCommitMessage(diff);

    return `
      <div class="admin-publish-bar" id="admin-publish-bar" role="region" aria-label="Unpublished changes">
        <div class="admin-publish-bar__info">
          <strong>${diff.total} unpublished change${diff.total === 1 ? "" : "s"}</strong>
          <span>${escapeHTML(parts.join(" · "))}</span>
        </div>
        <div class="admin-publish-bar__controls">
          <input class="input" id="admin-commit-message" type="text" value="${escapeHTML(commitMessage)}" placeholder="${escapeHTML(placeholder)}" aria-label="Commit message">
          <button class="btn btn--ghost btn--small" id="btn-discard-changes" type="button"${publishing ? " disabled" : ""}>Discard</button>
          <button class="btn btn--primary btn--small" id="btn-publish-changes" type="button"${publishing ? " disabled" : ""}>
            ${spriteIcon("check", { root: "../", className: "icon icon--sm" })}
            ${publishing ? "Publishing…" : "Publish to GitHub"}
          </button>
        </div>
      </div>
    `;
  }

  function renderStats() {
    const featuredCount = stagedGames.filter((g) => g.featured).length;
    const variantCount = stagedGames.filter((g) => g.variantOf).length;
    const openSubmissions = pendingSubmissions.filter((s) => !approvedSubmissionIds.has(s.submissionId)).length;

    return `
      <div class="admin-stats">
        <div class="admin-stat">
          <span class="admin-stat__label">Total games</span>
          <span class="admin-stat__value">${stagedGames.length}</span>
        </div>
        <div class="admin-stat">
          <span class="admin-stat__label">Featured</span>
          <span class="admin-stat__value">${featuredCount}</span>
        </div>
        <div class="admin-stat">
          <span class="admin-stat__label">Variants</span>
          <span class="admin-stat__value">${variantCount}</span>
        </div>
        <div class="admin-stat${openSubmissions > 0 ? " admin-stat--highlight" : ""}">
          <span class="admin-stat__label">Pending submissions</span>
          <span class="admin-stat__value">${openSubmissions}</span>
        </div>
      </div>
    `;
  }

  function renderSubTabs() {
    const openSubmissions = pendingSubmissions.filter((s) => !approvedSubmissionIds.has(s.submissionId)).length;
    return `
      <div class="admin-subtabs">
        <div class="admin-subtabs__group" role="tablist" aria-label="Games Finder admin sections">
          <button class="admin-subtab${subView === "library" ? " is-active" : ""}" type="button" data-subview="library" role="tab" aria-selected="${subView === "library"}">
            Library <span class="admin-subtab__count">${stagedGames.length}</span>
          </button>
          <button class="admin-subtab${subView === "bulk" ? " is-active" : ""}" type="button" data-subview="bulk" role="tab" aria-selected="${subView === "bulk"}">
            Bulk create
          </button>
          <button class="admin-subtab${subView === "submissions" ? " is-active" : ""}" type="button" data-subview="submissions" role="tab" aria-selected="${subView === "submissions"}">
            Submissions <span class="admin-subtab__count">${openSubmissions}</span>
          </button>
        </div>
        <div class="admin-subtabs__actions">
          <button class="btn btn--ghost btn--small" id="btn-reload-games" type="button">Refresh</button>
          <button class="btn btn--ghost btn--small" id="btn-open-bulk" type="button">
            ${spriteIcon("layers", { root: "../", className: "icon icon--sm" })}
            Bulk create
          </button>
          <button class="btn btn--primary btn--small" id="btn-new-game" type="button">
            ${spriteIcon("plus", { root: "../", className: "icon icon--sm" })}
            New game
          </button>
        </div>
      </div>
    `;
  }

  function renderLibraryView() {
    const visible = filteredGames();
    const allVisibleSelected = visible.length > 0 && visible.every((g) => selectedIds.has(g.id));

    return `
      <div class="admin-toolbar">
        <div class="field field--search">
          <label for="admin-game-search">Search games</label>
          ${spriteIcon("search", { root: "../" })}
          <input class="input" id="admin-game-search" type="search" value="${escapeHTML(filters.query)}" placeholder="Search title, summary or id…" autocomplete="off">
        </div>
        <div class="field">
          <label for="admin-filter-section">Section</label>
          <select class="select" id="admin-filter-section">
            <option value="">All sections</option>
            ${SECTIONS.map((s) => `<option value="${s.value}"${filters.section === s.value ? " selected" : ""}>${escapeHTML(s.label)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="admin-filter-theme">Theme</label>
          <select class="select" id="admin-filter-theme">
            <option value="">All themes</option>
            ${THEMES.map((t) => `<option value="${t.value}"${filters.theme === t.value ? " selected" : ""}>${escapeHTML(t.label)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="admin-filter-type">Type</label>
          <select class="select" id="admin-filter-type">
            <option value="">All types</option>
            ${GAME_TYPES.map((t) => `<option value="${escapeHTML(t)}"${filters.type === t ? " selected" : ""}>${escapeHTML(t)}</option>`).join("")}
          </select>
        </div>
      </div>

      ${
        selectedIds.size > 0
          ? `
        <div class="admin-selection-bar">
          <span class="admin-selection-bar__count">${selectedIds.size} game${selectedIds.size === 1 ? "" : "s"} selected</span>
          <div class="admin-selection-bar__actions">
            <button class="btn btn--ghost btn--small" id="btn-bulk-feature" type="button">Toggle featured</button>
            <button class="btn btn--danger btn--small" id="btn-bulk-delete" type="button">Delete selected</button>
            <button class="btn btn--ghost btn--small" id="btn-clear-selection" type="button">Clear</button>
          </div>
        </div>`
          : ""
      }

      <div class="admin-list-wrap">
        <div class="admin-list-head">
          <label class="admin-check-label">
            <input class="admin-checkbox" type="checkbox" id="admin-select-all"${allVisibleSelected ? " checked" : ""}>
            <span>Select all shown (${visible.length} of ${stagedGames.length})</span>
          </label>
          <span>Cover colours &amp; icons match live cards</span>
        </div>

        ${
          visible.length === 0
            ? `<div class="empty" style="border:0;border-radius:0;">
                <h2>No games match your filter</h2>
                <p>Clear the search box or add a new game to get started.</p>
              </div>`
            : `<ul class="admin-game-list">
                ${visible
                  .map((game) => {
                    const color = String(game.art?.color || "purple").replace(/[^a-z]/g, "");
                    const iconName = String(game.art?.icon || "gamepad").replace(/[^a-z0-9-]/g, "");
                    const status = rowStatus(game);
                    const checked = selectedIds.has(game.id);
                    return `
                      <li class="admin-game-row${checked ? " is-selected" : ""}" data-game-row="${escapeHTML(game.id)}">
                        <input class="admin-checkbox" type="checkbox" data-select-game="${escapeHTML(game.id)}" aria-label="Select ${escapeHTML(game.title)}"${checked ? " checked" : ""}>
                        <span class="admin-game-row__swatch cover--${color}" aria-hidden="true">
                          ${spriteIcon(iconName, { root: "../" })}
                        </span>
                        <div class="admin-game-row__main">
                          <div class="admin-game-row__titleline">
                            <h3 class="admin-game-row__title">${escapeHTML(game.title)}</h3>
                            ${game.featured ? `<span class="admin-pill admin-pill--featured">Featured</span>` : ""}
                            ${game.variantOf ? `<span class="admin-pill admin-pill--variant">Variant</span>` : ""}
                            ${status === "new" ? `<span class="admin-pill admin-pill--new">New</span>` : ""}
                            ${status === "edited" ? `<span class="admin-pill admin-pill--edited">Edited</span>` : ""}
                          </div>
                          <p class="admin-game-row__summary">${escapeHTML(game.summary)}</p>
                          <div class="admin-game-row__meta">
                            <span>${escapeHTML(game.gameType)}</span>
                            <span>${escapeHTML(sectionLabels(game.sections))}</span>
                            <span>${escapeHTML(game.duration)}</span>
                            <span>${escapeHTML(settingLabel(game.setting))}</span>
                            <span><code>${escapeHTML(game.id)}</code></span>
                          </div>
                        </div>
                        <div class="admin-game-row__actions">
                          <button class="admin-icon-btn" type="button" data-edit-game="${escapeHTML(game.id)}">
                            ${spriteIcon("pencil", { root: "../" })} Edit
                          </button>
                          <button class="admin-icon-btn" type="button" data-duplicate-game="${escapeHTML(game.id)}">
                            ${spriteIcon("copy", { root: "../" })} Duplicate
                          </button>
                          <button class="admin-icon-btn admin-icon-btn--danger" type="button" data-delete-game="${escapeHTML(game.id)}">
                            ${spriteIcon("x", { root: "../" })} Delete
                          </button>
                        </div>
                      </li>`;
                  })
                  .join("")}
              </ul>`
        }
      </div>
    `;
  }

  function renderBulkView() {
    if (bulkDrafts.length === 0) {
      bulkDrafts = [createEmptyBulkDraft(0), createEmptyBulkDraft(1)];
    }

    return `
      <div class="bulk-shell">
        <div class="bulk-mode-bar">
          <div>
            <h3>Bulk create games</h3>
            <p>Add several games at once using the batch form or paste/upload JSON, then publish them all in one commit.</p>
          </div>
          <div class="admin-subtabs__group">
            <button class="admin-subtab${bulkMode === "batch" ? " is-active" : ""}" type="button" data-bulk-mode="batch">Batch form</button>
            <button class="admin-subtab${bulkMode === "json" ? " is-active" : ""}" type="button" data-bulk-mode="json">Import JSON</button>
          </div>
        </div>

        ${
          bulkMode === "batch"
            ? `
          <div class="bulk-rows" id="bulk-rows">
            ${bulkDrafts
              .map(
                (draft, idx) => `
              <article class="bulk-card" data-bulk-index="${idx}">
                <div class="bulk-card__head">
                  <h4>Game #${idx + 1}${draft.title ? ` — ${escapeHTML(draft.title)}` : ""}</h4>
                  ${
                    bulkDrafts.length > 1
                      ? `<button class="admin-icon-btn admin-icon-btn--danger" type="button" data-remove-bulk="${idx}">Remove row</button>`
                      : ""
                  }
                </div>
                <div class="bulk-card__grid">
                  <div class="field field--2">
                    <label>Game title</label>
                    <input class="input" type="text" maxlength="80" data-bulk-field="title" value="${escapeHTML(draft.title)}" placeholder="e.g. Cone Snatch">
                  </div>
                  <div class="field">
                    <label>Game type</label>
                    <select class="select" data-bulk-field="gameType">
                      ${GAME_TYPES.map((t) => `<option value="${escapeHTML(t)}"${draft.gameType === t ? " selected" : ""}>${escapeHTML(t)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="field field--full">
                    <label>Short summary</label>
                    <input class="input" type="text" maxlength="180" data-bulk-field="summary" value="${escapeHTML(draft.summary)}" placeholder="One or two sentences shown on the game card.">
                  </div>
                  <div class="field">
                    <label>Sections</label>
                    <div class="choice-group">
                      ${SECTIONS.map(
                        (s) => `
                        <label class="choice">
                          <input type="checkbox" data-bulk-section="${s.value}"${draft.sections.includes(s.value) ? " checked" : ""}>
                          <span class="choice__dot" aria-hidden="true"></span>${escapeHTML(s.label)}
                        </label>`,
                      ).join("")}
                    </div>
                  </div>
                  <div class="field">
                    <label>Time band</label>
                    <select class="select" data-bulk-field="timeBand">
                      <option value="quick"${draft.timeBand === "quick" ? " selected" : ""}>Quick (5–10 mins)</option>
                      <option value="normal"${draft.timeBand === "normal" ? " selected" : ""}>Normal (10–20 mins)</option>
                      <option value="long"${draft.timeBand === "long" ? " selected" : ""}>Long (20+ mins)</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>Setting</label>
                    <select class="select" data-bulk-field="setting">
                      <option value="indoors"${draft.setting === "indoors" ? " selected" : ""}>Indoors</option>
                      <option value="outdoors"${draft.setting === "outdoors" ? " selected" : ""}>Outdoors</option>
                      <option value="both"${draft.setting === "both" ? " selected" : ""}>Indoors or outdoors</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>Cover colour</label>
                    <select class="select" data-bulk-field="color">
                      ${COLORS.map((c) => `<option value="${c.value}"${draft.color === c.value ? " selected" : ""}>${escapeHTML(c.label)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="field">
                    <label>Cover icon</label>
                    <select class="select" data-bulk-field="icon">
                      ${ICON_OPTIONS.map((i) => `<option value="${i.value}"${draft.icon === i.value ? " selected" : ""}>${escapeHTML(i.label)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="field">
                    <label>Duration text</label>
                    <input class="input" type="text" maxlength="30" data-bulk-field="duration" value="${escapeHTML(draft.duration)}" placeholder="10–20 mins">
                  </div>
                  <div class="field">
                    <label>Equipment (one per line)</label>
                    <textarea class="textarea" data-bulk-field="equipment" placeholder="None">${escapeHTML(draft.equipment)}</textarea>
                  </div>
                  <div class="field">
                    <label>Set-up (one per line)</label>
                    <textarea class="textarea" data-bulk-field="setup" placeholder="Split the hall in two.">${escapeHTML(draft.setup)}</textarea>
                  </div>
                  <div class="field">
                    <label>Rules (one per line)</label>
                    <textarea class="textarea" data-bulk-field="steps" placeholder="Explain how each round runs.">${escapeHTML(draft.steps)}</textarea>
                  </div>
                  <div class="field field--2">
                    <label>How to win</label>
                    <input class="input" type="text" data-bulk-field="winning" value="${escapeHTML(draft.winning)}" placeholder="How a winner is decided or when a round ends.">
                  </div>
                  <div class="field">
                    <label>Safety notes</label>
                    <input class="input" type="text" data-bulk-field="safety" value="${escapeHTML(draft.safety)}" placeholder="Key safety checks before playing.">
                  </div>
                </div>
                ${
                  draft.errors.length
                    ? `<div class="bulk-card__errors">${draft.errors.map((err) => `<div>• ${escapeHTML(err)}</div>`).join("")}</div>`
                    : ""
                }
              </article>`,
              )
              .join("")}
          </div>
          <div class="bulk-footer">
            <button class="btn btn--ghost btn--small" id="btn-add-bulk-row" type="button">
              ${spriteIcon("plus", { root: "../", className: "icon icon--sm" })}
              Add another game
            </button>
            <button class="btn btn--primary" id="btn-stage-bulk-batch" type="button">
              ${spriteIcon("check", { root: "../", className: "icon icon--sm" })}
              Add all games to staged changes
            </button>
          </div>`
            : `
          <div class="bulk-import-card">
            <div class="field">
              <label for="bulk-json-input">Paste a single game JSON object or an array of games</label>
              <textarea class="textarea" id="bulk-json-input" placeholder='[\n  {\n    "title": "My New Game",\n    ...\n  }\n]'></textarea>
              <p class="field__hint">Missing ids or added dates are filled in automatically. Every entry is validated against the shared schema before staging.</p>
            </div>
            <div class="bulk-import-actions">
              <label class="btn btn--ghost btn--small" for="bulk-json-file">
                ${spriteIcon("file-text", { root: "../", className: "icon icon--sm" })}
                Load .json file
                <input id="bulk-json-file" type="file" accept=".json,application/json" hidden>
              </label>
              <button class="btn btn--ghost btn--small" id="btn-validate-import" type="button">Validate JSON</button>
              <button class="btn btn--primary btn--small" id="btn-stage-import" type="button"${importParsed.filter((i) => i.errors.length === 0).length === 0 ? " disabled" : ""}>
                Stage ${importParsed.filter((i) => i.errors.length === 0).length} valid game${importParsed.filter((i) => i.errors.length === 0).length === 1 ? "" : "s"}
              </button>
            </div>
            ${importError ? `<p class="form-status" role="alert">${escapeHTML(importError)}</p>` : ""}
            ${
              importParsed.length
                ? `<div class="bulk-import-preview">
                    ${importParsed
                      .map(
                        (item) => `
                      <div class="bulk-import-item ${item.errors.length === 0 ? "is-valid" : "is-invalid"}">
                        <div>
                          <strong>${escapeHTML(item.game.title || item.game.id || "Untitled game")}</strong>
                          ${
                            item.errors.length
                              ? `<div>${item.errors.map((e) => escapeHTML(e)).join(" · ")}</div>`
                              : `<div>Ready to stage as <code>${escapeHTML(item.game.id)}</code></div>`
                          }
                        </div>
                        <span>${item.errors.length === 0 ? "Valid" : `${item.errors.length} error${item.errors.length === 1 ? "" : "s"}`}</span>
                      </div>`,
                      )
                      .join("")}
                  </div>`
                : ""
            }
          </div>`
        }
      </div>
    `;
  }

  function renderSubmissionsView() {
    const visible = pendingSubmissions.filter((item) => !approvedSubmissionIds.has(item.submissionId));
    if (visible.length === 0) {
      return `
        <div class="empty mt-6">
          <div class="empty__icon">${spriteIcon("check", { root: "../" })}</div>
          <h2>No pending submissions</h2>
          <p>Games submitted by leaders through the in-app Add a game form appear here for quick approval.</p>
        </div>
      `;
    }

    return `
      <div class="submissions-grid">
        ${visible
          .map((item) => {
            const g = item.game;
            const dateText = item.createdAt
              ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(item.createdAt))
              : g.added || "";
            return `
              <article class="submission-card" data-submission-id="${escapeHTML(item.submissionId)}">
                <div class="submission-card__preview">
                  ${previewCardMarkup(g)}
                </div>
                <div class="submission-card__body">
                  <div class="submission-card__meta">
                    <span>Contributed by <strong>${escapeHTML(g.author || "Community contributor")}</strong></span>
                    ${dateText ? `<span>Submitted ${escapeHTML(dateText)}</span>` : ""}
                    <span>${escapeHTML(g.players || "")}</span>
                  </div>
                  <div class="submission-card__lists">
                    <div>
                      <h4>Equipment</h4>
                      <ul>${(g.equipment || []).map((line) => `<li>${escapeHTML(line)}</li>`).join("")}</ul>
                    </div>
                    <div>
                      <h4>How to play</h4>
                      <ol>${(g.steps || []).slice(0, 5).map((line) => `<li>${escapeHTML(line)}</li>`).join("")}</ol>
                    </div>
                  </div>
                  <p class="field__hint"><strong>Safety:</strong> ${escapeHTML(g.safety || "")}</p>
                  <div class="submission-card__actions">
                    <button class="btn btn--primary btn--small" type="button" data-approve-sub="${escapeHTML(item.submissionId)}">
                      ${spriteIcon("check", { root: "../", className: "icon icon--sm" })}
                      Approve &amp; stage
                    </button>
                    <button class="btn btn--ghost btn--small" type="button" data-edit-sub="${escapeHTML(item.submissionId)}">
                      ${spriteIcon("pencil", { root: "../", className: "icon icon--sm" })}
                      Edit before approving
                    </button>
                    <button class="btn btn--ghost btn--small" type="button" data-decline-sub="${escapeHTML(item.submissionId)}">
                      Decline
                    </button>
                  </div>
                </div>
              </article>`;
          })
          .join("")}
      </div>
    `;
  }

  function render() {
    if (!root) return;
    setBadge(stagedGames.length);

    root.innerHTML = `
      ${renderPublishBar()}
      ${renderStats()}
      ${renderSubTabs()}
      ${subView === "library" ? renderLibraryView() : subView === "bulk" ? renderBulkView() : renderSubmissionsView()}
    `;

    enhanceControls(root);
    bindViewEvents();
  }

  /* ========================================================================
     Full Game Editor Modal (New, Edit, Duplicate, or Edit Submission)
     ======================================================================== */

  function openEditorModal({ mode, game = null, submissionId = null }) {
    if (activeModal) activeModal.remove();

    const isEdit = mode === "edit";
    const initial = game
      ? clone(game)
      : {
          id: "",
          title: "",
          summary: "",
          sections: ["cubs"],
          timeBand: "normal",
          duration: AUTO_DURATIONS.normal,
          minutes: 15,
          setting: "indoors",
          players: "Whole section",
          gameType: "Active",
          energy: "medium",
          noise: "medium",
          mess: "none",
          themes: [],
          equipment: [],
          setup: [],
          steps: [],
          winning: "",
          safety: "",
          tips: [],
          adaptations: [],
          themedTwists: [],
          variantOf: null,
          featured: false,
          art: { color: "purple", icon: "gamepad" },
          added: todayISO(),
          author: session?.user?.login || "Scout Tools",
        };

    const heading =
      mode === "edit"
        ? `Edit: ${initial.title}`
        : mode === "submission"
          ? `Review & edit submission`
          : mode === "duplicate"
            ? `Duplicate game`
            : "New game";

    const backdrop = document.createElement("div");
    backdrop.className = "admin-modal-backdrop";
    backdrop.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="editor-modal-title">
        <div class="admin-modal__head">
          <h2 id="editor-modal-title">${escapeHTML(heading)}</h2>
          <button class="admin-icon-btn" type="button" data-close-modal aria-label="Close editor">
            ${spriteIcon("x", { root: "../" })} Close
          </button>
        </div>

        <form class="admin-modal__body" id="admin-editor-form" novalidate>
          <div class="admin-editor-fields">
            <div class="form-grid">
              <div class="field field--full">
                <label for="ed-title">Game title</label>
                <input class="input" id="ed-title" name="title" type="text" maxlength="80" value="${escapeHTML(initial.title)}" required>
                <p class="field__error" data-error-for="title"></p>
              </div>
              <div class="field field--full">
                <label for="ed-summary">Short summary</label>
                <textarea class="textarea" id="ed-summary" name="summary" maxlength="220" required>${escapeHTML(initial.summary)}</textarea>
                <p class="field__error" data-error-for="summary"></p>
              </div>
              <fieldset class="field field--full">
                <legend>Sections</legend>
                <div class="choice-group">
                  ${SECTIONS.map(
                    (s) => `
                    <label class="choice">
                      <input type="checkbox" name="sections" value="${s.value}"${(initial.sections || []).includes(s.value) ? " checked" : ""}>
                      <span class="choice__dot" aria-hidden="true"></span>${escapeHTML(s.label)}
                    </label>`,
                  ).join("")}
                </div>
                <p class="field__error" data-error-for="sections"></p>
              </fieldset>
              <div class="field"><label for="ed-type">Game type</label><select class="select" id="ed-type"></select></div>
              <div class="field"><label for="ed-setting">Setting</label><select class="select" id="ed-setting"></select></div>
              <div class="field"><label for="ed-players">Players</label><select class="select" id="ed-players"></select></div>
              <div class="field">
                <label for="ed-duration">Duration</label>
                <input class="input" id="ed-duration" type="text" maxlength="30" value="${escapeHTML(initial.duration)}">
                <p class="field__error" data-error-for="duration"></p>
              </div>
              <div class="field"><label for="ed-timeband">Time filter</label><select class="select" id="ed-timeband"></select><p class="field__error" data-error-for="timeBand"></p></div>
              <div class="field">
                <label for="ed-minutes">Typical minutes</label>
                <input class="input" id="ed-minutes" type="number" min="1" max="180" value="${escapeHTML(initial.minutes || "")}">
              </div>
              <div class="field"><label for="ed-energy">Energy</label><select class="select" id="ed-energy"></select></div>
              <div class="field"><label for="ed-noise">Noise</label><select class="select" id="ed-noise"></select></div>
              <div class="field"><label for="ed-mess">Mess</label><select class="select" id="ed-mess"></select></div>
              <div class="field">
                <label for="ed-author">Credit / author</label>
                <input class="input" id="ed-author" type="text" maxlength="80" value="${escapeHTML(initial.author || "")}">
              </div>
              <div class="field field--full">
                <label class="admin-check-label">
                  <input class="admin-checkbox" type="checkbox" id="ed-featured"${initial.featured ? " checked" : ""}>
                  <span><strong>Featured game</strong> — highlight this game in the “Three to start with” section</span>
                </label>
              </div>
              <div class="field field--full">
                <label for="ed-equipment">Equipment (one per line)</label>
                <textarea class="textarea" id="ed-equipment">${escapeHTML((initial.equipment || []).join("\n"))}</textarea>
                <p class="field__error" data-error-for="equipment"></p>
              </div>
              <div class="field field--full">
                <label for="ed-setup">Set-up (one step per line)</label>
                <textarea class="textarea" id="ed-setup">${escapeHTML((initial.setup || []).join("\n"))}</textarea>
                <p class="field__error" data-error-for="setup"></p>
              </div>
              <div class="field field--full">
                <label for="ed-steps">Rules (one rule per line)</label>
                <textarea class="textarea" id="ed-steps" style="min-height:150px;">${escapeHTML((initial.steps || []).join("\n"))}</textarea>
                <p class="field__error" data-error-for="steps"></p>
              </div>
              <div class="field field--full">
                <label for="ed-winning">How to win</label>
                <textarea class="textarea" id="ed-winning">${escapeHTML(initial.winning || "")}</textarea>
                <p class="field__error" data-error-for="winning"></p>
              </div>
              <div class="field field--full">
                <label for="ed-safety">Safety notes</label>
                <textarea class="textarea" id="ed-safety">${escapeHTML(initial.safety || "")}</textarea>
                <p class="field__error" data-error-for="safety"></p>
              </div>
              <div class="field field--full">
                <label for="ed-tips">Leader tips <span class="field__optional">optional, “Heading: tip” per line</span></label>
                <textarea class="textarea" id="ed-tips">${escapeHTML(formatTips(initial.tips))}</textarea>
              </div>
              <div class="field field--full">
                <label for="ed-easier">Make it easier <span class="field__optional">optional</span></label>
                <textarea class="textarea" id="ed-easier">${escapeHTML(findAdaptation(initial.adaptations, "Make it easier"))}</textarea>
              </div>
              <div class="field field--full">
                <label for="ed-harder">Make it harder <span class="field__optional">optional</span></label>
                <textarea class="textarea" id="ed-harder">${escapeHTML(findAdaptation(initial.adaptations, "Make it harder"))}</textarea>
              </div>
              <div class="field field--full">
                <label for="ed-include">Include everyone <span class="field__optional">optional</span></label>
                <textarea class="textarea" id="ed-include">${escapeHTML(findAdaptation(initial.adaptations, "Include everyone"))}</textarea>
              </div>
              <fieldset class="field field--full">
                <legend>Themes</legend>
                <div class="choice-group" id="ed-themes"></div>
              </fieldset>
              <div class="field field--full">
                <span class="field__label">Themed twists <span class="field__optional">optional</span></span>
                <div class="repeat-list" id="ed-twists"></div>
                <div class="mt-2">
                  <button class="btn btn--ghost btn--small" id="ed-add-twist" type="button">
                    ${spriteIcon("plus", { root: "../", className: "icon icon--sm" })} Add themed twist
                  </button>
                </div>
                <p class="field__error" data-error-for="twists"></p>
              </div>
              <div class="field field--full">
                <span class="field__label">Cover colour</span>
                <input type="hidden" id="ed-color" value="${escapeHTML(initial.art?.color || "purple")}">
                <div class="swatch-grid" id="ed-color-picker"></div>
              </div>
              <div class="field field--full">
                <label for="ed-icon-search">Cover icon</label>
                <input type="hidden" id="ed-icon" value="${escapeHTML(initial.art?.icon || "gamepad")}">
                <div class="icon-picker__toolbar">
                  <div class="icon-picker__search">
                    ${spriteIcon("search", { root: "../" })}
                    <input class="input" id="ed-icon-search" type="search" placeholder="Search 168 icons…" autocomplete="off">
                  </div>
                  <p class="icon-picker__count" id="ed-icon-count"></p>
                </div>
                <div class="icon-picker" id="ed-icon-picker"></div>
              </div>
              <div class="field field--full">
                <label for="ed-variant">Variant of another game?</label>
                <select class="select" id="ed-variant"></select>
                <p class="field__error" data-error-for="variantOf"></p>
              </div>
            </div>
          </div>

          <aside class="admin-modal__preview">
            <p class="eyebrow">Live card preview</p>
            <div id="ed-preview"></div>
            <p class="form-status" id="ed-status" role="alert" hidden></p>
          </aside>
        </form>

        <template id="ed-twist-tpl">
          <div class="repeat-row" data-twist-row>
            <div class="field"><select class="select" data-twist-theme aria-label="Twist theme"></select></div>
            <div class="field"><input class="input" data-twist-title type="text" maxlength="70" placeholder="Twist title"></div>
            <div class="field"><textarea class="textarea" data-twist-text maxlength="240" placeholder="What changes?"></textarea></div>
            <button class="repeat-remove" data-remove-twist type="button" aria-label="Remove twist">
              ${spriteIcon("x", { root: "../" })}
            </button>
          </div>
        </template>

        <div class="admin-modal__foot">
          <span class="field__hint">${isEdit ? `ID: ${escapeHTML(initial.id)}` : "ID will be generated from the title."}</span>
          <div class="admin-modal__foot-actions">
            <button class="btn btn--ghost btn--small" type="button" data-close-modal>Cancel</button>
            <button class="btn btn--primary btn--small" type="submit" form="admin-editor-form">
              ${spriteIcon("check", { root: "../", className: "icon icon--sm" })}
              ${mode === "submission" ? "Approve & stage game" : "Save to staged changes"}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.append(backdrop);
    activeModal = backdrop;

    const modalForm = backdrop.querySelector("#admin-editor-form");
    const q = (sel) => backdrop.querySelector(sel);

    populateGameSelects({
      gameType: q("#ed-type"),
      setting: q("#ed-setting"),
      players: q("#ed-players"),
      timeBand: q("#ed-timeband"),
      energy: q("#ed-energy"),
      noise: q("#ed-noise"),
      mess: q("#ed-mess"),
    });

    q("#ed-type").value = initial.gameType || "Active";
    q("#ed-setting").value = initial.setting || "indoors";
    q("#ed-players").value = initial.players || "Whole section";
    q("#ed-timeband").value = initial.timeBand || "normal";
    q("#ed-energy").value = initial.energy || "medium";
    q("#ed-noise").value = initial.noise || "medium";
    q("#ed-mess").value = initial.mess || "none";

    const baseGames = stagedGames
      .filter((g) => !g.variantOf && g.id !== initial.id)
      .sort((a, b) => a.title.localeCompare(b.title, "en-GB"));
    q("#ed-variant").innerHTML = `
      <option value="">No, standalone game</option>
      ${baseGames.map((g) => `<option value="${escapeHTML(g.id)}"${initial.variantOf === g.id ? " selected" : ""}>${escapeHTML(g.title)}</option>`).join("")}
    `;

    renderThemeCheckboxes(q("#ed-themes"), initial.themes || [], "themes");
    renderColorSwatches(q("#ed-color-picker"), initial.art?.color || "purple");
    renderIconChoices(q("#ed-icon-picker"), q("#ed-icon-count"), {
      query: "",
      activeIcon: initial.art?.icon || "gamepad",
    });

    const twistList = q("#ed-twists");
    const twistTpl = q("#ed-twist-tpl");
    (initial.themedTwists || []).forEach((tw) => appendTwistRow(twistList, twistTpl, tw));

    enhanceControls(backdrop);

    const readDraft = () => {
      const title = q("#ed-title").value.trim();
      const timeBand = q("#ed-timeband").value;
      const duration = q("#ed-duration").value.trim();
      const adaptations = [
        { title: "Make it easier", text: q("#ed-easier").value.trim() },
        { title: "Make it harder", text: q("#ed-harder").value.trim() },
        { title: "Include everyone", text: q("#ed-include").value.trim() },
      ].filter((a) => a.text);

      return {
        id: isEdit ? initial.id : uniqueId(title, stagedGames.map((g) => g.id)),
        title,
        summary: q("#ed-summary").value.trim(),
        sections: [...modalForm.querySelectorAll('input[name="sections"]:checked')].map((i) => i.value),
        timeBand,
        duration,
        minutes: inferMinutes(duration, timeBand, q("#ed-minutes").value),
        setting: q("#ed-setting").value,
        players: q("#ed-players").value,
        gameType: q("#ed-type").value,
        energy: q("#ed-energy").value,
        noise: q("#ed-noise").value,
        mess: q("#ed-mess").value,
        themes: [...modalForm.querySelectorAll('input[name="themes"]:checked')].map((i) => i.value),
        equipment: parseLines(q("#ed-equipment").value),
        setup: parseLines(q("#ed-setup").value),
        steps: parseLines(q("#ed-steps").value),
        winning: q("#ed-winning").value.trim(),
        safety: q("#ed-safety").value.trim(),
        tips: parseTips(q("#ed-tips").value),
        adaptations,
        themedTwists: readTwistRows(twistList)
          .filter((tw) => tw.theme && tw.title && tw.text)
          .map(({ theme, title: twistTitle, text }) => ({ theme, title: twistTitle, text })),
        variantOf: q("#ed-variant").value || null,
        featured: Boolean(q("#ed-featured").checked),
        art: { color: q("#ed-color").value, icon: q("#ed-icon").value },
        added: isEdit ? initial.added || todayISO() : todayISO(),
        author: q("#ed-author").value.trim() || "Scout Tools",
      };
    };

    const refreshPreview = () => {
      q("#ed-preview").innerHTML = previewCardMarkup(readDraft());
    };
    refreshPreview();

    const closeModal = () => {
      document.removeEventListener("keydown", onEsc);
      backdrop.remove();
      activeModal = null;
    };

    const onEsc = (event) => {
      if (event.key === "Escape" && !backdrop.querySelector(".ui-select.is-open")) {
        closeModal();
      }
    };
    document.addEventListener("keydown", onEsc);

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop || event.target.closest("[data-close-modal]")) {
        closeModal();
      }
    });

    modalForm.addEventListener("input", (event) => {
      if (event.target === q("#ed-icon-search")) return;
      refreshPreview();
    });
    modalForm.addEventListener("change", refreshPreview);

    q("#ed-icon-search").addEventListener("input", () => {
      renderIconChoices(q("#ed-icon-picker"), q("#ed-icon-count"), {
        query: q("#ed-icon-search").value,
        activeIcon: q("#ed-icon").value,
      });
    });

    q("#ed-color-picker").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-color]");
      if (!btn) return;
      q("#ed-color").value = btn.dataset.color;
      renderColorSwatches(q("#ed-color-picker"), btn.dataset.color);
      refreshPreview();
    });

    q("#ed-icon-picker").addEventListener("click", (event) => {
      const btn = event.target.closest("[data-icon]");
      if (!btn) return;
      q("#ed-icon").value = btn.dataset.icon;
      q("#ed-icon-picker").querySelectorAll("[data-icon]").forEach((elBtn) => {
        const active = elBtn.dataset.icon === btn.dataset.icon;
        elBtn.classList.toggle("is-active", active);
        elBtn.setAttribute("aria-pressed", String(active));
      });
      refreshPreview();
    });

    q("#ed-add-twist").addEventListener("click", () => {
      appendTwistRow(twistList, twistTpl);
      enhanceControls(twistList);
    });

    twistList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-remove-twist]");
      if (!removeBtn) return;
      removeBtn.closest("[data-twist-row]").remove();
      refreshPreview();
    });

    modalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      modalForm.querySelectorAll("[data-error-for]").forEach((elErr) => { elErr.textContent = ""; });
      const draft = readDraft();
      const errors = validateGameFields(draft, readTwistRows(twistList), baseGames);
      if (errors.length > 0) {
        errors.forEach(([key, msg]) => {
          const elErr = modalForm.querySelector(`[data-error-for="${key}"]`);
          if (elErr) elErr.textContent = msg;
        });
        q("#ed-status").textContent = errors[0][1];
        q("#ed-status").hidden = false;
        return;
      }

      if (isEdit) {
        const idx = stagedGames.findIndex((g) => g.id === initial.id);
        if (idx >= 0) stagedGames[idx] = draft;
      } else {
        stagedGames.unshift(draft);
      }

      if (submissionId) {
        approvedSubmissionIds.add(submissionId);
      }

      closeModal();
      showToast(isEdit ? `Staged edits to “${draft.title}”.` : `Staged new game “${draft.title}”.`);
      render();
    });

    q("#ed-title").focus();
  }

  /* ========================================================================
     Actions (delete, bulk delete, bulk stage, approve/decline, publish)
     ======================================================================== */

  async function deleteGameByIds(ids) {
    const idSet = new Set(ids);
    const affectedVariants = stagedGames.filter((g) => g.variantOf && idSet.has(g.variantOf) && !idSet.has(g.id));
    const single = ids.length === 1 ? stagedGames.find((g) => g.id === ids[0]) : null;
    const variantNote = affectedVariants.length
      ? ` ${affectedVariants.length} linked variant${affectedVariants.length === 1 ? "" : "s"} will be converted to standalone games.`
      : "";

    const confirmed = await confirmDialog({
      title: single ? `Delete “${single.title}”?` : `Delete ${ids.length} games?`,
      message: `This removes ${single ? "this game" : "these games"} from your staged library. Nothing goes live until you click Publish.${variantNote}`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
    });
    if (!confirmed) return;

    stagedGames = stagedGames
      .filter((g) => !idSet.has(g.id))
      .map((g) => (g.variantOf && idSet.has(g.variantOf) ? { ...g, variantOf: null } : g));
    ids.forEach((id) => selectedIds.delete(id));
    showToast(single ? `Removed “${single.title}” from staged library.` : `Removed ${ids.length} games from staged library.`);
    render();
  }

  function stageBulkBatch() {
    let anyErrors = false;
    const toAdd = [];
    const existingIds = new Set(stagedGames.map((g) => g.id));

    bulkDrafts.forEach((draft) => {
      const game = {
        id: uniqueId(draft.title || "new-game", [...existingIds]),
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        sections: draft.sections,
        timeBand: draft.timeBand,
        duration: draft.duration.trim() || AUTO_DURATIONS[draft.timeBand] || "10–20 mins",
        minutes: inferMinutes(draft.duration, draft.timeBand),
        setting: draft.setting,
        players: draft.players || "Whole section",
        gameType: draft.gameType || "Active",
        energy: draft.energy || "medium",
        noise: draft.noise || "medium",
        mess: draft.mess || "none",
        themes: [],
        equipment: parseLines(draft.equipment),
        setup: parseLines(draft.setup),
        steps: parseLines(draft.steps),
        winning: draft.winning.trim(),
        safety: draft.safety.trim(),
        tips: [],
        adaptations: [],
        themedTwists: [],
        variantOf: null,
        featured: Boolean(draft.featured),
        art: { color: draft.color || "purple", icon: draft.icon || "gamepad" },
        added: todayISO(),
        author: draft.author || session?.user?.login || "Scout Tools",
      };

      const fieldErrors = validateGameFields(game, [], stagedGames).map(([, msg]) => msg);
      draft.errors = fieldErrors;
      if (fieldErrors.length > 0) {
        anyErrors = true;
      } else {
        existingIds.add(game.id);
        toAdd.push(game);
      }
    });

    if (anyErrors) {
      render();
      showToast("Fix the highlighted errors in the batch before staging.");
      return;
    }

    stagedGames = [...toAdd, ...stagedGames];
    bulkDrafts = [createEmptyBulkDraft(0), createEmptyBulkDraft(1)];
    subView = "library";
    showToast(`Staged ${toAdd.length} new game${toAdd.length === 1 ? "" : "s"}. Click Publish to save.`);
    render();
  }

  function parseJsonImport(rawText) {
    importError = "";
    importParsed = [];
    const trimmed = String(rawText || "").trim();
    if (!trimmed) {
      importError = "Paste a game JSON object or array first.";
      render();
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      importError = `Invalid JSON: ${error.message}`;
      render();
      return;
    }

    const list = Array.isArray(parsed) ? parsed : [parsed];
    const knownIds = new Set(stagedGames.map((g) => g.id));
    const gamesById = new Map(stagedGames.map((g) => [g.id, g]));

    importParsed = list.map((raw) => {
      const candidate = {
        featured: false,
        themes: [],
        tips: [],
        adaptations: [],
        themedTwists: [],
        variantOf: null,
        added: todayISO(),
        author: session?.user?.login || "Scout Tools",
        ...raw,
      };
      if (!candidate.id && candidate.title) {
        candidate.id = uniqueId(candidate.title, [...knownIds]);
      }
      const errors = validateGame(candidate, { knownIds, gamesById });
      if (errors.length === 0) {
        knownIds.add(candidate.id);
        gamesById.set(candidate.id, candidate);
      }
      return { game: candidate, errors };
    });

    render();
    const textarea = root.querySelector("#bulk-json-input");
    if (textarea) textarea.value = rawText;
  }

  async function publishChanges() {
    if (publishing) return;
    const diff = computeDiff();
    if (diff.total === 0) return;

    const validation = validateLibrary(stagedGames);
    if (validation.errors.length > 0) {
      showToast(`Cannot publish: ${validation.errors[0]}`);
      return;
    }

    publishing = true;
    const message = (commitMessage || "").trim() || defaultCommitMessage(diff);
    render();

    try {
      const formatted = `${JSON.stringify(stagedGames, null, 2)}\n`;
      const result = await writeRepoFile(session, GAMES_FILE_PATH, formatted, message, fileSha);
      fileSha = result.sha || fileSha;

      // Close any approved pending submissions.
      const toClose = [...approvedSubmissionIds];
      for (const subId of toClose) {
        try {
          await closePendingSubmission(session, subId, { status: "approved" });
        } catch {
          // Non-fatal: the game itself is already published.
        }
      }

      originalGames = clone(stagedGames);
      pendingSubmissions = pendingSubmissions.filter((item) => !approvedSubmissionIds.has(item.submissionId));
      approvedSubmissionIds.clear();
      commitMessage = "";
      showToast("Published to GitHub! Site deployment will finish shortly.");
    } catch (error) {
      showToast(error.message || "Could not publish changes. Refresh and try again.");
    } finally {
      publishing = false;
      render();
    }
  }

  function bindViewEvents() {
    root.querySelectorAll("[data-subview]").forEach((btn) => {
      btn.addEventListener("click", () => {
        subView = btn.dataset.subview;
        render();
      });
    });

    root.querySelector("#btn-new-game")?.addEventListener("click", () => openEditorModal({ mode: "new" }));
    root.querySelector("#btn-open-bulk")?.addEventListener("click", () => {
      subView = "bulk";
      render();
    });
    root.querySelector("#btn-reload-games")?.addEventListener("click", async () => {
      if (computeDiff().total > 0) {
        const ok = await confirmDialog({
          title: "Reload library?",
          message: "Reloading will discard your unpublished changes.",
          confirmLabel: "Discard & reload",
          cancelLabel: "Cancel",
          tone: "danger",
        });
        if (!ok) return;
      }
      await loadData();
    });

    // Publish bar events
    root.querySelector("#admin-commit-message")?.addEventListener("input", (event) => {
      commitMessage = event.target.value;
    });
    root.querySelector("#btn-discard-changes")?.addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "Discard all unsaved changes?",
        message: "Every staged addition, edit and deletion will be reverted to the saved library.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        tone: "danger",
      });
      if (!ok) return;
      stagedGames = clone(originalGames);
      approvedSubmissionIds.clear();
      selectedIds.clear();
      commitMessage = "";
      render();
      showToast("Unsaved changes discarded.");
    });
    root.querySelector("#btn-publish-changes")?.addEventListener("click", publishChanges);

    // Library view filters & selection
    root.querySelector("#admin-game-search")?.addEventListener("input", (event) => {
      filters.query = event.target.value;
      const pos = event.target.selectionStart;
      render();
      const input = root.querySelector("#admin-game-search");
      if (input) {
        input.focus();
        if (typeof pos === "number") input.setSelectionRange(pos, pos);
      }
    });
    root.querySelector("#admin-filter-section")?.addEventListener("change", (event) => {
      filters.section = event.target.value;
      render();
    });
    root.querySelector("#admin-filter-theme")?.addEventListener("change", (event) => {
      filters.theme = event.target.value;
      render();
    });
    root.querySelector("#admin-filter-type")?.addEventListener("change", (event) => {
      filters.type = event.target.value;
      render();
    });

    root.querySelector("#admin-select-all")?.addEventListener("change", (event) => {
      const visible = filteredGames();
      if (event.target.checked) visible.forEach((g) => selectedIds.add(g.id));
      else visible.forEach((g) => selectedIds.delete(g.id));
      render();
    });

    root.querySelectorAll("[data-select-game]").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked) selectedIds.add(cb.dataset.selectGame);
        else selectedIds.delete(cb.dataset.selectGame);
        render();
      });
    });

    root.querySelector("#btn-clear-selection")?.addEventListener("click", () => {
      selectedIds.clear();
      render();
    });

    root.querySelector("#btn-bulk-delete")?.addEventListener("click", () => {
      deleteGameByIds([...selectedIds]);
    });

    root.querySelector("#btn-bulk-feature")?.addEventListener("click", () => {
      const allFeatured = [...selectedIds].every((id) => stagedGames.find((g) => g.id === id)?.featured);
      stagedGames = stagedGames.map((g) => (selectedIds.has(g.id) ? { ...g, featured: !allFeatured } : g));
      showToast(allFeatured ? "Unfeatured selected games." : "Marked selected games as featured.");
      render();
    });

    root.querySelectorAll("[data-edit-game]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const game = stagedGames.find((g) => g.id === btn.dataset.editGame);
        if (game) openEditorModal({ mode: "edit", game });
      });
    });

    root.querySelectorAll("[data-duplicate-game]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const game = stagedGames.find((g) => g.id === btn.dataset.duplicateGame);
        if (!game) return;
        const copy = clone(game);
        copy.title = `${game.title} (Copy)`;
        copy.id = "";
        copy.featured = false;
        openEditorModal({ mode: "duplicate", game: copy });
      });
    });

    root.querySelectorAll("[data-delete-game]").forEach((btn) => {
      btn.addEventListener("click", () => deleteGameByIds([btn.dataset.deleteGame]));
    });

    // Bulk view events
    root.querySelectorAll("[data-bulk-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        bulkMode = btn.dataset.bulkMode;
        render();
      });
    });

    root.querySelectorAll("[data-bulk-index]").forEach((card) => {
      const idx = Number(card.dataset.bulkIndex);
      card.querySelectorAll("[data-bulk-field]").forEach((field) => {
        const update = () => {
          const prop = field.dataset.bulkField;
          bulkDrafts[idx][prop] = field.value;
          if (prop === "timeBand" && !bulkDrafts[idx].duration) {
            bulkDrafts[idx].duration = AUTO_DURATIONS[field.value] || "10–20 mins";
          }
        };
        field.addEventListener("input", update);
        field.addEventListener("change", update);
      });
      card.querySelectorAll("[data-bulk-section]").forEach((cb) => {
        cb.addEventListener("change", () => {
          const val = cb.dataset.bulkSection;
          const set = new Set(bulkDrafts[idx].sections);
          if (cb.checked) set.add(val);
          else set.delete(val);
          bulkDrafts[idx].sections = [...set];
        });
      });
    });

    root.querySelectorAll("[data-remove-bulk]").forEach((btn) => {
      btn.addEventListener("click", () => {
        bulkDrafts.splice(Number(btn.dataset.removeBulk), 1);
        render();
      });
    });

    root.querySelector("#btn-add-bulk-row")?.addEventListener("click", () => {
      bulkDrafts.push(createEmptyBulkDraft(bulkDrafts.length));
      render();
    });

    root.querySelector("#btn-stage-bulk-batch")?.addEventListener("click", stageBulkBatch);

    root.querySelector("#bulk-json-file")?.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      parseJsonImport(text);
    });

    root.querySelector("#btn-validate-import")?.addEventListener("click", () => {
      parseJsonImport(root.querySelector("#bulk-json-input")?.value || "");
    });

    root.querySelector("#btn-stage-import")?.addEventListener("click", () => {
      const valid = importParsed.filter((item) => item.errors.length === 0).map((item) => item.game);
      if (valid.length === 0) return;
      stagedGames = [...valid, ...stagedGames];
      importParsed = [];
      importError = "";
      subView = "library";
      showToast(`Staged ${valid.length} imported game${valid.length === 1 ? "" : "s"}.`);
      render();
    });

    // Pending submissions events
    root.querySelectorAll("[data-approve-sub]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sub = pendingSubmissions.find((s) => s.submissionId === btn.dataset.approveSub);
        if (!sub) return;
        const game = clone(sub.game);
        game.id = uniqueId(game.title || game.id, stagedGames.map((g) => g.id));
        game.featured = false;
        stagedGames.unshift(game);
        approvedSubmissionIds.add(sub.submissionId);
        showToast(`Approved & staged “${game.title}”. Click Publish to push it live.`);
        render();
      });
    });

    root.querySelectorAll("[data-edit-sub]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sub = pendingSubmissions.find((s) => s.submissionId === btn.dataset.editSub);
        if (!sub) return;
        openEditorModal({ mode: "submission", game: sub.game, submissionId: sub.submissionId });
      });
    });

    root.querySelectorAll("[data-decline-sub]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const sub = pendingSubmissions.find((s) => s.submissionId === btn.dataset.declineSub);
        if (!sub) return;
        const ok = await confirmDialog({
          title: `Decline “${sub.game.title}”?`,
          message: "This removes the submission from the review queue without adding it to the library.",
          confirmLabel: "Decline submission",
          cancelLabel: "Keep in queue",
          tone: "danger",
        });
        if (!ok) return;
        try {
          await closePendingSubmission(session, sub.submissionId, { status: "declined" });
          pendingSubmissions = pendingSubmissions.filter((s) => s.submissionId !== sub.submissionId);
          showToast(`Declined “${sub.game.title}”.`);
          render();
        } catch (error) {
          showToast(error.message || "Could not decline submission.");
        }
      });
    });
  }

  async function loadData() {
    root.innerHTML = `<div class="loading"><span class="spinner" aria-hidden="true"></span>Loading Games Finder library…</div>`;
    try {
      const [{ content, sha }, submissions] = await Promise.all([
        readRepoFile(session, GAMES_FILE_PATH),
        listPendingSubmissions(session).catch(() => []),
      ]);
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) throw new Error("games.json does not contain a JSON array.");
      fileSha = sha;
      originalGames = clone(parsed);
      stagedGames = clone(parsed);
      pendingSubmissions = submissions;
      approvedSubmissionIds.clear();
      selectedIds.clear();
      commitMessage = "";
      render();
    } catch (error) {
      root.innerHTML = `
        <div class="error-panel mt-4">
          <strong>Could not load the Games Finder library.</strong>
          <span>${escapeHTML(error.message)}</span>
        </div>
      `;
    }
  }

  return {
    id: "games",
    title: "Games Finder",
    icon: "gamepad",
    hasUnsavedChanges() {
      return computeDiff().total > 0;
    },
    async mount(container, context) {
      root = container;
      session = context.session;
      setBadge = context.setBadge || (() => {});
      await loadData();
    },
    unmount() {
      if (activeModal) {
        activeModal.remove();
        activeModal = null;
      }
      root = null;
    },
  };
}
