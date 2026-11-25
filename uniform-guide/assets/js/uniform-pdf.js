// Branded A4 PDF builder for the Uniform & Badge Placement Guide.
// Uses vendored jsPDF (MIT) + embedded Nunito Sans fonts shared from kit-list/assets/.
// Draws crisp vector callout leader lines and selectable Nunito Sans labels aligned 1:1
// with the high-resolution uniform/necker/badge artwork layer (or clean vector fallback in Node).

import { CANVAS, NECKER_PATTERNS, slugify } from "./uniform-data.js";
import { collectArtworkPaths, resolveUniformLayout } from "./uniform-layout.js";
import { renderUniformSvg } from "./uniform-svg.js";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 36;
const CONTENT_WIDTH = A4.width - MARGIN * 2;
const FONT = "NunitoSans";
const FONT_TEXT = "NunitoSansText";

const COLOURS = {
  purple: [89, 15, 169],
  purpleDark: [64, 11, 122],
  purpleSoft: [243, 237, 251],
  yellow: [255, 230, 39],
  ink: [26, 26, 26],
  grey: [95, 95, 95],
  greyLight: [115, 115, 115],
  line: [215, 220, 228],
  lineSoft: [236, 238, 242],
  white: [255, 255, 255],
};

function hexToRgbArray(hex, fallback = COLOURS.purple) {
  const clean = String(hex || "").replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return fallback;
}

function fontBase64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function fetchFontBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load the brand font (${response.status}).`);
  return fontBase64FromArrayBuffer(await response.arrayBuffer());
}

export async function svgStringToPngDataUrl(svgString, width, height, scale = 3) {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Could not render diagram image for export."));
      image.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function svgUrlToPngDataUrl(url, width, height) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load logo (${response.status}).`);
  const svg = await response.text();
  return svgStringToPngDataUrl(svg, width, height, 3);
}

let cachedAssetsPromise = null;
const artworkDataUrlCache = new Map();

export async function preloadArtworkDataUrls(paths) {
  const uniquePaths = [...new Set((paths || []).filter(Boolean))];
  if (!uniquePaths.length) return {};

  const entries = await Promise.all(
    uniquePaths.map(async (path) => {
      if (!artworkDataUrlCache.has(path)) {
        const cleanPath = String(path).replace(/^\/+/, "");
        const url = new URL(`../../${cleanPath}`, import.meta.url);
        const promise = fetch(url)
          .then((response) => {
            if (!response.ok) throw new Error(`Failed to fetch ${cleanPath}`);
            return response.arrayBuffer();
          })
          .then((buffer) => `data:image/svg+xml;base64,${fontBase64FromArrayBuffer(buffer)}`)
          .catch(() => {
            artworkDataUrlCache.delete(path);
            return null;
          });
        artworkDataUrlCache.set(path, promise);
      }
      const dataUrl = await artworkDataUrlCache.get(path);
      return [path, dataUrl];
    }),
  );

  const map = {};
  for (const [path, dataUrl] of entries) {
    if (dataUrl) map[path] = dataUrl;
  }
  return map;
}

export async function loadUniformPdfAssets() {
  if (!cachedAssetsPromise) {
    const regularUrl = new URL("../../../kit-list/assets/fonts/NunitoSans-Regular.ttf", import.meta.url);
    const boldUrl = new URL("../../../kit-list/assets/fonts/NunitoSans-Bold.ttf", import.meta.url);
    const blackUrl = new URL("../../../kit-list/assets/fonts/NunitoSans-Black.ttf", import.meta.url);
    const logoUrl = new URL("../../../assets/img/scouts-white.svg", import.meta.url);

    cachedAssetsPromise = Promise.all([
      fetchFontBase64(regularUrl),
      fetchFontBase64(boldUrl),
      fetchFontBase64(blackUrl),
      svgUrlToPngDataUrl(logoUrl, 176, 50).catch(() => null),
    ])
      .then(([regular, bold, black, logoDataUrl]) => ({ regular, bold, black, logoDataUrl }))
      .catch((error) => {
        cachedAssetsPromise = null;
        throw error;
      });
  }
  return cachedAssetsPromise;
}

export function buildEmbeddedFontCss(fonts) {
  if (!fonts?.bold) return "";
  return `
    @font-face {
      font-family: 'Nunito Sans';
      font-weight: 700 900;
      src: url(data:font/ttf;base64,${fonts.bold}) format('truetype');
    }
  `;
}

/**
 * Builds the A4 PDF document.
 * Pure jsPDF function — accepts an optional pre-rendered artworkDataUrl (for browser high-DPI SVG artwork),
 * and cleanly draws vector fallback outlines if artworkDataUrl is omitted (e.g. headless Node tests).
 */
export function createUniformPdf({ jsPDF, state, layout = resolveUniformLayout(state), fonts, logoDataUrl = null, artworkDataUrl = null }) {
  if (!jsPDF) throw new Error("The PDF library did not load. Try the print button instead.");
  if (!fonts) throw new Error("The brand fonts did not load. Try the print button instead.");

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  doc.addFileToVFS("NunitoSans-Regular.ttf", fonts.regular);
  doc.addFont("NunitoSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("NunitoSans-Bold.ttf", fonts.bold);
  doc.addFont("NunitoSans-Bold.ttf", FONT_TEXT, "bold");
  doc.addFileToVFS("NunitoSans-Black.ttf", fonts.black);
  doc.addFont("NunitoSans-Black.ttf", FONT, "bold");

  const setRegular = (size, colour = COLOURS.ink) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(size);
    doc.setTextColor(...colour);
  };
  const setBold = (size, colour = COLOURS.ink) => {
    doc.setFont(FONT_TEXT, "bold");
    doc.setFontSize(size);
    doc.setTextColor(...colour);
  };
  const setBlack = (size, colour = COLOURS.ink) => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(size);
    doc.setTextColor(...colour);
  };

  const sectionRgb = hexToRgbArray(layout.section.accent, COLOURS.purple);
  const headerBg = state.diagramStyle === "ink-saver" ? COLOURS.white : sectionRgb;
  const headerInkLight = state.diagramStyle !== "ink-saver";

  // ── Page 1: Branded Header + Full Uniform & Badge Placement Diagram ──────
  const headerHeight = 104;
  if (headerInkLight) {
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, A4.width, headerHeight, "F");
    // Subtle decorative accent arc echoing the Scout Tools header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.setLineDashPattern([3, 4], 0);
    doc.circle(A4.width - 28, 12, 68, "S");
    doc.setLineDashPattern([], 0);
  } else {
    doc.setFillColor(...COLOURS.white);
    doc.rect(0, 0, A4.width, headerHeight, "F");
    doc.setFillColor(...sectionRgb);
    doc.rect(0, 0, A4.width, 6, "F");
    doc.setDrawColor(...COLOURS.line);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, headerHeight, A4.width - MARGIN, headerHeight);
  }

  if (logoDataUrl && headerInkLight) {
    doc.addImage(logoDataUrl, "PNG", A4.width - MARGIN - 86, 22, 86, 24.4);
  }

  setBold(8, headerInkLight ? COLOURS.yellow : sectionRgb);
  doc.setCharSpace(1.8);
  doc.text("UNIFORM & BADGE PLACEMENT GUIDE", MARGIN, 30);
  doc.setCharSpace(0);

  const title = layout.title;
  const titleSize = title.length > 44 ? 17 : title.length > 30 ? 20 : 23;
  setBlack(titleSize, headerInkLight ? COLOURS.white : COLOURS.ink);
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH - 105);
  doc.text(titleLines.slice(0, 2), MARGIN, 54);

  const metaParts = [
    `${layout.section.fullName} (${layout.section.age})`,
    layout.variant.label,
    state.districtName ? `${state.districtName} District` : "",
    state.countyName ? state.countyName : "",
  ].filter(Boolean);
  setRegular(9, headerInkLight ? [242, 244, 248] : COLOURS.grey);
  doc.text(metaParts.join("  •  "), MARGIN, titleLines.length > 1 ? 89 : 78);

  // Compute exact diagram coordinate frame inside Page 1
  const svgH = layout.showBeltBuckles ? CANVAS.height : 690;
  const topY = headerHeight + 16;
  const notesBlockReserve = (state.parentNote ? 44 : 0) + (layout.footnotes.length ? layout.footnotes.length * 14 + 16 : 0) + 46;
  const maxDiagramH = A4.height - topY - notesBlockReserve;
  const scale = Math.min(CONTENT_WIDTH / CANVAS.width, maxDiagramH / svgH);
  const drawW = CANVAS.width * scale;
  const drawH = svgH * scale;
  const originX = (A4.width - drawW) / 2;
  const originY = topY + Math.max(0, (maxDiagramH - drawH) / 2);

  if (artworkDataUrl) {
    doc.addImage(artworkDataUrl, "PNG", originX, originY, drawW, drawH, undefined, "FAST");
  } else {
    // Clean vector silhouette fallback (used in headless Node tests or if canvas rendering is unavailable)
    const tx = (x) => originX + x * scale;
    const ty = (y) => originY + y * scale;
    doc.setDrawColor(...sectionRgb);
    doc.setLineWidth(1.2);
    doc.roundedRect(tx(366), ty(140), 228 * scale, 434 * scale, 10, 10, "S");
    doc.roundedRect(tx(268), ty(180), 96 * scale, 350 * scale, 8, 8, "S");
    doc.roundedRect(tx(596), ty(180), 96 * scale, 350 * scale, 8, 8, "S");
    layout.visibleBadges.forEach((b) => {
      doc.setFillColor(...hexToRgbArray(b.fill, sectionRgb));
      doc.circle(tx(b.x), ty(b.y), Math.max(4, ((b.w || 22) * scale) / 2), "F");
    });
  }

  // Vector callout lines, target dots, and selectable Nunito Sans labels mapped 1:1 to SVG coordinates
  if (state.showCallouts && layout.callouts.length) {
    const lineRgb = state.diagramStyle === "official" ? sectionRgb : [82, 92, 106];
    const textRgb = state.diagramStyle === "official" ? sectionRgb : COLOURS.ink;
    const dotRgb = state.diagramStyle === "official" ? sectionRgb : COLOURS.purple;

    const toX = (x) => originX + x * scale;
    const toY = (y) => originY + y * scale;
    const labelFontPt = Math.max(6.8, Math.min(8.6, 11.4 * scale));
    const lineStepPt = 13.5 * scale;

    layout.callouts.forEach((c) => {
      doc.setDrawColor(...lineRgb);
      doc.setLineWidth(0.7);
      doc.line(toX(c.tickStartX), toY(c.elbowY), toX(c.elbowX), toY(c.elbowY));
      doc.line(toX(c.elbowX), toY(c.elbowY), toX(c.targetX), toY(c.targetY));

      doc.setFillColor(...dotRgb);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(toX(c.targetX), toY(c.targetY), Math.max(1.6, 2.7 * scale), "FD");

      setBold(labelFontPt, textRgb);
      const firstY = toY(c.labelY) - ((c.lines.length - 1) * lineStepPt) / 2 + labelFontPt * 0.34;
      c.lines.forEach((line, idx) => {
        doc.text(line, toX(c.labelX), firstY + idx * lineStepPt, {
          align: c.side === "left" ? "right" : "left",
        });
      });
    });
  }

  // Bottom callout box (Parent note + official footnotes)
  let footY = A4.height - 46;
  if (layout.footnotes.length) {
    setRegular(7.4, COLOURS.grey);
    for (let i = layout.footnotes.length - 1; i >= 0; i -= 1) {
      const lines = doc.splitTextToSize(layout.footnotes[i], CONTENT_WIDTH);
      footY -= lines.length * 9.5 + 3;
      doc.text(lines, MARGIN, footY);
    }
    footY -= 6;
  }

  const parentNote = String(state.parentNote || "").trim();
  if (parentNote) {
    setRegular(8.2, COLOURS.ink);
    const noteLines = doc.splitTextToSize(parentNote, CONTENT_WIDTH - 24);
    const boxH = Math.max(28, noteLines.length * 10.5 + 14);
    const boxY = footY - boxH - 4;
    doc.setFillColor(...COLOURS.purpleSoft);
    doc.roundedRect(MARGIN, boxY, CONTENT_WIDTH, boxH, 5, 5, "F");
    doc.setFillColor(...sectionRgb);
    doc.rect(MARGIN, boxY, 3.5, boxH, "F");
    setRegular(8.2, COLOURS.ink);
    doc.text(noteLines, MARGIN + 12, boxY + 14);
  }

  // ── Page 2 (Optional): Badge Placement & Sewing Guide Key ────────────────
  if (state.includeSewingKeyInPdf) {
    doc.addPage();
    doc.setFillColor(...sectionRgb);
    doc.rect(0, 0, A4.width, 6, "F");

    let y = 40;
    setBold(8, sectionRgb);
    doc.setCharSpace(1.4);
    doc.text("SEWING & PLACEMENT KEY", MARGIN, y);
    doc.setCharSpace(0);
    y += 18;
    setBlack(16, COLOURS.ink);
    doc.text(`${layout.title} — Badge notes`, MARGIN, y);
    y += 22;

    // Necker & Name Tape summary bar
    const patternObj = NECKER_PATTERNS.find((p) => p.id === state.necker.pattern) || NECKER_PATTERNS[0];
    const summaryH = 44;
    doc.setFillColor(...COLOURS.purpleSoft);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, summaryH, 6, 6, "F");
    doc.setFillColor(...sectionRgb);
    doc.rect(MARGIN, y, 4, summaryH, "F");

    setBold(7.5, COLOURS.purple);
    doc.text("NECKERCHIEF DESIGN", MARGIN + 14, y + 15);
    setBold(9.5, COLOURS.ink);
    const neckerSummary = state.showNecker ? `${patternObj.label} neckerchief` : "No neckerchief shown";
    doc.text(neckerSummary, MARGIN + 14, y + 30);

    // Mini colour swatches for the necker
    if (state.showNecker) {
      const swatchColors = [state.necker.primary];
      if (patternObj.usesSecondary) swatchColors.push(state.necker.secondary);
      if (patternObj.usesTertiary) swatchColors.push(state.necker.tertiary);
      swatchColors.forEach((hex, idx) => {
        const sx = MARGIN + 162 + idx * 18;
        doc.setFillColor(...hexToRgbArray(hex, COLOURS.purple));
        doc.setDrawColor(...COLOURS.ink);
        doc.setLineWidth(0.5);
        doc.circle(sx, y + 26, 5.5, "FD");
      });
    }

    setBold(7.5, COLOURS.purple);
    doc.text("NAME TAPES", MARGIN + 270, y + 15);
    setBold(9.5, COLOURS.ink);
    const tapeSummary = layout.tapes.length
      ? layout.tapes.map((t) => t.displayText).join(" / ")
      : "None shown";
    const tapeLines = doc.splitTextToSize(tapeSummary, CONTENT_WIDTH - 284);
    doc.text(tapeLines.slice(0, 2), MARGIN + 270, y + 30);

    y += summaryH + 18;

    const ZONE_TITLES = {
      "right-sleeve": "Right sleeve (top to bottom)",
      "right-chest": "Right chest",
      "left-chest": "Left chest",
      "left-sleeve": "Left sleeve",
      scarf: "Neckerchief / scarf",
      shoulders: "Shoulders",
      belt: "Waist / belt",
    };

    const grouped = new Map();
    const pushItem = (zone, label, note, badgeType = "") => {
      if (!grouped.has(zone)) grouped.set(zone, []);
      grouped.get(zone).push({ label, note, badgeType });
    };

    layout.tapes.forEach((t) => {
      pushItem("right-sleeve", `${t.calloutLabel} (“${t.displayText}”)`, t.note, "Tape");
    });
    layout.visibleBadges.forEach((b) => {
      pushItem(b.zone || "right-sleeve", b.label, b.note || "Sew securely in the position shown on page 1.", b.official ? "" : "Custom");
    });

    const bottomLimit = A4.height - 54;
    const ensureSpace = (needed) => {
      if (y + needed > bottomLimit) {
        doc.addPage();
        doc.setFillColor(...sectionRgb);
        doc.rect(0, 0, A4.width, 6, "F");
        y = 40;
      }
    };

    for (const [zoneId, items] of grouped.entries()) {
      ensureSpace(44);
      doc.setFillColor(...COLOURS.purpleSoft);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 21, 3.5, 3.5, "F");
      doc.setFillColor(...sectionRgb);
      doc.rect(MARGIN, y, 3.5, 21, "F");
      setBlack(9, COLOURS.purpleDark);
      doc.text((ZONE_TITLES[zoneId] || zoneId).toUpperCase(), MARGIN + 11, y + 14);
      y += 28;

      items.forEach((item) => {
        setBold(9.2, COLOURS.ink);
        const labelLines = doc.splitTextToSize(item.label, 185);
        setRegular(8.4, COLOURS.grey);
        const noteLines = doc.splitTextToSize(item.note || "Place as shown on the diagram.", CONTENT_WIDTH - 208);
        const rowH = Math.max(labelLines.length * 11, noteLines.length * 10.5) + 9;
        ensureSpace(rowH);

        setBold(9.2, COLOURS.ink);
        doc.text(labelLines, MARGIN + 6, y + 9);
        setRegular(8.4, COLOURS.grey);
        doc.text(noteLines, MARGIN + 202, y + 9);

        y += rowH;
        doc.setDrawColor(...COLOURS.lineSoft);
        doc.setLineWidth(0.5);
        doc.line(MARGIN + 6, y - 3, A4.width - MARGIN, y - 3);
      });
      y += 8;
    }
  }

  // Consistent footer across all pages
  const totalPages = doc.getNumberOfPages();
  const dateStr = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...COLOURS.lineSoft);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, A4.height - 34, A4.width - MARGIN, A4.height - 34);
    setRegular(7.2, COLOURS.greyLight);
    doc.text(
      `Generated with Scout Tools • ${dateStr} • Independent resource (not an official Scouts publication)`,
      MARGIN,
      A4.height - 21,
    );
    doc.text(`Page ${p} of ${totalPages}`, A4.width - MARGIN, A4.height - 21, { align: "right" });
  }

  return doc;
}

export function uniformPdfFilename(state, layout = resolveUniformLayout(state)) {
  return `${slugify(layout.title)}-uniform-guide.pdf`;
}

export async function downloadUniformPdf(state) {
  const jsPDF = globalThis.jspdf?.jsPDF;
  if (!jsPDF) throw new Error("The PDF library did not load. Try reloading or using Print.");
  const layout = resolveUniformLayout(state);
  const [assets, artworkMap] = await Promise.all([
    loadUniformPdfAssets(),
    preloadArtworkDataUrls(collectArtworkPaths(layout)),
  ]);
  const svgH = layout.showBeltBuckles ? CANVAS.height : 690;

  // Render artwork-only SVG (no callouts — jsPDF draws razor-sharp vector callouts directly on top!)
  const artworkSvg = renderUniformSvg(state, layout, {
    interactive: false,
    includeCallouts: false,
    idPrefix: "pdfug",
    embedFontCss: buildEmbeddedFontCss(assets),
    artworkMap,
  });
  const artworkDataUrl = await svgStringToPngDataUrl(artworkSvg, CANVAS.width, svgH, 3);

  const doc = createUniformPdf({
    jsPDF,
    state,
    layout,
    fonts: assets,
    logoDataUrl: assets.logoDataUrl,
    artworkDataUrl,
  });
  doc.save(uniformPdfFilename(state, layout));
}
