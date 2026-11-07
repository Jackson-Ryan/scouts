/**
 * Kit List Generator — PDF builder.
 *
 * Uses jsPDF (vendored, MIT) with the Scouts brand font, Nunito Sans. The
 * layout is built from simple vector primitives so the output stays crisp,
 * selectable and small enough to email.
 */

import { slugify } from "./kit-data.js";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 42;
const CONTENT_WIDTH = A4.width - MARGIN * 2;
const BOTTOM = A4.height - 62;

const COLOURS = {
  purple: [89, 15, 169],
  purpleDark: [64, 11, 122],
  purpleSoft: [243, 237, 251],
  navy: [0, 57, 130],
  yellow: [255, 230, 39],
  ink: [26, 26, 26],
  grey: [95, 95, 95],
  greyLight: [110, 110, 110],
  line: [222, 222, 222],
  lineSoft: [238, 238, 238],
  white: [255, 255, 255],
  mint: [37, 183, 85],
};

const FONT = "NunitoSans";
const FONT_TEXT = "NunitoSansText";

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

async function svgToPngDataUrl(url, width, height) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load the Scouts logo (${response.status}).`);
  const svg = await response.text();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Could not prepare the Scouts logo."));
      image.src = objectUrl;
    });

    const scale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function loadPdfAssets() {
  const regularUrl = new URL("../fonts/NunitoSans-Regular.ttf", import.meta.url);
  const boldUrl = new URL("../fonts/NunitoSans-Bold.ttf", import.meta.url);
  const blackUrl = new URL("../fonts/NunitoSans-Black.ttf", import.meta.url);
  const logoUrl = new URL("../../../assets/img/scouts-white.svg", import.meta.url);

  const [regular, bold, black, logoDataUrl] = await Promise.all([
    fetchFontBase64(regularUrl),
    fetchFontBase64(boldUrl),
    fetchFontBase64(blackUrl),
    svgToPngDataUrl(logoUrl, 176, 50).catch(() => null),
  ]);

  return { regular, bold, black, logoDataUrl };
}

export function createKitListPdf({ jsPDF, list, fonts, logoDataUrl }) {
  if (!jsPDF) throw new Error("The PDF library did not load. Try the print button instead.");
  if (!fonts) throw new Error("The brand fonts did not load. Try the print button instead.");

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  doc.addFileToVFS("NunitoSans-Regular.ttf", fonts.regular);
  doc.addFont("NunitoSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("NunitoSans-Bold.ttf", fonts.bold);
  doc.addFont("NunitoSans-Bold.ttf", FONT_TEXT, "bold");
  doc.addFileToVFS("NunitoSans-Black.ttf", fonts.black);
  doc.addFont("NunitoSans-Black.ttf", FONT, "bold");

  let y = 0;
  let pageNumber = 1;

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

  const drawFooter = () => {
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(...COLOURS.lineSoft);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, A4.height - 46, A4.width - MARGIN, A4.height - 46);
      setRegular(7.5, COLOURS.greyLight);
      const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(list.generatedAt);
      doc.text(`Generated with Scout Tools • ${date}`, MARGIN, A4.height - 31);
      doc.text(`Page ${page} of ${total}`, A4.width - MARGIN, A4.height - 31, { align: "right" });
    }
  };

  const newPage = (continuedTitle = "") => {
    doc.addPage();
    pageNumber += 1;
    doc.setFillColor(...COLOURS.purple);
    doc.rect(0, 0, A4.width, 6, "F");
    y = 46;
    if (continuedTitle) {
      setBold(8.5, COLOURS.purple);
      doc.setCharSpace(0.7);
      doc.text(`${continuedTitle.toUpperCase()} (CONTINUED)`, MARGIN, y);
      doc.setCharSpace(0);
      y += 18;
    }
  };

  const ensureSpace = (height, continuedTitle = "") => {
    if (y + height > BOTTOM) newPage(continuedTitle);
  };

  // ---------------------------------------------------------------------------
  // Cover header
  // ---------------------------------------------------------------------------

  const titleSize = list.title.length > 62 ? 20 : list.title.length > 42 ? 23 : 27;
  setBlack(titleSize, COLOURS.white);
  const titleLines = doc.splitTextToSize(list.title, CONTENT_WIDTH - 130);
  const titleLineHeight = titleSize * 1.08;

  const metaBits = [list.section, list.dates];
  if (list.nights > 0) metaBits.push(`${list.nights} night${list.nights === 1 ? "" : "s"}`);
  metaBits.push(list.accommodation);
  if (list.venue) metaBits.push(list.venue);
  if (list.groupName) metaBits.push(list.groupName);
  const metaLine = metaBits.filter(Boolean).join("  •  ");
  setRegular(9.5, [239, 234, 250]);
  const metaLines = doc.splitTextToSize(metaLine, CONTENT_WIDTH - 120);
  const metaY = 106 + (titleLines.length - 1) * titleLineHeight + 24;
  const headerHeight = Math.max(172, metaY + metaLines.length * 12 + 18);

  doc.setFillColor(...COLOURS.purple);
  doc.rect(0, 0, A4.width, headerHeight, "F");

  // Decorative shapes echo the site hero.
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.2);
  doc.setLineDashPattern([3, 4], 0);
  doc.circle(A4.width - 26, -6, 92, "S");
  doc.setLineDashPattern([], 0);
  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.07 }));
  doc.circle(A4.width - 40, headerHeight + 16, 88, "F");
  doc.setGState(new doc.GState({ opacity: 1 }));

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", MARGIN, 30, 96, 27);
  }

  setBold(8.5, COLOURS.yellow);
  doc.setCharSpace(2.2);
  doc.text("KIT LIST", MARGIN, 82);
  doc.setCharSpace(0);

  setBlack(titleSize, COLOURS.white);
  doc.text(titleLines, MARGIN, 106);

  setRegular(9.5, [239, 234, 250]);
  doc.text(metaLines, MARGIN, metaY);

  y = headerHeight + 22;

  // ---------------------------------------------------------------------------
  // Summary panel
  // ---------------------------------------------------------------------------

  const summaryHeight = 86;
  doc.setFillColor(...COLOURS.purpleSoft);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, summaryHeight, 8, 8, "F");
  doc.setFillColor(...COLOURS.purple);
  doc.roundedRect(MARGIN, y, 4, summaryHeight, 2, 2, "F");

  const summary = [
    ["SECTION", list.section],
    ["TRIP", list.tripType],
    ["DATES", list.dates],
    ["NIGHTS", list.nights === 0 ? "Day trip" : String(list.nights)],
    ["SLEEPING", list.nights === 0 ? "Not staying over" : list.accommodation],
    ["WEATHER", list.weather.length ? list.weather.slice(0, 3).join(", ") : "Mixed"],
  ];

  const columnWidth = (CONTENT_WIDTH - 24) / 3;
  summary.forEach(([label, value], index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = MARGIN + 14 + column * columnWidth;
    const rowY = y + 18 + row * 33;
    setBold(7, COLOURS.purple);
    doc.setCharSpace(0.9);
    doc.text(label, x, rowY);
    doc.setCharSpace(0);
    setBold(9.5, COLOURS.purpleDark);
    const valueLines = doc.splitTextToSize(String(value || "—"), columnWidth - 12);
    doc.text(valueLines.slice(0, 2), x, rowY + 13);
  });

  y += summaryHeight + 18;

  // How to use note
  const note =
    "Work through this list with a grown-up and tick each item as it goes into your bag. It is a starting point — always check your event kit list and risk assessment too.";
  doc.setFillColor(...COLOURS.yellow);
  doc.rect(MARGIN, y, 3, 30, "F");
  setRegular(8.5, COLOURS.grey);
  const noteLines = doc.splitTextToSize(note, CONTENT_WIDTH - 16);
  doc.text(noteLines, MARGIN + 12, y + 11);
  y += Math.max(34, noteLines.length * 11 + 12);

  if (list.activities.length) {
    setRegular(8.5, COLOURS.grey);
    const activityLine = `Activities: ${list.activities.join(", ")}`;
    const activityLines = doc.splitTextToSize(activityLine, CONTENT_WIDTH);
    doc.text(activityLines, MARGIN, y + 6);
    y += activityLines.length * 11 + 10;
  }

  y += 8;

  // ---------------------------------------------------------------------------
  // Categories and items
  // ---------------------------------------------------------------------------

  const drawCategory = (group) => {
    ensureSpace(80, group.title);
    doc.setFillColor(...COLOURS.purpleSoft);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 27, 4, 4, "F");
    doc.setFillColor(...COLOURS.purple);
    doc.rect(MARGIN, y, 4, 27, "F");
    setBlack(10.5, COLOURS.purpleDark);
    doc.setCharSpace(0.6);
    doc.text(group.title.toUpperCase(), MARGIN + 13, y + 18);
    doc.setCharSpace(0);
    setRegular(7.5, COLOURS.grey);
    doc.text(`${group.items.length} item${group.items.length === 1 ? "" : "s"}`, A4.width - MARGIN - 10, y + 18, { align: "right" });
    y += 35;
  };

  const drawItem = (item, group) => {
    const qtyWidth = 54;
    const textWidth = CONTENT_WIDTH - 34 - qtyWidth;
    setBold(10, COLOURS.ink);
    const nameLines = doc.splitTextToSize(item.name, textWidth);
    const noteLines = item.note ? doc.splitTextToSize(item.note, textWidth) : [];
    const rowHeight = Math.max(24, nameLines.length * 12 + noteLines.length * 10 + 9);

    ensureSpace(rowHeight + 2, group.title);

    doc.setDrawColor(...COLOURS.line);
    doc.setLineWidth(0.9);
    doc.roundedRect(MARGIN + 2, y + 2.5, 10, 10, 1.6, 1.6, "S");

    setBold(10, COLOURS.ink);
    doc.text(nameLines, MARGIN + 20, y + 11);

    let textY = y + 11 + nameLines.length * 12;
    if (noteLines.length) {
      setRegular(8, COLOURS.grey);
      doc.text(noteLines, MARGIN + 20, textY);
      textY += noteLines.length * 10;
    }

    if (item.qty) {
      setBold(9, COLOURS.purple);
      doc.text(item.qty, A4.width - MARGIN, y + 11, { align: "right" });
    }
    if (item.optional) {
      setRegular(6.5, COLOURS.greyLight);
      doc.setCharSpace(0.5);
      const offset = item.qty ? 10 : 0;
      doc.text("OPTIONAL", A4.width - MARGIN, y + 21 + offset, { align: "right" });
      doc.setCharSpace(0);
    }

    y += rowHeight;
    doc.setDrawColor(...COLOURS.lineSoft);
    doc.setLineWidth(0.5);
    doc.line(MARGIN + 20, y - 5, A4.width - MARGIN, y - 5);
    y += 2;
  };

  list.groups.forEach((group) => {
    drawCategory(group);
    group.items.forEach((item) => drawItem(item, group));
    y += 12;
  });

  // ---------------------------------------------------------------------------
  // Before you go / leader notes
  // ---------------------------------------------------------------------------

  const tipLines = list.tips.map((tip) => doc.splitTextToSize(tip, CONTENT_WIDTH - 46));
  const tipHeight = 24 + tipLines.reduce((height, lines) => height + lines.length * 11 + 4, 0) + 18;
  ensureSpace(tipHeight);
  y += 4;
  doc.setFillColor(...COLOURS.purpleSoft);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, tipHeight, 8, 8, "F");
  setBlack(12, COLOURS.purpleDark);
  doc.text("Before you go", MARGIN + 16, y + 24);
  setRegular(8.8, COLOURS.ink);
  let tipY = y + 42;
  tipLines.forEach((lines) => {
    doc.setFillColor(...COLOURS.mint);
    doc.circle(MARGIN + 19, tipY - 3, 2, "F");
    doc.text(lines, MARGIN + 28, tipY);
    tipY += lines.length * 11 + 4;
  });
  y += tipHeight + 20;

  const notesHeight = 118;
  ensureSpace(notesHeight);
  doc.setDrawColor(...COLOURS.line);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, notesHeight, 6, 6, "S");
  setBlack(11, COLOURS.purpleDark);
  doc.text("Leader notes", MARGIN + 14, y + 22);
  setRegular(8, COLOURS.grey);
  doc.text("Phone numbers, meeting times, last-minute changes and who is bringing what.", MARGIN + 14, y + 36);
  doc.setDrawColor(...COLOURS.lineSoft);
  doc.setLineWidth(0.6);
  for (let line = 0; line < 4; line += 1) {
    const lineY = y + 58 + line * 15;
    doc.line(MARGIN + 14, lineY, A4.width - MARGIN - 14, lineY);
  }
  y += notesHeight + 18;

  setRegular(7.8, COLOURS.grey);
  const disclaimer =
    "This kit list is a starting point. Always follow your own risk assessment, safeguarding procedures and the guidance of your section. Scouts and the Scouts fleur-de-lis are trademarks of The Scout Association.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
  ensureSpace(disclaimerLines.length * 10 + 10);
  doc.text(disclaimerLines, MARGIN, y + 8);

  drawFooter();
  return doc;
}

export function pdfFilename(list) {
  return `${slugify(list.title)}-kit-list.pdf`;
}

export async function downloadKitListPdf(list) {
  const jsPDF = globalThis.jspdf?.jsPDF;
  if (!jsPDF) throw new Error("The PDF library did not load. Check your connection and try again.");
  const assets = await loadPdfAssets();
  const doc = createKitListPdf({ jsPDF, list, fonts: assets, logoDataUrl: assets.logoDataUrl });
  doc.save(pdfFilename(list));
}