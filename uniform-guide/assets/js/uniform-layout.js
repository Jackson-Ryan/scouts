// Deterministic layout engine: resolves badge visibility/overrides, dynamic sleeve name-tape stacking,
// Northern Ireland layout rules, footnotes and collision-free callout leader lines.
// Pure ES module (Node-safe, zero DOM dependencies).

import {
  CANVAS,
  FOOTNOTE_NI,
  FOOTNOTE_RAF,
  FOOTNOTE_RN,
  getOfficialBadges,
  getSection,
  getVariant,
  resolveGuideTitle,
} from "./uniform-data.js";

const LEFT_LABEL_X = 222;
const RIGHT_LABEL_X = 738;
const LEFT_ELBOW_X = 240;
const RIGHT_ELBOW_X = 720;
const CALLOUT_MIN_Y = 58;
const CALLOUT_MAX_Y = 668;
const LINE_HEIGHT = 13.5;
const LABEL_GAP = 10;

// Sleeve axis slope (viewer's left sleeve angles gently left as y increases).
const SLEEVE_DX_PER_DY = -0.22;

export function wrapLabel(text, maxChars = 27) {
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (!clean) return [];
  const words = clean.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Computes the resolved nametape stack (above -> primary -> below) along the top of the right sleeve,
 * and returns the vertical shift needed so lower right-sleeve badges never overlap custom tapes.
 */
function resolveNameTapes(state, section) {
  const above = (state.tapes?.custom || []).filter((t) => t.position === "above" && t.visible);
  const below = (state.tapes?.custom || []).filter((t) => t.position === "below" && t.visible);
  const primary = state.tapes?.primary || {};

  const ordered = [];
  above.forEach((tape) => {
    ordered.push({
      id: tape.id,
      kind: "custom-tape",
      position: "above",
      rawText: tape.text,
      displayText: tape.uppercase ? String(tape.text || "").toUpperCase() : String(tape.text || ""),
      shape: tape.shape,
      bg: tape.bg,
      fg: tape.fg,
      border: tape.border,
      calloutLabel: tape.calloutLabel || tape.text || "Custom Name Tape",
      showCallout: tape.showCallout !== false,
      note: tape.note || "Custom name tape sewn above the main name tape on the right sleeve.",
      visible: true,
    });
  });

  if (primary.visible !== false) {
    const rawText = String(primary.text || "").trim() || String(state.groupName || "").trim() || section.tapeLabel;
    ordered.push({
      id: "primary-tape",
      kind: "primary-tape",
      position: "primary",
      rawText,
      displayText: primary.uppercase !== false ? rawText.toUpperCase() : rawText,
      shape: primary.shape || "curved",
      bg: primary.bg || "#14532d",
      fg: primary.fg || "#ffffff",
      border: primary.border || "#ffffff",
      calloutLabel: String(primary.calloutLabel || "").trim() || section.tapeLabel,
      showCallout: primary.showCallout !== false,
      note: primary.note || "Sew centred at the top of the right sleeve, just below the shoulder seam.",
      visible: true,
    });
  }

  below.forEach((tape) => {
    ordered.push({
      id: tape.id,
      kind: "custom-tape",
      position: "below",
      rawText: tape.text,
      displayText: tape.uppercase ? String(tape.text || "").toUpperCase() : String(tape.text || ""),
      shape: tape.shape,
      bg: tape.bg,
      fg: tape.fg,
      border: tape.border,
      calloutLabel: tape.calloutLabel || tape.text || "Custom Name Tape",
      showCallout: tape.showCallout !== false,
      note: tape.note || "Custom name tape sewn below the main name tape on the right sleeve.",
      visible: true,
    });
  });

  // Base top of sleeve tape stack starts at (337, 214) and steps smoothly down the right sleeve.
  const stepY = 17;
  const startY = ordered.length > 1 ? 208 : 216;
  const startX = ordered.length > 1 ? 338 : 336;

  const placed = ordered.map((tape, index) => {
    const dy = index * stepY;
    const y = startY + dy;
    const x = startX + dy * SLEEVE_DX_PER_DY;
    return {
      ...tape,
      x,
      y,
      w: 54,
      h: 14,
      rotation: -12,
      calloutSide: "left",
      zone: "right-sleeve",
    };
  });

  const lastTapeBottom = placed.length > 0 ? placed[placed.length - 1].y + 9 : 222;
  const extraSleeveShiftY = Math.max(0, lastTapeBottom - 228);

  return { tapes: placed, extraSleeveShiftY };
}

/**
 * Resolves all visible and hidden badges (official + custom), applying overrides,
 * dynamic District/County name enrichment, scarf-vs-sleeve mode, and tape reflow.
 */
function resolveBadges(state, section, variant, extraSleeveShiftY) {
  const officialDefs = getOfficialBadges(section.id, variant.id, state.nation);
  const overrides = state.badgeOverrides || {};
  const scarfMode = state.necker?.scarfBadgeMode || "both";
  const districtName = String(state.districtName || "").trim();
  const countyName = String(state.countyName || "").trim();

  const official = officialDefs.map((def) => {
    const ov = overrides[def.id] || {};
    let visible = ov.visible !== undefined ? Boolean(ov.visible) : def.defaultVisible;

    // Respect scarf vs sleeve Group Badge convenience mode unless explicitly overridden on the badge.
    if (ov.visible === undefined) {
      if (def.id === "scarf-group-badge" && (!state.showNecker || scarfMode === "sleeve")) {
        visible = false;
      }
      if (def.id === "group-sleeve" && scarfMode === "scarf") {
        visible = false;
      }
    }

    // Dynamic District / County friendly naming when user entered them (unless badge label itself was overridden).
    let defaultLabel = def.label;
    if (def.id === "district" && districtName) {
      defaultLabel = `${districtName} District Badge`;
    } else if (def.id === "county" && countyName) {
      defaultLabel = `${countyName} County/Area Badge`;
    }

    const shiftY = def.sleeveStack ? extraSleeveShiftY : 0;
    const shiftX = def.sleeveStack ? extraSleeveShiftY * SLEEVE_DX_PER_DY : 0;

    const dx = Number.isFinite(Number(ov.dx)) ? Number(ov.dx) : 0;
    const dy = Number.isFinite(Number(ov.dy)) ? Number(ov.dy) : 0;
    const scale = Number.isFinite(Number(ov.scale)) ? Math.max(0.5, Math.min(2.2, Number(ov.scale))) : 1;

    return {
      ...def,
      kind: "official",
      visible,
      label: ov.label !== undefined && ov.label !== "" ? String(ov.label) : defaultLabel,
      note: ov.note !== undefined ? String(ov.note) : def.note,
      shape: ov.shape || def.shape,
      fill: ov.fill || def.fill,
      stroke: ov.stroke || def.stroke,
      textColor: ov.textColor || def.textColor || "#ffffff",
      text: ov.text !== undefined ? String(ov.text) : def.text || "",
      icon: ov.icon !== undefined ? ov.icon : def.icon || "none",
      artworkPath: ov.artworkPath !== undefined ? String(ov.artworkPath || "") : def.artworkPath || "",
      artworkItems: Array.isArray(ov.artworkItems)
        ? ov.artworkItems.map((item) => String(item || ""))
        : Array.isArray(def.artworkItems)
          ? [...def.artworkItems]
          : [],
      imageDataUrl: typeof ov.imageDataUrl === "string" ? ov.imageDataUrl : "",
      count: Number.isFinite(Number(ov.count)) ? Math.max(1, Math.min(12, Number(ov.count))) : def.count,
      calloutSide: ov.calloutSide || def.calloutSide || "auto",
      x: def.x + shiftX + dx,
      y: def.y + shiftY + dy,
      baseX: def.x + shiftX,
      baseY: def.y + shiftY,
      dx,
      dy,
      scale,
      rotation: ov.rotation !== undefined && Number.isFinite(Number(ov.rotation)) ? Number(ov.rotation) : def.rotation,
      hasOverride: Object.keys(ov).length > 0,
    };
  });

  const custom = (state.customBadges || []).map((badge) => {
    const scale = Number.isFinite(Number(badge.scale)) ? Math.max(0.5, Math.min(2.5, Number(badge.scale))) : 1;
    return {
      ...badge,
      official: false,
      kind: "custom",
      scale,
      baseX: badge.x,
      baseY: badge.y,
      dx: 0,
      dy: 0,
    };
  });

  return { official, custom };
}

/**
 * Builds collision-free left and right callout labels with smooth elbow leader lines.
 */
function layoutCalloutSide(items, side) {
  if (!items.length) return [];

  // Sort items so leader lines stay orderly and avoid unnecessary crossings:
  // On left side, items closer to centre at the top (shoulders/upper chest) sort cleanly by y then x.
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.targetY - b.targetY) > 6) return a.targetY - b.targetY;
    return side === "left" ? b.targetX - a.targetX : a.targetX - b.targetX;
  });

  const nodes = sorted.map((item) => {
    const lines = wrapLabel(item.label, 27);
    const height = Math.max(LINE_HEIGHT, lines.length * LINE_HEIGHT);
    return {
      ...item,
      side,
      lines,
      height,
      y: Math.max(CALLOUT_MIN_Y + height / 2, Math.min(CALLOUT_MAX_Y - height / 2, item.targetY)),
    };
  });

  // Forward pass: push overlapping labels downward.
  for (let i = 1; i < nodes.length; i += 1) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const minCenterY = prev.y + prev.height / 2 + LABEL_GAP + curr.height / 2;
    if (curr.y < minCenterY) curr.y = minCenterY;
  }

  // Clamp bottom and push upward if we overflowed CALLOUT_MAX_Y.
  const last = nodes[nodes.length - 1];
  const maxAllowed = CALLOUT_MAX_Y - last.height / 2;
  if (last.y > maxAllowed) {
    last.y = maxAllowed;
    for (let i = nodes.length - 2; i >= 0; i -= 1) {
      const next = nodes[i + 1];
      const curr = nodes[i];
      const maxCenterY = next.y - next.height / 2 - LABEL_GAP - curr.height / 2;
      if (curr.y > maxCenterY) curr.y = maxCenterY;
    }
  }

  // Final guard so top never goes above CALLOUT_MIN_Y even with huge badge counts.
  const first = nodes[0];
  const minAllowed = CALLOUT_MIN_Y + first.height / 2;
  if (first.y < minAllowed) {
    const overflowTop = minAllowed - first.y;
    nodes.forEach((n) => {
      n.y += overflowTop;
    });
  }

  // Slight horizontal stagger for elbows when multiple lines bundle closely.
  const labelX = side === "left" ? LEFT_LABEL_X : RIGHT_LABEL_X;
  const baseElbowX = side === "left" ? LEFT_ELBOW_X : RIGHT_ELBOW_X;

  return nodes.map((node, index) => {
    // Keep elbow nicely aligned with a tiny outward offset for steep lines so lines stay crisp.
    const dy = Math.abs(node.targetY - node.y);
    const extraElbow = Math.min(18, dy * 0.08);
    const elbowX = side === "left" ? baseElbowX + extraElbow : baseElbowX - extraElbow;
    const tickStartX = side === "left" ? labelX + 6 : labelX - 6;

    return {
      id: node.id,
      kind: node.kind,
      side,
      label: node.label,
      lines: node.lines,
      height: node.height,
      labelX,
      labelY: node.y,
      tickStartX,
      elbowX,
      elbowY: node.y,
      targetX: node.targetX,
      targetY: node.targetY,
      index,
    };
  });
}

/**
 * Main layout resolver used identically by both the interactive SVG renderer and the A4 PDF exporter.
 */
export function resolveUniformLayout(state) {
  const section = getSection(state.section);
  const variant = getVariant(section.id, state.variant);
  const { tapes, extraSleeveShiftY } = resolveNameTapes(state, section);
  const { official, custom } = resolveBadges(state, section, variant, extraSleeveShiftY);

  const visibleOfficial = official.filter((b) => b.visible);
  const visibleCustom = custom.filter((b) => b.visible);
  const allVisibleBadges = [...visibleOfficial, ...visibleCustom];

  const leftTargets = [];
  const rightTargets = [];

  if (state.showCallouts !== false) {
    // Name tape callouts
    tapes.forEach((tape) => {
      if (!tape.showCallout) return;
      leftTargets.push({
        id: tape.id,
        kind: tape.kind,
        label: tape.calloutLabel,
        targetX: tape.x,
        targetY: tape.y,
      });
    });

    // Official & custom badge callouts
    allVisibleBadges.forEach((badge) => {
      if (badge.calloutSide === "none") return;
      const side =
        badge.calloutSide === "left" || badge.calloutSide === "right"
          ? badge.calloutSide
          : badge.x < CANVAS.centerX
            ? "left"
            : "right";

      // For multi-badge clusters, anchor dot nicely onto a prominent sub-badge.
      let targetX = badge.x;
      let targetY = badge.y;
      if (badge.shape === "challenge-cluster") {
        targetX = badge.x - 10;
        targetY = badge.y + 8;
      } else if (badge.shape === "activity-column") {
        targetX = badge.x + 2;
        targetY = badge.y - 4;
      } else if (badge.shape === "joining-row") {
        targetX = badge.x + 12;
        targetY = badge.y;
      }

      const item = {
        id: badge.id,
        kind: badge.kind,
        label: badge.label,
        targetX,
        targetY,
      };
      if (side === "left") leftTargets.push(item);
      else rightTargets.push(item);
    });
  }

  const leftCallouts = layoutCalloutSide(leftTargets, "left");
  const rightCallouts = layoutCalloutSide(rightTargets, "right");
  const callouts = [...leftCallouts, ...rightCallouts];

  // Collect active official footnotes
  const footnotes = [];
  if (visibleOfficial.some((b) => b.asterisk === "rn")) footnotes.push(FOOTNOTE_RN);
  if (visibleOfficial.some((b) => b.asterisk === "raf")) footnotes.push(FOOTNOTE_RAF);
  if (state.nation === "all-uk" || state.nation === "ni") footnotes.push(FOOTNOTE_NI);

  const garmentColor = state.garmentColorOverride || variant.garmentColor;
  const lineColor = variant.lineColor;

  return {
    section,
    variant,
    title: resolveGuideTitle(state),
    garmentColor,
    lineColor,
    tapes,
    officialBadges: official,
    customBadges: custom,
    visibleBadges: allVisibleBadges,
    callouts,
    leftCallouts,
    rightCallouts,
    footnotes,
    showBeltBuckles: Boolean(section.hasBeltBuckles && state.showBeltBuckles !== false),
    counts: {
      visibleBadges: allVisibleBadges.length,
      totalOfficial: official.length,
      visibleOfficial: visibleOfficial.length,
      customBadges: visibleCustom.length,
      tapes: tapes.length,
    },
  };
}

/**
 * Collects every unique local official badge SVG path referenced by visible badges in a resolved layout.
 */
export function collectArtworkPaths(layout) {
  const paths = new Set();
  for (const badge of layout?.visibleBadges || []) {
    if (badge.artworkPath) paths.add(badge.artworkPath);
    if (Array.isArray(badge.artworkItems)) {
      for (const itemPath of badge.artworkItems) {
        if (itemPath) paths.add(itemPath);
      }
    }
  }
  return [...paths];
}
