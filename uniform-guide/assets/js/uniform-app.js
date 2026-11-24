// Interactive Uniform & Badge Placement Guide — Browser studio controller.

import { confirmDialog, escapeHTML, initSite, spriteIcon } from "../../../assets/js/site.js";
import {
  BADGE_ICONS,
  BADGE_SHAPES,
  CANVAS,
  CUSTOM_BADGE_TEMPLATES,
  DIAGRAM_STYLES,
  NATIONS,
  NECKER_PATTERNS,
  NECKER_PRESETS,
  NECKER_SWATCHES,
  SECTIONS,
  WOGGLE_SWATCHES,
  ZONES,
  createDefaultState,
  getSection,
  getVariant,
  normaliseState,
  slugify,
} from "./uniform-data.js";
import { resolveUniformLayout } from "./uniform-layout.js";
import { renderNeckerPreviewSvg, renderUniformSvg } from "./uniform-svg.js";
import {
  buildEmbeddedFontCss,
  downloadUniformPdf,
  loadUniformPdfAssets,
  svgStringToPngDataUrl,
} from "./uniform-pdf.js";

const STORAGE_KEY = "scout-tools:uniform-guide:v1";
const ROOT = "../";

const ZONE_META = [
  { id: "right-sleeve", label: "Right sleeve (left on diagram)" },
  { id: "right-chest", label: "Right chest" },
  { id: "left-chest", label: "Left chest" },
  { id: "left-sleeve", label: "Left sleeve (right on diagram)" },
  { id: "scarf", label: "Neckerchief / scarf" },
  { id: "shoulders", label: "Shoulders" },
];

const TAPE_COLOR_PRESETS = [
  { name: "Bottle green", bg: "#14532d", fg: "#ffffff", border: "#ffffff" },
  { name: "Navy & gold", bg: "#0b2559", fg: "#ffe627", border: "#ffe627" },
  { name: "Scarlet & white", bg: "#c81e1e", fg: "#ffffff", border: "#ffffff" },
  { name: "Scouts purple", bg: "#590fa9", fg: "#ffffff", border: "#ffffff" },
  { name: "Black & white", bg: "#1a1a1a", fg: "#ffffff", border: "#ffffff" },
  { name: "White & navy", bg: "#ffffff", fg: "#0b2559", border: "#0b2559" },
];

const ui = {
  activeTab: "setup",
  selectedId: null,
  expandedOfficialId: null,
  expandedCustomId: null,
  expandedTapeId: "primary-tape",
  badgeSearch: "",
  unlockDragAll: false,
  drag: null,
};

let state = loadSavedState();
let layout = resolveUniformLayout(state);

const els = {
  sectionPills: document.querySelector("#section-pills"),
  editorTabs: document.querySelector("#editor-tabs"),
  panes: {
    setup: document.querySelector("#pane-setup"),
    necker: document.querySelector("#pane-necker"),
    tapes: document.querySelector("#pane-tapes"),
    badges: document.querySelector("#pane-badges"),
    custom: document.querySelector("#pane-custom"),
  },
  stageTitle: document.querySelector("#stage-title"),
  stageSubtitle: document.querySelector("#stage-subtitle"),
  styleSwitcher: document.querySelector("#style-switcher"),
  unlockDragToggle: document.querySelector("#toggle-unlock-drag"),
  printHeader: document.querySelector("#print-header"),
  diagramCanvas: document.querySelector("#diagram-canvas"),
  canvasNotes: document.querySelector("#canvas-notes"),
  hoverTip: document.querySelector("#hover-tip"),
  quickInspector: document.querySelector("#quick-inspector"),
  studioStatus: document.querySelector("#studio-status"),
  moreMenu: document.querySelector("#more-menu"),
  btnPdf: document.querySelector("#btn-download-pdf"),
  btnPrint: document.querySelector("#btn-print"),
  btnPng: document.querySelector("#btn-download-png"),
  btnSvg: document.querySelector("#btn-download-svg"),
  btnExportJson: document.querySelector("#btn-export-json"),
  btnImportJson: document.querySelector("#btn-import-json"),
  importJsonInput: document.querySelector("#import-json-input"),
  btnResetAll: document.querySelector("#btn-reset-all"),
};

function icon(name, className = "icon icon--sm") {
  return spriteIcon(name, { root: ROOT, className });
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return normaliseState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    setStatus("Saved in memory, but browser storage is full (try smaller badge images).", true);
  }
}

let statusTimer = 0;
function setStatus(message, isError = false) {
  if (!els.studioStatus) return;
  els.studioStatus.textContent = message;
  els.studioStatus.classList.toggle("is-error", isError);
  window.clearTimeout(statusTimer);
  if (message) {
    statusTimer = window.setTimeout(() => {
      els.studioStatus.textContent = "";
      els.studioStatus.classList.remove("is-error");
    }, 5500);
  }
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function readImageFileAsDataUrl(file, maxSize = 180) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose a PNG, JPG, SVG or WebP image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode that image file."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width || maxSize, img.height || maxSize));
        const w = Math.max(1, Math.round((img.width || maxSize) * scale));
        const h = Math.max(1, Math.round((img.height || maxSize) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function triggerDownload(blobOrUrl, filename) {
  const isBlob = blobOrUrl instanceof Blob;
  const url = isBlob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  if (isBlob) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── State Mutation & Refresh Pipeline ────────────────────────────────────────

function refreshDiagramOnly() {
  layout = resolveUniformLayout(state);
  saveState();
  renderSectionPills();
  renderStage();
  renderQuickInspector();
}

function refreshAll() {
  layout = resolveUniformLayout(state);
  saveState();
  renderSectionPills();
  renderStage();
  renderActiveTabPane();
  renderQuickInspector();
}

// ── Section Pills ────────────────────────────────────────────────────────────

function renderSectionPills() {
  els.sectionPills.innerHTML = SECTIONS.map((sec) => {
    const active = sec.id === state.section;
    return `
      <button
        type="button"
        role="tab"
        class="ug-section-pill${active ? " is-active" : ""}"
        style="--pill-accent:${escapeHTML(sec.accent)}"
        data-section="${escapeHTML(sec.id)}"
        aria-selected="${active}"
      >
        <span class="ug-section-pill__dot" aria-hidden="true"></span>
        ${escapeHTML(sec.name)}
      </button>
    `;
  }).join("");
}

// ── Interactive Diagram Stage ────────────────────────────────────────────────

function renderStage() {
  const { counts, section, variant } = layout;
  els.stageTitle.textContent = layout.title;
  els.stageSubtitle.textContent = `${section.fullName} (${section.age}) • ${variant.label} • ${counts.visibleBadges} badge${counts.visibleBadges === 1 ? "" : "s"} • ${counts.tapes} tape${counts.tapes === 1 ? "" : "s"}`;

  els.styleSwitcher.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.style === state.diagramStyle);
  });
  els.unlockDragToggle.checked = ui.unlockDragAll;

  els.printHeader.innerHTML = `
    <h1>${escapeHTML(layout.title)}</h1>
    <p>${escapeHTML([`${section.fullName} (${section.age})`, variant.label, state.districtName ? `${state.districtName} District` : "", state.countyName].filter(Boolean).join(" • "))}</p>
  `;

  els.diagramCanvas.innerHTML = renderUniformSvg(state, layout, {
    interactive: true,
    includeCallouts: state.showCallouts,
    selectedId: ui.selectedId,
    idPrefix: "live",
  });

  const svg = els.diagramCanvas.querySelector("svg");
  if (svg) {
    svg.classList.toggle("is-drag-unlocked", ui.unlockDragAll);
  }

  const notesParts = [];
  const parentNote = String(state.parentNote || "").trim();
  if (parentNote) {
    notesParts.push(`<div class="ug-parent-note-box">${escapeHTML(parentNote)}</div>`);
  }
  if (layout.footnotes.length) {
    notesParts.push(
      `<ul class="ug-footnotes">${layout.footnotes.map((fn) => `<li>${escapeHTML(fn)}</li>`).join("")}</ul>`,
    );
  }
  els.canvasNotes.innerHTML = notesParts.join("");
}

function findItemById(id) {
  if (!id) return null;
  const tape = layout.tapes.find((t) => t.id === id);
  if (tape) return { type: "tape", item: tape };
  const official = layout.officialBadges.find((b) => b.id === id);
  if (official) return { type: "official", item: official };
  const custom = layout.customBadges.find((b) => b.id === id);
  if (custom) return { type: "custom", item: custom };
  return null;
}

// ── Quick Inspector (below stage when a badge or tape is clicked) ────────────

function renderQuickInspector() {
  const found = findItemById(ui.selectedId);
  if (!found) {
    els.quickInspector.hidden = true;
    els.quickInspector.innerHTML = "";
    return;
  }

  els.quickInspector.hidden = false;
  const { type, item } = found;

  if (type === "tape") {
    els.quickInspector.innerHTML = `
      <div class="ug-inspector__head">
        <h3>Selected tape: ${escapeHTML(item.calloutLabel)} (“${escapeHTML(item.displayText)}”)</h3>
        <button type="button" class="ug-icon-btn" data-inspector-close aria-label="Close quick editor">${icon("x")}</button>
      </div>
      <div class="ug-inspector__actions">
        <button type="button" class="btn btn--primary btn--small" data-inspector-open="tapes">Edit in Tapes tab</button>
        <button type="button" class="btn btn--ghost btn--small" data-inspector-hide-tape="${escapeHTML(item.id)}">Hide tape</button>
      </div>
    `;
    return;
  }

  const dragHint =
    type === "custom" || ui.unlockDragAll
      ? "Drag directly on the uniform to reposition."
      : "Tick “Drag all” above the diagram to drag official badges freely.";

  els.quickInspector.innerHTML = `
    <div class="ug-inspector__head">
      <h3>${escapeHTML(item.label)} ${type === "custom" ? "(Custom)" : ""}</h3>
      <button type="button" class="ug-icon-btn" data-inspector-close aria-label="Close quick editor">${icon("x")}</button>
    </div>
    <p class="ug-group__hint" style="margin-bottom:10px">${escapeHTML(item.note || dragHint)}</p>
    <div class="ug-inspector__actions">
      <button type="button" class="btn btn--primary btn--small" data-inspector-open="${type === "custom" ? "custom" : "badges"}">Full badge editor</button>
      <button type="button" class="btn btn--ghost btn--small" data-inspector-toggle-badge="${escapeHTML(item.id)}" data-inspector-kind="${type}">
        ${item.visible ? "Hide badge" : "Show badge"}
      </button>
      <label class="btn btn--ghost btn--small" style="cursor:pointer">
        ${icon("camera")}
        ${item.imageDataUrl ? "Change image" : "Upload image"}
        <input type="file" accept="image/*" hidden data-quick-upload="${escapeHTML(item.id)}" data-quick-kind="${type}">
      </label>
      ${
        type === "custom"
          ? `<button type="button" class="btn btn--danger btn--small" data-inspector-delete-custom="${escapeHTML(item.id)}">Delete</button>`
          : item.hasOverride
            ? `<button type="button" class="btn btn--ghost btn--small" data-inspector-reset-official="${escapeHTML(item.id)}">Reset to official</button>`
            : ""
      }
    </div>
  `;
}

// ── Tab 1: Uniform & Group Setup ─────────────────────────────────────────────

function renderSetupPane() {
  const section = getSection(state.section);
  const variant = getVariant(state.section, state.variant);
  const currentNation = NATIONS.find((n) => n.id === state.nation) || NATIONS[0];
  const activeGarmentColor = state.garmentColorOverride || variant.garmentColor;

  els.panes.setup.innerHTML = `
    ${
      section.variants.length > 1
        ? `
      <div class="ug-group">
        <h3 class="ug-group__title">${escapeHTML(section.name)} uniform variant</h3>
        <div class="ug-chips">
          ${section.variants
            .map(
              (v) => `
            <button type="button" class="ug-chip${v.id === state.variant ? " is-active" : ""}" data-set-variant="${escapeHTML(v.id)}">
              ${escapeHTML(v.label)}
            </button>
          `,
            )
            .join("")}
        </div>
      </div>
    `
        : ""
    }

    <div class="ug-group">
      <h3 class="ug-group__title">Nation / country rules</h3>
      <div class="ug-chips">
        ${NATIONS.map(
          (n) => `
          <button type="button" class="ug-chip${n.id === state.nation ? " is-active" : ""}" data-set-nation="${escapeHTML(n.id)}">
            ${escapeHTML(n.short)}
          </button>
        `,
        ).join("")}
      </div>
      <p class="ug-group__hint">${escapeHTML(currentNation.description)}</p>
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Group &amp; guide details</h3>
      <div class="ug-field">
        <label for="ug-group-name">Group / Unit / Network name</label>
        <input class="input" id="ug-group-name" type="text" value="${escapeHTML(state.groupName)}" placeholder="e.g. 1st Boxford" data-bind="groupName">
      </div>
      <div class="ug-row">
        <div class="ug-field">
          <label for="ug-district-name">District (optional)</label>
          <input class="input" id="ug-district-name" type="text" value="${escapeHTML(state.districtName)}" placeholder="e.g. Colchester North" data-bind="districtName">
        </div>
        <div class="ug-field">
          <label for="ug-county-name">County / Area / Region</label>
          <input class="input" id="ug-county-name" type="text" value="${escapeHTML(state.countyName)}" placeholder="e.g. Essex" data-bind="countyName">
        </div>
      </div>
      <div class="ug-field">
        <label for="ug-guide-title">Custom guide heading (optional)</label>
        <input class="input" id="ug-guide-title" type="text" value="${escapeHTML(state.guideTitle)}" placeholder="${escapeHTML(layout.title)}" data-bind="guideTitle">
      </div>
      <div class="ug-field">
        <label for="ug-parent-note">Note for families &amp; carers (shown on PDF)</label>
        <textarea class="textarea" id="ug-parent-note" rows="3" placeholder="Sewing tips, uniform shop details or meeting night info..." data-bind="parentNote">${escapeHTML(state.parentNote)}</textarea>
      </div>
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Diagram style &amp; garment colour</h3>
      <div class="ug-chips">
        ${DIAGRAM_STYLES.map(
          (d) => `
          <button type="button" class="ug-chip${d.id === state.diagramStyle ? " is-active" : ""}" data-set-style="${escapeHTML(d.id)}">
            ${escapeHTML(d.label)}
          </button>
        `,
        ).join("")}
      </div>
      <div class="ug-field">
        <label for="ug-garment-color">Garment colour (full-colour mode)</label>
        <div class="ug-color-bar">
          <input class="ug-color-input" id="ug-garment-color" type="color" value="${escapeHTML(activeGarmentColor)}" data-garment-color>
          <input class="ug-hex-input" type="text" value="${escapeHTML(activeGarmentColor)}" aria-label="Garment hex colour" data-garment-hex>
          ${
            state.garmentColorOverride
              ? `<button type="button" class="btn btn--ghost btn--small" data-reset-garment-color>Official colour</button>`
              : `<span class="ug-group__hint">Official ${escapeHTML(section.name)} colour</span>`
          }
        </div>
      </div>
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Display &amp; PDF options</h3>
      <label class="ug-switch">
        <input type="checkbox" ${state.showNecker ? "checked" : ""} data-toggle-bool="showNecker">
        <span>Show neckerchief / scarf</span>
      </label>
      <label class="ug-switch">
        <input type="checkbox" ${state.showCallouts ? "checked" : ""} data-toggle-bool="showCallouts">
        <span>Show badge labels &amp; pointer lines</span>
      </label>
      ${
        section.hasBeltBuckles
          ? `
        <label class="ug-switch">
          <input type="checkbox" ${state.showBeltBuckles ? "checked" : ""} data-toggle-bool="showBeltBuckles">
          <span>Show Explorer &amp; Young Leader belt buckles</span>
        </label>
      `
          : ""
      }
      <label class="ug-switch">
        <input type="checkbox" ${state.includeSewingKeyInPdf ? "checked" : ""} data-toggle-bool="includeSewingKeyInPdf">
        <span>Include page 2 sewing &amp; placement key in PDF<small>Lists every visible badge with its sewing notes and necker summary.</small></span>
      </label>
    </div>
  `;
}

// ── Tab 2: Neckerchief / Scarf Designer ──────────────────────────────────────

function renderSwatchPicker(role, currentHex, swatches = NECKER_SWATCHES) {
  return `
    <div class="ug-color-bar">
      <input class="ug-color-input" type="color" value="${escapeHTML(currentHex)}" data-necker-color="${role}" aria-label="${role} colour picker">
      <input class="ug-hex-input" type="text" value="${escapeHTML(currentHex)}" data-necker-hex="${role}" aria-label="${role} hex colour">
    </div>
    <div class="ug-swatches">
      ${swatches
        .map(
          (sw) => `
        <button
          type="button"
          class="ug-swatch${sw.hex.toLowerCase() === currentHex.toLowerCase() ? " is-active" : ""}"
          style="--swatch-hex:${escapeHTML(sw.hex)}"
          title="${escapeHTML(sw.name)}"
          aria-label="${escapeHTML(sw.name)}"
          data-necker-swatch="${role}"
          data-hex="${escapeHTML(sw.hex)}"
        ></button>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderNeckerPane() {
  const n = state.necker;
  const activePattern = NECKER_PATTERNS.find((p) => p.id === n.pattern) || NECKER_PATTERNS[0];

  els.panes.necker.innerHTML = `
    <div class="ug-necker-hero">
      <div class="ug-necker-hero__preview" id="necker-live-preview">
        ${renderNeckerPreviewSvg(n, "hero")}
      </div>
      <div class="ug-necker-hero__meta">
        <strong>${escapeHTML(activePattern.label)} neckerchief</strong>
        <span>All colours and patterns update live on the uniform and in your exported PDF.</span>
      </div>
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Quick presets</h3>
      <div class="ug-chips">
        ${NECKER_PRESETS.map(
          (p) => `
          <button type="button" class="ug-chip" data-necker-preset="${escapeHTML(p.id)}">${escapeHTML(p.name)}</button>
        `,
        ).join("")}
      </div>
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Pattern</h3>
      <div class="ug-pattern-grid">
        ${NECKER_PATTERNS.map((pat) => {
          const preview = renderNeckerPreviewSvg({ ...n, pattern: pat.id }, `pat-${pat.id}`);
          return `
            <button type="button" class="ug-pattern-card${pat.id === n.pattern ? " is-active" : ""}" data-necker-pattern="${escapeHTML(pat.id)}">
              ${preview}
              <span>${escapeHTML(pat.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Main colour</h3>
      ${renderSwatchPicker("primary", n.primary)}
    </div>

    ${
      activePattern.usesSecondary
        ? `
      <div class="ug-group">
        <h3 class="ug-group__title">${n.pattern.includes("halved") || n.pattern === "quartered" ? "Second half colour" : n.pattern === "contrast-point" ? "Contrast point colour" : "Border / stripe colour"}</h3>
        ${renderSwatchPicker("secondary", n.secondary)}
      </div>
    `
        : ""
    }

    ${
      activePattern.usesTertiary
        ? `
      <div class="ug-group">
        <h3 class="ug-group__title">${n.pattern === "halved-border" ? "Outer border colour" : "Third / accent stripe colour"}</h3>
        ${renderSwatchPicker("tertiary", n.tertiary)}
      </div>
    `
        : ""
    }

    <div class="ug-group">
      <h3 class="ug-group__title">Woggle colour</h3>
      ${renderSwatchPicker("woggle", n.woggle, WOGGLE_SWATCHES)}
    </div>

    <div class="ug-group">
      <h3 class="ug-group__title">Where is your Group / Unit Badge worn?</h3>
      <div class="ug-chips">
        <button type="button" class="ug-chip${n.scarfBadgeMode === "scarf" ? " is-active" : ""}" data-scarf-badge-mode="scarf">On scarf</button>
        <button type="button" class="ug-chip${n.scarfBadgeMode === "sleeve" ? " is-active" : ""}" data-scarf-badge-mode="sleeve">On right sleeve</button>
        <button type="button" class="ug-chip${n.scarfBadgeMode === "both" ? " is-active" : ""}" data-scarf-badge-mode="both">Show both options</button>
      </div>
      <p class="ug-group__hint">You can still show, hide or upload an image for either badge in the Badges tab.</p>
    </div>
  `;
}

// ── Tab 3: Name Tapes (Primary + Custom Above / Below) ───────────────────────

function renderTapeEditorCard(tape, isPrimary) {
  const expanded = ui.expandedTapeId === tape.id;
  const displayTitle = isPrimary ? layout.section.tapeLabel : tape.calloutLabel || tape.text || "Custom tape";
  const posLabel = isPrimary ? "Main tape" : tape.position === "above" ? "Above main tape" : "Below main tape";
  const effectiveText = isPrimary ? (tape.text || state.groupName || layout.section.tapeLabel) : tape.text;

  return `
    <article class="ug-item-card${ui.selectedId === tape.id ? " is-selected" : ""}${!tape.visible ? " is-hidden" : ""}">
      <div class="ug-item-card__head">
        <span class="ug-item-card__swatch" style="background:${escapeHTML(tape.bg)};border-color:${escapeHTML(tape.border)}"></span>
        <div class="ug-item-card__info">
          <span class="ug-item-card__title">${escapeHTML(effectiveText || "(empty)")}</span>
          <span class="ug-item-card__sub">${escapeHTML(posLabel)} • ${escapeHTML(displayTitle)}</span>
        </div>
        <div class="ug-item-card__actions">
          <button type="button" class="ug-icon-btn${tape.visible ? " is-active" : ""}" data-tape-toggle="${escapeHTML(tape.id)}" title="${tape.visible ? "Hide tape" : "Show tape"}" aria-label="${tape.visible ? "Hide tape" : "Show tape"}">${icon("eye")}</button>
          <button type="button" class="ug-icon-btn${expanded ? " is-active" : ""}" data-tape-expand="${escapeHTML(tape.id)}" title="Edit tape" aria-label="Edit tape">${icon("pencil")}</button>
          ${
            !isPrimary
              ? `<button type="button" class="ug-icon-btn is-danger" data-tape-delete="${escapeHTML(tape.id)}" title="Delete tape" aria-label="Delete tape">${icon("x")}</button>`
              : ""
          }
        </div>
      </div>
      ${
        expanded
          ? `
        <div class="ug-item-card__body">
          <div class="ug-field">
            <label>Text on tape</label>
            <input class="input" type="text" value="${escapeHTML(tape.text || "")}" placeholder="${escapeHTML(isPrimary ? state.groupName || "1st Boxford" : "e.g. SEA SCOUTS")}" data-tape-field="text" data-tape-id="${escapeHTML(tape.id)}">
          </div>
          ${
            !isPrimary
              ? `
            <div class="ug-field">
              <label>Position relative to group tape</label>
              <div class="ug-chips">
                <button type="button" class="ug-chip${tape.position === "above" ? " is-active" : ""}" data-tape-pos="above" data-tape-id="${escapeHTML(tape.id)}">Above group tape</button>
                <button type="button" class="ug-chip${tape.position === "below" ? " is-active" : ""}" data-tape-pos="below" data-tape-id="${escapeHTML(tape.id)}">Below group tape</button>
              </div>
            </div>
          `
              : ""
          }
          <div class="ug-row">
            <div class="ug-field">
              <label>Callout label</label>
              <input class="input" type="text" value="${escapeHTML(tape.calloutLabel || "")}" placeholder="${escapeHTML(isPrimary ? layout.section.tapeLabel : "Custom Name Tape")}" data-tape-field="calloutLabel" data-tape-id="${escapeHTML(tape.id)}">
            </div>
            <div class="ug-field">
              <label>Tape shape</label>
              <div class="ug-chips">
                <button type="button" class="ug-chip${tape.shape === "curved" ? " is-active" : ""}" data-tape-shape="curved" data-tape-id="${escapeHTML(tape.id)}">Curved</button>
                <button type="button" class="ug-chip${tape.shape === "straight" ? " is-active" : ""}" data-tape-shape="straight" data-tape-id="${escapeHTML(tape.id)}">Straight</button>
              </div>
            </div>
          </div>
          <div class="ug-field">
            <label>Quick tape colours</label>
            <div class="ug-chips">
              ${TAPE_COLOR_PRESETS.map(
                (p, idx) => `
                <button type="button" class="ug-chip" data-tape-preset="${idx}" data-tape-id="${escapeHTML(tape.id)}">
                  <span style="width:11px;height:11px;border-radius:3px;background:${p.bg};border:1px solid ${p.border};display:inline-block"></span>
                  ${escapeHTML(p.name)}
                </button>
              `,
              ).join("")}
            </div>
          </div>
          <div class="ug-row ug-row--3">
            <div class="ug-field">
              <label>Background</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(tape.bg)}" data-tape-field="bg" data-tape-id="${escapeHTML(tape.id)}">
            </div>
            <div class="ug-field">
              <label>Text</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(tape.fg)}" data-tape-field="fg" data-tape-id="${escapeHTML(tape.id)}">
            </div>
            <div class="ug-field">
              <label>Border</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(tape.border)}" data-tape-field="border" data-tape-id="${escapeHTML(tape.id)}">
            </div>
          </div>
          <div class="ug-row">
            <label class="ug-switch">
              <input type="checkbox" ${tape.uppercase ? "checked" : ""} data-tape-bool="uppercase" data-tape-id="${escapeHTML(tape.id)}">
              <span>UPPERCASE text</span>
            </label>
            <label class="ug-switch">
              <input type="checkbox" ${tape.showCallout ? "checked" : ""} data-tape-bool="showCallout" data-tape-id="${escapeHTML(tape.id)}">
              <span>Show label line</span>
            </label>
          </div>
          <div class="ug-field">
            <label>Sewing note (for PDF key)</label>
            <input class="input" type="text" value="${escapeHTML(tape.note || "")}" data-tape-field="note" data-tape-id="${escapeHTML(tape.id)}">
          </div>
        </div>
      `
          : ""
      }
    </article>
  `;
}

function renderTapesPane() {
  const primary = { id: "primary-tape", ...state.tapes.primary };
  const above = state.tapes.custom.filter((t) => t.position === "above");
  const below = state.tapes.custom.filter((t) => t.position === "below");

  els.panes.tapes.innerHTML = `
    <div class="ug-group">
      <h3 class="ug-group__title">Sleeve name tapes</h3>
      <p class="ug-group__hint">Add extra name tapes above or below your main group tape (for example a District tape, Sea/Air Scouts tape, or Troop name). Lower sleeve badges shift down automatically so nothing overlaps.</p>
      <div class="ug-row">
        <button type="button" class="btn btn--primary btn--small" data-add-tape="above">
          ${icon("plus")} Add tape above
        </button>
        <button type="button" class="btn btn--ghost btn--small" data-add-tape="below">
          ${icon("plus")} Add tape below
        </button>
      </div>
    </div>

    <div class="ug-card-list">
      ${above.map((t) => renderTapeEditorCard(t, false)).join("")}
      ${renderTapeEditorCard(primary, true)}
      ${below.map((t) => renderTapeEditorCard(t, false)).join("")}
    </div>
  `;
}

// ── Tab 4: Official Badges (Show/Hide & Customise any official slot!) ────────

function renderOfficialBadgeCard(badge) {
  const expanded = ui.expandedOfficialId === badge.id;
  const isCluster = ["challenge-cluster", "activity-column", "joining-row"].includes(badge.shape);
  const maxCount = badge.shape === "challenge-cluster" ? 10 : 6;
  const swatchStyle = badge.imageDataUrl
    ? `background-image:url('${badge.imageDataUrl}')`
    : `background:${escapeHTML(badge.fill)};border-color:${escapeHTML(badge.stroke)}`;

  return `
    <article class="ug-item-card${ui.selectedId === badge.id ? " is-selected" : ""}${!badge.visible ? " is-hidden" : ""}">
      <div class="ug-item-card__head">
        <span class="ug-item-card__swatch" style="${swatchStyle}"></span>
        <div class="ug-item-card__info">
          <span class="ug-item-card__title">${escapeHTML(badge.label)}</span>
          <span class="ug-item-card__sub">${badge.hasOverride ? "Customised • " : ""}${badge.visible ? "Shown" : "Hidden"}</span>
        </div>
        <div class="ug-item-card__actions">
          <button type="button" class="ug-icon-btn${badge.visible ? " is-active" : ""}" data-ob-toggle="${escapeHTML(badge.id)}" title="${badge.visible ? "Hide badge" : "Show badge"}" aria-label="${badge.visible ? "Hide" : "Show"} ${escapeHTML(badge.label)}">${icon("eye")}</button>
          <button type="button" class="ug-icon-btn${expanded ? " is-active" : ""}" data-ob-expand="${escapeHTML(badge.id)}" title="Customise badge" aria-label="Customise ${escapeHTML(badge.label)}">${icon("pencil")}</button>
        </div>
      </div>
      ${
        expanded
          ? `
        <div class="ug-item-card__body">
          <div class="ug-field">
            <label>Badge label</label>
            <input class="input" type="text" value="${escapeHTML(badge.label)}" data-ob-field="label" data-ob-id="${escapeHTML(badge.id)}">
          </div>
          <div class="ug-field">
            <label>Sewing / placement note</label>
            <textarea class="textarea" rows="2" data-ob-field="note" data-ob-id="${escapeHTML(badge.id)}">${escapeHTML(badge.note || "")}</textarea>
          </div>
          ${
            isCluster
              ? `
            <div class="ug-field">
              <label>Number of badges shown</label>
              <div class="ug-range-row">
                <input type="range" min="1" max="${maxCount}" step="1" value="${badge.count || 3}" data-ob-num="count" data-ob-id="${escapeHTML(badge.id)}">
                <output>${badge.count || 3}</output>
              </div>
            </div>
          `
              : `
            <div class="ug-row">
              <div class="ug-field">
                <label>Shape</label>
                <select class="select" data-ob-field="shape" data-ob-id="${escapeHTML(badge.id)}">
                  ${BADGE_SHAPES.map((s) => `<option value="${s.id}"${s.id === badge.shape ? " selected" : ""}>${escapeHTML(s.label)}</option>`).join("")}
                </select>
              </div>
              <div class="ug-field">
                <label>Icon</label>
                <select class="select" data-ob-field="icon" data-ob-id="${escapeHTML(badge.id)}">
                  ${BADGE_ICONS.map((ic) => `<option value="${ic.id}"${ic.id === badge.icon ? " selected" : ""}>${escapeHTML(ic.label)}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="ug-field">
              <label>Short text / initials on badge (optional)</label>
              <input class="input" type="text" maxlength="8" value="${escapeHTML(badge.text || "")}" placeholder="e.g. ESSEX, CND" data-ob-field="text" data-ob-id="${escapeHTML(badge.id)}">
            </div>
            <div class="ug-field">
              <label>Custom artwork image (replaces icon/text)</label>
              <div class="ug-upload-row">
                ${badge.imageDataUrl ? `<img class="ug-upload-thumb" src="${badge.imageDataUrl}" alt="Uploaded badge preview">` : ""}
                <label class="btn btn--ghost btn--small" style="cursor:pointer">
                  ${icon("camera")} ${badge.imageDataUrl ? "Replace image" : "Upload badge image"}
                  <input type="file" accept="image/*" hidden data-ob-upload="${escapeHTML(badge.id)}">
                </label>
                ${badge.imageDataUrl ? `<button type="button" class="btn btn--ghost btn--small" data-ob-clear-img="${escapeHTML(badge.id)}">Remove</button>` : ""}
              </div>
            </div>
          `
          }
          <div class="ug-row ug-row--3">
            <div class="ug-field">
              <label>Fill</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(badge.fill)}" data-ob-field="fill" data-ob-id="${escapeHTML(badge.id)}">
            </div>
            <div class="ug-field">
              <label>Border</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(badge.stroke)}" data-ob-field="stroke" data-ob-id="${escapeHTML(badge.id)}">
            </div>
            <div class="ug-field">
              <label>Icon / text</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(badge.textColor || "#ffffff")}" data-ob-field="textColor" data-ob-id="${escapeHTML(badge.id)}">
            </div>
          </div>
          <div class="ug-row">
            <div class="ug-field">
              <label>Size</label>
              <div class="ug-range-row">
                <input type="range" min="0.6" max="1.8" step="0.05" value="${badge.scale}" data-ob-num="scale" data-ob-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.scale * 100)}%</output>
              </div>
            </div>
            <div class="ug-field">
              <label>Label line</label>
              <select class="select" data-ob-field="calloutSide" data-ob-id="${escapeHTML(badge.id)}">
                <option value="auto"${badge.calloutSide === "auto" ? " selected" : ""}>Auto side</option>
                <option value="left"${badge.calloutSide === "left" ? " selected" : ""}>Left margin</option>
                <option value="right"${badge.calloutSide === "right" ? " selected" : ""}>Right margin</option>
                <option value="none"${badge.calloutSide === "none" ? " selected" : ""}>Hide label line</option>
              </select>
            </div>
          </div>
          <div class="ug-row">
            <div class="ug-field">
              <label>Nudge X</label>
              <div class="ug-range-row">
                <input type="range" min="-90" max="90" step="1" value="${Math.round(badge.dx)}" data-ob-num="dx" data-ob-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.dx)}</output>
              </div>
            </div>
            <div class="ug-field">
              <label>Nudge Y</label>
              <div class="ug-range-row">
                <input type="range" min="-90" max="90" step="1" value="${Math.round(badge.dy)}" data-ob-num="dy" data-ob-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.dy)}</output>
              </div>
            </div>
          </div>
          ${
            badge.hasOverride
              ? `<button type="button" class="btn btn--ghost btn--small" data-ob-reset="${escapeHTML(badge.id)}">Reset this badge to official default</button>`
              : ""
          }
        </div>
      `
          : ""
      }
    </article>
  `;
}

function renderBadgesZonesHtml() {
  const q = ui.badgeSearch.trim().toLowerCase();
  const matches = (b) => !q || b.label.toLowerCase().includes(q) || (b.note || "").toLowerCase().includes(q);
  const html = ZONE_META.map((zone) => {
    const inZone = layout.officialBadges.filter((b) => b.zone === zone.id && matches(b));
    if (!inZone.length) return "";
    const visibleCount = inZone.filter((b) => b.visible).length;
    const shouldOpen = Boolean(q || inZone.some((b) => b.id === ui.expandedOfficialId) || zone.id === "right-sleeve");
    return `
      <details class="ug-zone-details"${shouldOpen ? " open" : ""}>
        <summary>
          <span>${escapeHTML(zone.label)}</span>
          <span>${visibleCount}/${inZone.length} shown</span>
        </summary>
        <div class="ug-zone-details__list">
          ${inZone.map(renderOfficialBadgeCard).join("")}
        </div>
      </details>
    `;
  }).join("");

  return html || `<p class="ug-group__hint">No official badges match “${escapeHTML(ui.badgeSearch)}”.</p>`;
}

function renderBadgesPane() {
  els.panes.badges.innerHTML = `
    <div class="ug-group">
      <h3 class="ug-group__title">Quick visibility presets</h3>
      <div class="ug-chips">
        <button type="button" class="ug-chip" data-badge-preset="official">Official default</button>
        <button type="button" class="ug-chip" data-badge-preset="essentials">New starter essentials</button>
        <button type="button" class="ug-chip" data-badge-preset="all">Show all</button>
        <button type="button" class="ug-chip" data-badge-preset="none">Hide all</button>
      </div>
      <div class="ug-field">
        <label for="ug-badge-search" class="sr-only">Filter badges</label>
        <input class="input" id="ug-badge-search" type="search" value="${escapeHTML(ui.badgeSearch)}" placeholder="Search badges (e.g. District, Challenge, Wales)…">
      </div>
      <p class="ug-group__hint">Click the pencil on any badge (like District or County) to rename it, recolour it or upload your actual badge image — your edits carry across every section.</p>
    </div>

    <div class="ug-card-list" id="badges-zones-list">
      ${renderBadgesZonesHtml()}
    </div>
  `;
}

// ── Tab 5: Custom Badges (Add infinitely many anywhere on the uniform!) ──────

function renderCustomBadgeCard(badge) {
  const expanded = ui.expandedCustomId === badge.id;
  const swatchStyle = badge.imageDataUrl
    ? `background-image:url('${badge.imageDataUrl}')`
    : `background:${escapeHTML(badge.fill)};border-color:${escapeHTML(badge.stroke)}`;

  return `
    <article class="ug-item-card${ui.selectedId === badge.id ? " is-selected" : ""}${!badge.visible ? " is-hidden" : ""}">
      <div class="ug-item-card__head">
        <span class="ug-item-card__swatch" style="${swatchStyle}"></span>
        <div class="ug-item-card__info">
          <span class="ug-item-card__title">${escapeHTML(badge.label)}</span>
          <span class="ug-item-card__sub">${escapeHTML(ZONES.find((z) => z.id === badge.zone)?.label || "Custom position")}</span>
        </div>
        <div class="ug-item-card__actions">
          <button type="button" class="ug-icon-btn${badge.visible ? " is-active" : ""}" data-cb-toggle="${escapeHTML(badge.id)}" title="${badge.visible ? "Hide" : "Show"}">${icon("eye")}</button>
          <button type="button" class="ug-icon-btn${expanded ? " is-active" : ""}" data-cb-expand="${escapeHTML(badge.id)}" title="Edit">${icon("pencil")}</button>
          <button type="button" class="ug-icon-btn" data-cb-dup="${escapeHTML(badge.id)}" title="Duplicate">${icon("copy")}</button>
          <button type="button" class="ug-icon-btn is-danger" data-cb-delete="${escapeHTML(badge.id)}" title="Delete">${icon("x")}</button>
        </div>
      </div>
      ${
        expanded
          ? `
        <div class="ug-item-card__body">
          <div class="ug-field">
            <label>Badge name / callout label</label>
            <input class="input" type="text" value="${escapeHTML(badge.label)}" data-cb-field="label" data-cb-id="${escapeHTML(badge.id)}">
          </div>
          <div class="ug-field">
            <label>Sewing / placement note</label>
            <textarea class="textarea" rows="2" data-cb-field="note" data-cb-id="${escapeHTML(badge.id)}">${escapeHTML(badge.note || "")}</textarea>
          </div>
          <div class="ug-field">
            <label>Quick placement zone (or drag on the diagram!)</label>
            <select class="select" data-cb-zone="${escapeHTML(badge.id)}">
              ${ZONES.map((z) => `<option value="${z.id}"${z.id === badge.zone ? " selected" : ""}>${escapeHTML(z.label)}</option>`).join("")}
            </select>
          </div>
          <div class="ug-row">
            <div class="ug-field">
              <label>Shape</label>
              <select class="select" data-cb-field="shape" data-cb-id="${escapeHTML(badge.id)}">
                ${BADGE_SHAPES.map((s) => `<option value="${s.id}"${s.id === badge.shape ? " selected" : ""}>${escapeHTML(s.label)}</option>`).join("")}
              </select>
            </div>
            <div class="ug-field">
              <label>Icon</label>
              <select class="select" data-cb-field="icon" data-cb-id="${escapeHTML(badge.id)}">
                ${BADGE_ICONS.map((ic) => `<option value="${ic.id}"${ic.id === badge.icon ? " selected" : ""}>${escapeHTML(ic.label)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="ug-field">
            <label>Short text / initials on badge (optional)</label>
            <input class="input" type="text" maxlength="8" value="${escapeHTML(badge.text || "")}" placeholder="e.g. 2026, DIST" data-cb-field="text" data-cb-id="${escapeHTML(badge.id)}">
          </div>
          <div class="ug-field">
            <label>Upload custom badge artwork (PNG / JPG / SVG)</label>
            <div class="ug-upload-row">
              ${badge.imageDataUrl ? `<img class="ug-upload-thumb" src="${badge.imageDataUrl}" alt="Custom badge preview">` : ""}
              <label class="btn btn--ghost btn--small" style="cursor:pointer">
                ${icon("camera")} ${badge.imageDataUrl ? "Replace image" : "Upload image"}
                <input type="file" accept="image/*" hidden data-cb-upload="${escapeHTML(badge.id)}">
              </label>
              ${badge.imageDataUrl ? `<button type="button" class="btn btn--ghost btn--small" data-cb-clear-img="${escapeHTML(badge.id)}">Remove</button>` : ""}
            </div>
          </div>
          <div class="ug-row ug-row--3">
            <div class="ug-field">
              <label>Fill</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(badge.fill)}" data-cb-field="fill" data-cb-id="${escapeHTML(badge.id)}">
            </div>
            <div class="ug-field">
              <label>Border</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(badge.stroke)}" data-cb-field="stroke" data-cb-id="${escapeHTML(badge.id)}">
            </div>
            <div class="ug-field">
              <label>Icon / text</label>
              <input class="ug-color-input" type="color" value="${escapeHTML(badge.textColor)}" data-cb-field="textColor" data-cb-id="${escapeHTML(badge.id)}">
            </div>
          </div>
          <div class="ug-row">
            <div class="ug-field">
              <label>Size</label>
              <div class="ug-range-row">
                <input type="range" min="0.5" max="2.2" step="0.05" value="${badge.scale}" data-cb-num="scale" data-cb-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.scale * 100)}%</output>
              </div>
            </div>
            <div class="ug-field">
              <label>Angle</label>
              <div class="ug-range-row">
                <input type="range" min="-45" max="45" step="1" value="${Math.round(badge.rotation)}" data-cb-num="rotation" data-cb-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.rotation)}°</output>
              </div>
            </div>
          </div>
          <div class="ug-row">
            <div class="ug-field">
              <label>Position X</label>
              <div class="ug-range-row">
                <input type="range" min="255" max="705" step="1" value="${Math.round(badge.x)}" data-cb-num="x" data-cb-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.x)}</output>
              </div>
            </div>
            <div class="ug-field">
              <label>Position Y</label>
              <div class="ug-range-row">
                <input type="range" min="100" max="610" step="1" value="${Math.round(badge.y)}" data-cb-num="y" data-cb-id="${escapeHTML(badge.id)}">
                <output>${Math.round(badge.y)}</output>
              </div>
            </div>
          </div>
          <div class="ug-field">
            <label>Label line side</label>
            <select class="select" data-cb-field="calloutSide" data-cb-id="${escapeHTML(badge.id)}">
              <option value="auto"${badge.calloutSide === "auto" ? " selected" : ""}>Auto side</option>
              <option value="left"${badge.calloutSide === "left" ? " selected" : ""}>Left margin</option>
              <option value="right"${badge.calloutSide === "right" ? " selected" : ""}>Right margin</option>
              <option value="none"${badge.calloutSide === "none" ? " selected" : ""}>Hide label line</option>
            </select>
          </div>
        </div>
      `
          : ""
      }
    </article>
  `;
}

function renderCustomPane() {
  els.panes.custom.innerHTML = `
    <div class="ug-group">
      <h3 class="ug-group__title">Add a custom badge</h3>
      <p class="ug-group__hint">Add district exclusive badges, camp badges, county awards or anything else your group wears. Drag them freely anywhere on the uniform!</p>
      <div class="ug-chips">
        ${CUSTOM_BADGE_TEMPLATES.map(
          (tpl) => `
          <button type="button" class="ug-chip" data-add-custom-tpl="${escapeHTML(tpl.id)}">
            ${icon("plus")} ${escapeHTML(tpl.name)}
          </button>
        `,
        ).join("")}
      </div>
    </div>

    ${
      state.customBadges.length
        ? `<div class="ug-card-list">${state.customBadges.map(renderCustomBadgeCard).join("")}</div>`
        : `<p class="ug-group__hint">No custom badges added yet. Pick a template above to drop one straight onto the uniform.</p>`
    }
  `;
}

function renderActiveTabPane() {
  Object.entries(els.panes).forEach(([tabId, paneEl]) => {
    paneEl.hidden = tabId !== ui.activeTab;
  });
  els.editorTabs.querySelectorAll("button").forEach((btn) => {
    const active = btn.dataset.tab === ui.activeTab;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  if (ui.activeTab === "setup") renderSetupPane();
  else if (ui.activeTab === "necker") renderNeckerPane();
  else if (ui.activeTab === "tapes") renderTapesPane();
  else if (ui.activeTab === "badges") renderBadgesPane();
  else if (ui.activeTab === "custom") renderCustomPane();
}

function switchTab(tabId) {
  ui.activeTab = tabId;
  renderActiveTabPane();
}

// ── Badge & Tape Helpers ─────────────────────────────────────────────────────

function getOrCreateOfficialOverride(id) {
  if (!state.badgeOverrides[id]) state.badgeOverrides[id] = {};
  return state.badgeOverrides[id];
}

function findTapeConfig(id) {
  if (id === "primary-tape") return state.tapes.primary;
  return state.tapes.custom.find((t) => t.id === id) || null;
}

function addCustomTape(position) {
  const tape = {
    id: uid("tape"),
    position,
    text: position === "above" ? "DISTRICT NAME" : "SEA SCOUTS",
    uppercase: true,
    visible: true,
    shape: "curved",
    bg: position === "above" ? "#0b2559" : "#590fa9",
    fg: "#ffffff",
    border: "#ffffff",
    calloutLabel: position === "above" ? "Extra Name Tape (Above)" : "Extra Name Tape (Below)",
    showCallout: true,
    note: `Custom name tape sewn ${position} the main group name tape on the right sleeve.`,
  };
  state.tapes.custom.push(tape);
  ui.expandedTapeId = tape.id;
  ui.selectedId = tape.id;
  refreshAll();
  setStatus(`Added custom tape ${position} the main group tape.`);
}

function addCustomBadgeFromTemplate(templateId) {
  const tpl = CUSTOM_BADGE_TEMPLATES.find((t) => t.id === templateId) || CUSTOM_BADGE_TEMPLATES[0];
  // Gently stagger multiple added badges so they never stack invisibly on top of each other.
  const offset = (state.customBadges.length % 5) * 14;
  const badge = {
    id: uid("custom"),
    label: tpl.label,
    note: tpl.note,
    zone: tpl.zone,
    shape: tpl.shape,
    x: clamp(tpl.x + (tpl.x < 480 ? -offset * 0.25 : offset * 0.25), 265, 695),
    y: clamp(tpl.y + offset, 120, 580),
    w: tpl.w,
    h: tpl.h,
    scale: 1,
    rotation: tpl.rotation,
    fill: tpl.fill,
    stroke: tpl.stroke,
    textColor: tpl.textColor,
    text: tpl.text,
    icon: tpl.icon,
    imageDataUrl: "",
    visible: true,
    calloutSide: tpl.calloutSide,
  };
  state.customBadges.push(badge);
  ui.expandedCustomId = badge.id;
  ui.selectedId = badge.id;
  refreshAll();
  setStatus(`Added “${badge.label}”. Drag it directly on the uniform to fine-tune its spot.`);
}

// ── Pointer Dragging & Canvas Interaction ────────────────────────────────────

function clientToSvgCoords(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  return {
    x: ((clientX - rect.left) / rect.width) * vb.width,
    y: ((clientY - rect.top) / rect.height) * vb.height,
  };
}

function setupCanvasInteractions() {
  // Hover synchronization between badges and callouts
  els.diagramCanvas.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-item-id]");
    if (!target || ui.drag) return;
    const id = target.dataset.itemId;
    const escapedId = globalThis.CSS?.escape ? CSS.escape(id) : id.replace(/["\\]/g, "\\$&");
    els.diagramCanvas.querySelectorAll(".is-hovered").forEach((el) => el.classList.remove("is-hovered"));
    els.diagramCanvas.querySelectorAll(`[data-item-id="${escapedId}"]`).forEach((el) => {
      el.classList.add("is-hovered");
    });
    const found = findItemById(id);
    if (found) {
      const label = found.type === "tape" ? `${found.item.calloutLabel} (“${found.item.displayText}”)` : found.item.label;
      els.hoverTip.textContent = `${label} — ${found.item.note || "Click to customise."}`;
    }
  });

  els.diagramCanvas.addEventListener("pointerout", (event) => {
    if (ui.drag) return;
    if (!event.relatedTarget || !els.diagramCanvas.contains(event.relatedTarget)) {
      els.diagramCanvas.querySelectorAll(".is-hovered").forEach((el) => el.classList.remove("is-hovered"));
      els.hoverTip.textContent = "Click any badge or name tape on the diagram to edit it. Drag custom badges to place them anywhere.";
    }
  });

  // Pointer down: select & optionally begin drag
  els.diagramCanvas.addEventListener("pointerdown", (event) => {
    const target = event.target.closest("[data-item-id]");
    if (!target) {
      if (ui.selectedId) {
        ui.selectedId = null;
        renderStage();
        renderQuickInspector();
      }
      return;
    }

    const id = target.dataset.itemId;
    const kind = target.dataset.itemKind;
    const svg = els.diagramCanvas.querySelector("svg");
    const canDrag =
      target.classList.contains("ug-badge") &&
      (kind === "custom" || (kind === "official" && ui.unlockDragAll));

    ui.selectedId = id;

    if (canDrag && svg) {
      event.preventDefault();
      const pt = clientToSvgCoords(svg, event.clientX, event.clientY);
      const found = findItemById(id);
      if (found) {
        ui.drag = {
          id,
          kind,
          startMouseX: pt.x,
          startMouseY: pt.y,
          startX: found.item.x,
          startY: found.item.y,
          startDx: found.item.dx || 0,
          startDy: found.item.dy || 0,
          moved: false,
        };
        svg.classList.add("is-dragging");
      }
    } else {
      renderStage();
      renderQuickInspector();
    }
  });

  window.addEventListener("pointermove", (event) => {
    if (!ui.drag) return;
    const svg = els.diagramCanvas.querySelector("svg");
    if (!svg) return;
    const pt = clientToSvgCoords(svg, event.clientX, event.clientY);
    const deltaX = pt.x - ui.drag.startMouseX;
    const deltaY = pt.y - ui.drag.startMouseY;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) ui.drag.moved = true;

    if (ui.drag.kind === "custom") {
      const badge = state.customBadges.find((b) => b.id === ui.drag.id);
      if (badge) {
        badge.x = Math.round(clamp(ui.drag.startX + deltaX, 255, 705));
        badge.y = Math.round(clamp(ui.drag.startY + deltaY, 100, 610));
        layout = resolveUniformLayout(state);
        renderStage();
        const freshSvg = els.diagramCanvas.querySelector("svg");
        if (freshSvg) freshSvg.classList.add("is-dragging");
      }
    } else if (ui.drag.kind === "official") {
      const ov = getOrCreateOfficialOverride(ui.drag.id);
      ov.dx = Math.round(clamp(ui.drag.startDx + deltaX, -140, 140));
      ov.dy = Math.round(clamp(ui.drag.startDy + deltaY, -140, 140));
      layout = resolveUniformLayout(state);
      renderStage();
      const freshSvg = els.diagramCanvas.querySelector("svg");
      if (freshSvg) freshSvg.classList.add("is-dragging");
    }
  });

  window.addEventListener("pointerup", () => {
    if (!ui.drag) return;
    const wasMoved = ui.drag.moved;
    ui.drag = null;
    const svg = els.diagramCanvas.querySelector("svg");
    if (svg) svg.classList.remove("is-dragging");
    saveState();
    renderStage();
    renderQuickInspector();
    if (wasMoved && (ui.activeTab === "custom" || ui.activeTab === "badges")) {
      renderActiveTabPane();
    }
  });

  // Keyboard selection on SVG badge elements
  els.diagramCanvas.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target.closest("[data-item-id]");
    if (!target) return;
    event.preventDefault();
    ui.selectedId = target.dataset.itemId;
    renderStage();
    renderQuickInspector();
  });
}

// ── Event Binding for Toolbar, Tabs, Panes & Inspector ───────────────────────

function bindEvents() {
  // Section pills
  els.sectionPills.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-section]");
    if (!btn) return;
    const nextSec = getSection(btn.dataset.section);
    state.section = nextSec.id;
    state.variant = nextSec.variants[0].id;
    ui.selectedId = null;
    refreshAll();
  });

  // Top diagram style quick switcher & drag toggle
  els.styleSwitcher.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-style]");
    if (!btn) return;
    state.diagramStyle = btn.dataset.style;
    refreshAll();
  });

  els.unlockDragToggle.addEventListener("change", () => {
    ui.unlockDragAll = els.unlockDragToggle.checked;
    renderStage();
    renderQuickInspector();
    setStatus(
      ui.unlockDragAll
        ? "Drag unlocked — you can now drag official badges as well as custom badges."
        : "Official badge positions locked again (custom badges remain draggable).",
    );
  });

  // Editor tabs
  els.editorTabs.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-tab]");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  // Close More menu on outside click
  document.addEventListener("click", (event) => {
    if (els.moreMenu?.open && !els.moreMenu.contains(event.target)) {
      els.moreMenu.open = false;
    }
  });

  // Setup pane interactions
  els.panes.setup.addEventListener("click", (event) => {
    const varBtn = event.target.closest("[data-set-variant]");
    if (varBtn) {
      state.variant = varBtn.dataset.setVariant;
      refreshAll();
      return;
    }
    const natBtn = event.target.closest("[data-set-nation]");
    if (natBtn) {
      state.nation = natBtn.dataset.setNation;
      // Clear explicit visibility overrides on nation-specific badges so the nation preset works cleanly!
      ["wales-right", "wales-left", "scotland", "ulster"].forEach((id) => {
        if (state.badgeOverrides[id]) delete state.badgeOverrides[id].visible;
      });
      refreshAll();
      return;
    }
    const styleBtn = event.target.closest("[data-set-style]");
    if (styleBtn) {
      state.diagramStyle = styleBtn.dataset.setStyle;
      refreshAll();
      return;
    }
    if (event.target.closest("[data-reset-garment-color]")) {
      state.garmentColorOverride = "";
      refreshAll();
    }
  });

  els.panes.setup.addEventListener("input", (event) => {
    const t = event.target;
    if (t.dataset.bind) {
      state[t.dataset.bind] = t.value;
      refreshDiagramOnly();
      return;
    }
    if (t.hasAttribute("data-garment-color")) {
      state.garmentColorOverride = t.value;
      const hexInput = els.panes.setup.querySelector("[data-garment-hex]");
      if (hexInput) hexInput.value = t.value;
      refreshDiagramOnly();
      return;
    }
    if (t.hasAttribute("data-garment-hex")) {
      if (/^#[0-9a-f]{6}$/i.test(t.value.trim())) {
        state.garmentColorOverride = t.value.trim();
        const colInput = els.panes.setup.querySelector("[data-garment-color]");
        if (colInput) colInput.value = state.garmentColorOverride;
        refreshDiagramOnly();
      }
    }
  });

  els.panes.setup.addEventListener("change", (event) => {
    const t = event.target;
    if (t.dataset.toggleBool) {
      state[t.dataset.toggleBool] = t.checked;
      refreshDiagramOnly();
    }
  });

  // Necker pane interactions
  els.panes.necker.addEventListener("click", (event) => {
    const presetBtn = event.target.closest("[data-necker-preset]");
    if (presetBtn) {
      const preset = NECKER_PRESETS.find((p) => p.id === presetBtn.dataset.neckerPreset);
      if (preset) {
        state.necker = {
          ...state.necker,
          pattern: preset.pattern,
          primary: preset.primary,
          secondary: preset.secondary,
          tertiary: preset.tertiary,
          woggle: preset.woggle,
        };
        state.showNecker = true;
        refreshAll();
      }
      return;
    }
    const patBtn = event.target.closest("[data-necker-pattern]");
    if (patBtn) {
      state.necker.pattern = patBtn.dataset.neckerPattern;
      state.showNecker = true;
      refreshAll();
      return;
    }
    const swBtn = event.target.closest("[data-necker-swatch]");
    if (swBtn) {
      state.necker[swBtn.dataset.neckerSwatch] = swBtn.dataset.hex;
      state.showNecker = true;
      refreshAll();
      return;
    }
    const modeBtn = event.target.closest("[data-scarf-badge-mode]");
    if (modeBtn) {
      state.necker.scarfBadgeMode = modeBtn.dataset.scarfBadgeMode;
      // Clear explicit visibility overrides on scarf/sleeve group badges so the switcher takes effect immediately.
      ["scarf-group-badge", "group-sleeve"].forEach((id) => {
        if (state.badgeOverrides[id]) delete state.badgeOverrides[id].visible;
      });
      refreshAll();
    }
  });

  els.panes.necker.addEventListener("input", (event) => {
    const t = event.target;
    const role = t.dataset.neckerColor || t.dataset.neckerHex;
    if (!role) return;
    const val = t.value.trim();
    if (!/^#[0-9a-f]{6}$/i.test(val)) return;
    state.necker[role] = val;
    state.showNecker = true;
    const sibling = els.panes.necker.querySelector(
      t.dataset.neckerColor ? `[data-necker-hex="${role}"]` : `[data-necker-color="${role}"]`,
    );
    if (sibling) sibling.value = val;
    const preview = els.panes.necker.querySelector("#necker-live-preview");
    if (preview) preview.innerHTML = renderNeckerPreviewSvg(state.necker, "hero");
    refreshDiagramOnly();
  });

  // Name tapes pane interactions
  els.panes.tapes.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-tape]");
    if (addBtn) {
      addCustomTape(addBtn.dataset.addTape);
      return;
    }
    const toggleBtn = event.target.closest("[data-tape-toggle]");
    if (toggleBtn) {
      const tape = findTapeConfig(toggleBtn.dataset.tapeToggle);
      if (tape) {
        tape.visible = !tape.visible;
        refreshAll();
      }
      return;
    }
    const expandBtn = event.target.closest("[data-tape-expand]");
    if (expandBtn) {
      const id = expandBtn.dataset.tapeExpand;
      ui.expandedTapeId = ui.expandedTapeId === id ? null : id;
      ui.selectedId = ui.expandedTapeId;
      refreshAll();
      return;
    }
    const delBtn = event.target.closest("[data-tape-delete]");
    if (delBtn) {
      const id = delBtn.dataset.tapeDelete;
      state.tapes.custom = state.tapes.custom.filter((t) => t.id !== id);
      if (ui.expandedTapeId === id) ui.expandedTapeId = null;
      if (ui.selectedId === id) ui.selectedId = null;
      refreshAll();
      return;
    }
    const posBtn = event.target.closest("[data-tape-pos]");
    if (posBtn) {
      const tape = findTapeConfig(posBtn.dataset.tapeId);
      if (tape) {
        tape.position = posBtn.dataset.tapePos;
        refreshAll();
      }
      return;
    }
    const shapeBtn = event.target.closest("[data-tape-shape]");
    if (shapeBtn) {
      const tape = findTapeConfig(shapeBtn.dataset.tapeId);
      if (tape) {
        tape.shape = shapeBtn.dataset.tapeShape;
        refreshAll();
      }
      return;
    }
    const presetBtn = event.target.closest("[data-tape-preset]");
    if (presetBtn) {
      const preset = TAPE_COLOR_PRESETS[Number(presetBtn.dataset.tapePreset)];
      const tape = findTapeConfig(presetBtn.dataset.tapeId);
      if (preset && tape) {
        tape.bg = preset.bg;
        tape.fg = preset.fg;
        tape.border = preset.border;
        refreshAll();
      }
    }
  });

  els.panes.tapes.addEventListener("input", (event) => {
    const t = event.target;
    if (t.dataset.tapeField && t.dataset.tapeId) {
      const tape = findTapeConfig(t.dataset.tapeId);
      if (tape) {
        tape[t.dataset.tapeField] = t.value;
        refreshDiagramOnly();
      }
    }
  });

  els.panes.tapes.addEventListener("change", (event) => {
    const t = event.target;
    if (t.dataset.tapeBool && t.dataset.tapeId) {
      const tape = findTapeConfig(t.dataset.tapeId);
      if (tape) {
        tape[t.dataset.tapeBool] = t.checked;
        refreshDiagramOnly();
      }
    }
  });

  // Official badges pane interactions
  els.panes.badges.addEventListener("click", (event) => {
    const presetBtn = event.target.closest("[data-badge-preset]");
    if (presetBtn) {
      const mode = presetBtn.dataset.badgePreset;
      layout.officialBadges.forEach((b) => {
        if (mode === "official") {
          if (state.badgeOverrides[b.id]) delete state.badgeOverrides[b.id].visible;
        } else if (mode === "essentials") {
          getOrCreateOfficialOverride(b.id).visible = Boolean(b.essential);
        } else if (mode === "all") {
          getOrCreateOfficialOverride(b.id).visible = true;
        } else if (mode === "none") {
          getOrCreateOfficialOverride(b.id).visible = false;
        }
      });
      refreshAll();
      return;
    }

    const toggleBtn = event.target.closest("[data-ob-toggle]");
    if (toggleBtn) {
      const id = toggleBtn.dataset.obToggle;
      const resolved = layout.officialBadges.find((b) => b.id === id);
      if (resolved) {
        getOrCreateOfficialOverride(id).visible = !resolved.visible;
        refreshAll();
      }
      return;
    }

    const expandBtn = event.target.closest("[data-ob-expand]");
    if (expandBtn) {
      const id = expandBtn.dataset.obExpand;
      ui.expandedOfficialId = ui.expandedOfficialId === id ? null : id;
      ui.selectedId = ui.expandedOfficialId;
      refreshAll();
      return;
    }

    const clearImg = event.target.closest("[data-ob-clear-img]");
    if (clearImg) {
      const id = clearImg.dataset.obClearImg;
      if (state.badgeOverrides[id]) {
        delete state.badgeOverrides[id].imageDataUrl;
        refreshAll();
      }
      return;
    }

    const resetBtn = event.target.closest("[data-ob-reset]");
    if (resetBtn) {
      delete state.badgeOverrides[resetBtn.dataset.obReset];
      refreshAll();
    }
  });

  els.panes.badges.addEventListener("input", (event) => {
    const t = event.target;
    if (t.id === "ug-badge-search") {
      ui.badgeSearch = t.value;
      const list = els.panes.badges.querySelector("#badges-zones-list");
      if (list) list.innerHTML = renderBadgesZonesHtml();
      return;
    }
    if (t.dataset.obField && t.dataset.obId) {
      getOrCreateOfficialOverride(t.dataset.obId)[t.dataset.obField] = t.value;
      refreshDiagramOnly();
      return;
    }
    if (t.dataset.obNum && t.dataset.obId) {
      const num = Number(t.value);
      getOrCreateOfficialOverride(t.dataset.obId)[t.dataset.obNum] = num;
      const out = t.parentElement?.querySelector("output");
      if (out) out.textContent = t.dataset.obNum === "scale" ? `${Math.round(num * 100)}%` : String(num);
      refreshDiagramOnly();
    }
  });

  els.panes.badges.addEventListener("change", async (event) => {
    const t = event.target;
    if (t.dataset.obUpload) {
      const id = t.dataset.obUpload;
      const file = t.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await readImageFileAsDataUrl(file);
        getOrCreateOfficialOverride(id).imageDataUrl = dataUrl;
        refreshAll();
        setStatus("Custom badge image uploaded.");
      } catch (err) {
        setStatus(err.message, true);
      }
      return;
    }
    if (t.dataset.obField && t.dataset.obId) {
      getOrCreateOfficialOverride(t.dataset.obId)[t.dataset.obField] = t.value;
      refreshDiagramOnly();
    }
  });

  // Custom badges pane interactions
  els.panes.custom.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-custom-tpl]");
    if (addBtn) {
      addCustomBadgeFromTemplate(addBtn.dataset.addCustomTpl);
      return;
    }
    const toggleBtn = event.target.closest("[data-cb-toggle]");
    if (toggleBtn) {
      const badge = state.customBadges.find((b) => b.id === toggleBtn.dataset.cbToggle);
      if (badge) {
        badge.visible = !badge.visible;
        refreshAll();
      }
      return;
    }
    const expandBtn = event.target.closest("[data-cb-expand]");
    if (expandBtn) {
      const id = expandBtn.dataset.cbExpand;
      ui.expandedCustomId = ui.expandedCustomId === id ? null : id;
      ui.selectedId = ui.expandedCustomId;
      refreshAll();
      return;
    }
    const dupBtn = event.target.closest("[data-cb-dup]");
    if (dupBtn) {
      const src = state.customBadges.find((b) => b.id === dupBtn.dataset.cbDup);
      if (src) {
        const copy = { ...structuredClone(src), id: uid("custom"), label: `${src.label} (copy)`, y: clamp(src.y + 26, 110, 595) };
        state.customBadges.push(copy);
        ui.expandedCustomId = copy.id;
        ui.selectedId = copy.id;
        refreshAll();
      }
      return;
    }
    const delBtn = event.target.closest("[data-cb-delete]");
    if (delBtn) {
      const id = delBtn.dataset.cbDelete;
      state.customBadges = state.customBadges.filter((b) => b.id !== id);
      if (ui.expandedCustomId === id) ui.expandedCustomId = null;
      if (ui.selectedId === id) ui.selectedId = null;
      refreshAll();
      return;
    }
    const clearImg = event.target.closest("[data-cb-clear-img]");
    if (clearImg) {
      const badge = state.customBadges.find((b) => b.id === clearImg.dataset.cbClearImg);
      if (badge) {
        badge.imageDataUrl = "";
        refreshAll();
      }
    }
  });

  els.panes.custom.addEventListener("input", (event) => {
    const t = event.target;
    if (t.dataset.cbField && t.dataset.cbId) {
      const badge = state.customBadges.find((b) => b.id === t.dataset.cbId);
      if (badge) {
        badge[t.dataset.cbField] = t.value;
        refreshDiagramOnly();
      }
      return;
    }
    if (t.dataset.cbNum && t.dataset.cbId) {
      const badge = state.customBadges.find((b) => b.id === t.dataset.cbId);
      if (badge) {
        const num = Number(t.value);
        badge[t.dataset.cbNum] = num;
        const out = t.parentElement?.querySelector("output");
        if (out) {
          out.textContent =
            t.dataset.cbNum === "scale"
              ? `${Math.round(num * 100)}%`
              : t.dataset.cbNum === "rotation"
                ? `${Math.round(num)}°`
                : String(Math.round(num));
        }
        refreshDiagramOnly();
      }
    }
  });

  els.panes.custom.addEventListener("change", async (event) => {
    const t = event.target;
    if (t.dataset.cbZone) {
      const badge = state.customBadges.find((b) => b.id === t.dataset.cbZone);
      const zone = ZONES.find((z) => z.id === t.value);
      if (badge && zone) {
        badge.zone = zone.id;
        badge.x = zone.defaultX;
        badge.y = zone.defaultY;
        badge.rotation = zone.defaultRotation;
        badge.calloutSide = zone.defaultSide;
        refreshAll();
      }
      return;
    }
    if (t.dataset.cbUpload) {
      const badge = state.customBadges.find((b) => b.id === t.dataset.cbUpload);
      const file = t.files?.[0];
      if (!badge || !file) return;
      try {
        badge.imageDataUrl = await readImageFileAsDataUrl(file);
        refreshAll();
        setStatus("Custom badge image uploaded.");
      } catch (err) {
        setStatus(err.message, true);
      }
      return;
    }
    if (t.dataset.cbField && t.dataset.cbId) {
      const badge = state.customBadges.find((b) => b.id === t.dataset.cbId);
      if (badge) {
        badge[t.dataset.cbField] = t.value;
        refreshDiagramOnly();
      }
    }
  });

  // Quick inspector actions
  els.quickInspector.addEventListener("click", (event) => {
    if (event.target.closest("[data-inspector-close]")) {
      ui.selectedId = null;
      renderStage();
      renderQuickInspector();
      return;
    }
    const openBtn = event.target.closest("[data-inspector-open]");
    if (openBtn) {
      const tab = openBtn.dataset.inspectorOpen;
      if (tab === "badges") ui.expandedOfficialId = ui.selectedId;
      else if (tab === "custom") ui.expandedCustomId = ui.selectedId;
      else if (tab === "tapes") ui.expandedTapeId = ui.selectedId;
      switchTab(tab);
      return;
    }
    const hideTape = event.target.closest("[data-inspector-hide-tape]");
    if (hideTape) {
      const tape = findTapeConfig(hideTape.dataset.inspectorHideTape);
      if (tape) {
        tape.visible = false;
        ui.selectedId = null;
        refreshAll();
      }
      return;
    }
    const toggleBadge = event.target.closest("[data-inspector-toggle-badge]");
    if (toggleBadge) {
      const id = toggleBadge.dataset.inspectorToggleBadge;
      const kind = toggleBadge.dataset.inspectorKind;
      if (kind === "custom") {
        const b = state.customBadges.find((c) => c.id === id);
        if (b) b.visible = !b.visible;
      } else {
        const b = layout.officialBadges.find((o) => o.id === id);
        if (b) getOrCreateOfficialOverride(id).visible = !b.visible;
      }
      refreshAll();
      return;
    }
    const delCustom = event.target.closest("[data-inspector-delete-custom]");
    if (delCustom) {
      const id = delCustom.dataset.inspectorDeleteCustom;
      state.customBadges = state.customBadges.filter((b) => b.id !== id);
      ui.selectedId = null;
      refreshAll();
      return;
    }
    const resetOff = event.target.closest("[data-inspector-reset-official]");
    if (resetOff) {
      delete state.badgeOverrides[resetOff.dataset.inspectorResetOfficial];
      refreshAll();
    }
  });

  els.quickInspector.addEventListener("change", async (event) => {
    const t = event.target;
    if (!t.dataset.quickUpload) return;
    const id = t.dataset.quickUpload;
    const kind = t.dataset.quickKind;
    const file = t.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      if (kind === "custom") {
        const b = state.customBadges.find((c) => c.id === id);
        if (b) b.imageDataUrl = dataUrl;
      } else {
        getOrCreateOfficialOverride(id).imageDataUrl = dataUrl;
      }
      refreshAll();
      setStatus("Badge image applied.");
    } catch (err) {
      setStatus(err.message, true);
    }
  });

  // Export & Action buttons
  els.btnPdf.addEventListener("click", async () => {
    const original = els.btnPdf.innerHTML;
    els.btnPdf.disabled = true;
    els.btnPdf.textContent = "Building PDF…";
    setStatus("Preparing your print-ready A4 PDF…");
    try {
      await downloadUniformPdf(state);
      setStatus("Downloaded your printable A4 PDF.");
    } catch (err) {
      setStatus(err.message || "Could not generate the PDF. Try Print instead.", true);
    } finally {
      els.btnPdf.disabled = false;
      els.btnPdf.innerHTML = original;
    }
  });

  els.btnPrint.addEventListener("click", () => {
    window.print();
  });

  els.btnPng.addEventListener("click", async () => {
    els.moreMenu.open = false;
    setStatus("Rendering high-resolution PNG…");
    try {
      const assets = await loadUniformPdfAssets().catch(() => null);
      const svgH = layout.showBeltBuckles ? CANVAS.height : 690;
      const svg = renderUniformSvg(state, layout, {
        interactive: false,
        includeCallouts: state.showCallouts,
        includeHeader: true,
        idPrefix: "pngug",
        background: "#ffffff",
        embedFontCss: buildEmbeddedFontCss(assets),
      });
      const dataUrl = await svgStringToPngDataUrl(svg, CANVAS.width, svgH, 3);
      triggerDownload(dataUrl, `${slugify(layout.title)}-uniform-guide.png`);
      setStatus("Downloaded high-resolution PNG image.");
    } catch (err) {
      setStatus(err.message || "Could not export PNG.", true);
    }
  });

  els.btnSvg.addEventListener("click", () => {
    els.moreMenu.open = false;
    const svg = renderUniformSvg(state, layout, {
      interactive: false,
      includeCallouts: state.showCallouts,
      includeHeader: true,
      idPrefix: "svgug",
      background: "#ffffff",
    });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, `${slugify(layout.title)}-uniform-guide.svg`);
    setStatus("Downloaded scalable SVG vector file.");
  });

  els.btnExportJson.addEventListener("click", () => {
    els.moreMenu.open = false;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
    triggerDownload(blob, `${slugify(state.groupName || "scout-group")}-uniform-config.json`);
    setStatus("Saved your group uniform configuration (.json).");
  });

  els.btnImportJson.addEventListener("click", () => {
    els.moreMenu.open = false;
    els.importJsonInput.value = "";
    els.importJsonInput.click();
  });

  els.importJsonInput.addEventListener("change", async () => {
    const file = els.importJsonInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      state = normaliseState(parsed);
      ui.selectedId = null;
      refreshAll();
      setStatus(`Loaded group configuration for ${state.groupName || "your group"}.`);
    } catch {
      setStatus("Could not load that JSON file — check it was saved from this tool.", true);
    }
  });

  els.btnResetAll.addEventListener("click", async () => {
    els.moreMenu.open = false;
    const ok = await confirmDialog({
      title: "Reset uniform guide?",
      message: "This clears your group name, necker design, extra name tapes, custom badges and uploaded badge images back to defaults.",
      confirmLabel: "Reset everything",
      cancelLabel: "Keep my setup",
      tone: "danger",
    });
    if (!ok) return;
    state = createDefaultState();
    ui.selectedId = null;
    ui.expandedOfficialId = null;
    ui.expandedCustomId = null;
    ui.expandedTapeId = "primary-tape";
    refreshAll();
    setStatus("Reset back to default settings.");
  });
}

// ── Boot ─────────────────────────────────────────────────────────────────────

initSite();
setupCanvasInteractions();
bindEvents();
refreshAll();
