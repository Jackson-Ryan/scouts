// Pure SVG renderer for the Interactive Uniform & Badge Placement Guide.
// Completely self-contained (inline icon paths, unique clipPath/path IDs) so the exact same SVG
// renders interactively in the browser, exports cleanly to SVG/PNG, and feeds the A4 PDF builder.
// Pure ES module with zero top-level DOM access (Node-safe).

import { CANVAS } from "./uniform-data.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch];
  });
}

function hexToRgb(hex) {
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
  return [89, 15, 169];
}

function shadeHex(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`;
}

function isLightColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72;
}

// Inline self-contained badge icon paths centred in a -10..10 box (20x20 viewBox).
function iconPathMarkup(iconId, color) {
  const stroke = esc(color);
  switch (iconId) {
    case "fleur":
      return `
        <path d="M0 -7.5 C-1.6 -5 -2.2 -2.4 -1.2 0.8 C-3.2 -2.4 -6.6 -2.2 -6.6 1 C-6.6 3.1 -4.4 4 -2.2 3.2 C-2.6 5 -3.4 6.2 -4.8 7 L-1.6 7 C-1 6 -0.6 5.2 0 4.6 C0.6 5.2 1 6 1.6 7 L4.8 7 C3.4 6.2 2.6 5 2.2 3.2 C4.4 4 6.6 3.1 6.6 1 C6.6 -2.2 3.2 -2.4 1.2 0.8 C2.2 -2.4 1.6 -5 0 -7.5 Z" fill="${stroke}" stroke="none"/>
        <rect x="-4.4" y="1.8" width="8.8" height="1.7" rx="0.8" fill="${stroke}" stroke="none"/>
      `;
    case "shield":
      return `<path d="M0 -7 L6 -4.5 V0.5 C6 4.2 3.2 6.4 0 7.6 C-3.2 6.4 -6 4.2 -6 0.5 V-4.5 Z" fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linejoin="round"/>`;
    case "star":
      return `<polygon points="0,-7.4 2.1,-2.4 7.4,-2 3.4,1.5 4.6,6.8 0,3.9 -4.6,6.8 -3.4,1.5 -7.4,-2 -2.1,-2.4" fill="${stroke}" stroke="none"/>`;
    case "compass":
      return `
        <circle cx="0" cy="0" r="6.8" fill="none" stroke="${stroke}" stroke-width="1.4"/>
        <polygon points="0,-5 1.8,0 0,5 -1.8,0" fill="${stroke}" stroke="none"/>
      `;
    case "tent":
      return `<path d="M-7 5.5 L0 -6 L7 5.5 Z M0 -6 L0 5.5 M-2.2 5.5 L0 1.4 L2.2 5.5" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
    case "fire":
      return `<path d="M0 -7.2 C2.8 -3.8 5.2 -1.2 5.2 2 C5.2 5.1 2.9 7.2 0 7.2 C-2.9 7.2 -5.2 5.1 -5.2 2 C-5.2 -0.2 -3.8 -2.3 -2.2 -3.6 C-2.1 -1.5 -0.8 -0.8 -0.5 -2.2 C-0.2 -3.8 -0.4 -5.6 0 -7.2 Z" fill="${stroke}" stroke="none"/>`;
    case "anchor":
      return `
        <circle cx="0" cy="-5.2" r="1.7" fill="none" stroke="${stroke}" stroke-width="1.4"/>
        <path d="M0 -3.4 V6.2 M-3.6 -1.2 H3.6 M-5.8 2.2 C-5.4 5 -2.8 6.4 0 6.4 C2.8 6.4 5.4 5 5.8 2.2" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
      `;
    case "plane":
      return `<path d="M-7.5 0.5 L-1.5 -1.5 L0 -6.5 L1.5 -1.5 L7.5 0.5 L7.5 2.4 L1.5 1.2 L1 4.8 L3.2 6.2 V7.2 L0 6.2 L-3.2 7.2 V6.2 L-1 4.8 L-1.5 1.2 L-7.5 2.4 Z" fill="${stroke}" stroke="none"/>`;
    case "crown":
      return `<path d="M-6.5 4.8 L-7.4 -3.2 L-3 0.6 L0 -5.6 L3 0.6 L7.4 -3.2 L6.5 4.8 Z" fill="${stroke}" stroke="none"/>`;
    case "flag":
      return `
        <path d="M-4.6 6.6 V-6.2 H5.6 L3.6 -2.4 L5.6 1.4 H-4.6" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      `;
    case "globe":
      return `
        <circle cx="0" cy="0" r="6.4" fill="none" stroke="${stroke}" stroke-width="1.4"/>
        <ellipse cx="0" cy="0" rx="3.1" ry="6.4" fill="none" stroke="${stroke}" stroke-width="1.2"/>
        <line x1="-6.4" y1="0" x2="6.4" y2="0" stroke="${stroke}" stroke-width="1.2"/>
      `;
    case "award":
      return `
        <circle cx="0" cy="-2.2" r="4.2" fill="none" stroke="${stroke}" stroke-width="1.6"/>
        <path d="M-2.4 1.6 L-3.8 7.2 L0 5.4 L3.8 7.2 L2.4 1.6" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>
      `;
    case "first-aid":
      return `<path d="M-2.2 -6.2 H2.2 V-2.2 H6.2 V2.2 H2.2 V6.2 H-2.2 V2.2 H-6.2 V-2.2 H-2.2 Z" fill="${stroke}" stroke="none"/>`;
    case "tree":
      return `<path d="M0 -7 L5.2 0.2 H2.2 L6 4.8 H-6 L-2.2 0.2 H-5.2 Z M-1.2 4.8 H1.2 V7.4 H-1.2 Z" fill="${stroke}" stroke="none"/>`;
    case "mountain":
      return `<path d="M-7.2 5.4 L-1.6 -5.4 L2.4 1.2 L4.4 -1.6 L7.4 5.4 Z" fill="${stroke}" stroke="none"/>`;
    case "paw":
      return `
        <ellipse cx="0" cy="2.6" rx="3.8" ry="3.1" fill="${stroke}"/>
        <circle cx="-4.6" cy="-1.6" r="1.6" fill="${stroke}"/>
        <circle cx="-1.7" cy="-4.2" r="1.6" fill="${stroke}"/>
        <circle cx="1.7" cy="-4.2" r="1.6" fill="${stroke}"/>
        <circle cx="4.6" cy="-1.6" r="1.6" fill="${stroke}"/>
      `;
    case "target":
      return `
        <circle cx="0" cy="0" r="6.4" fill="none" stroke="${stroke}" stroke-width="1.4"/>
        <circle cx="0" cy="0" r="3.4" fill="none" stroke="${stroke}" stroke-width="1.4"/>
        <circle cx="0" cy="0" r="1.3" fill="${stroke}"/>
      `;
    case "heart":
      return `<path d="M0 6.4 C-4.8 3.2 -7 0.2 -7 -2.6 C-7 -5 -5 -6.6 -2.8 -6.6 C-1.4 -6.6 -0.4 -5.8 0 -4.8 C0.4 -5.8 1.4 -6.6 2.8 -6.6 C5 -6.6 7 -5 7 -2.6 C7 0.2 4.8 3.2 0 6.4 Z" fill="${stroke}" stroke="none"/>`;
    case "sun":
      return `
        <circle cx="0" cy="0" r="3.3" fill="${stroke}"/>
        <path d="M0 -7.4 V-5.2 M0 5.2 V7.4 M-7.4 0 H-5.2 M5.2 0 H7.4 M-5.2 -5.2 L-3.6 -3.6 M3.6 3.6 L5.2 5.2 M5.2 -5.2 L3.6 -3.6 M-3.6 3.6 L-5.2 5.2" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round"/>
      `;
    default:
      return "";
  }
}

/**
 * Returns the local SVG geometry element (centred at 0,0) for any badge shape.
 */
function badgeShapeElement(shape, w, h) {
  const hw = w / 2;
  const hh = h / 2;

  switch (shape) {
    case "circle":
      return `<circle cx="0" cy="0" r="${(Math.min(w, h) / 2).toFixed(2)}"/>`;
    case "oval":
      return `<ellipse cx="0" cy="0" rx="${hw.toFixed(2)}" ry="${hh.toFixed(2)}"/>`;
    case "square":
      return `<rect x="${(-hw).toFixed(2)}" y="${(-hh).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="3"/>`;
    case "rect":
      return `<rect x="${(-hw).toFixed(2)}" y="${(-hh).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="2.5"/>`;
    case "bar":
      return `<rect x="${(-hw).toFixed(2)}" y="${(-hh).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="2"/>`;
    case "shield":
      return `<path d="M ${(-hw).toFixed(2)} ${(-hh * 0.85).toFixed(2)} Q 0 ${(-hh * 1.12).toFixed(2)} ${hw.toFixed(2)} ${(-hh * 0.85).toFixed(2)} L ${hw.toFixed(2)} ${(hh * 0.08).toFixed(2)} C ${hw.toFixed(2)} ${(hh * 0.65).toFixed(2)} ${(hw * 0.45).toFixed(2)} ${(hh * 0.92).toFixed(2)} 0 ${hh.toFixed(2)} C ${(-hw * 0.45).toFixed(2)} ${(hh * 0.92).toFixed(2)} ${(-hw).toFixed(2)} ${(hh * 0.65).toFixed(2)} ${(-hw).toFixed(2)} ${(hh * 0.08).toFixed(2)} Z"/>`;
    case "diamond":
      return `<polygon points="0,${(-hh).toFixed(2)} ${hw.toFixed(2)},0 0,${hh.toFixed(2)} ${(-hw).toFixed(2)},0"/>`;
    case "hexagon": {
      const rx = hw;
      const ry = hh;
      const pts = [
        [0, -ry],
        [rx * 0.92, -ry * 0.5],
        [rx * 0.92, ry * 0.5],
        [0, ry],
        [-rx * 0.92, ry * 0.5],
        [-rx * 0.92, -ry * 0.5],
      ]
        .map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`)
        .join(" ");
      return `<polygon points="${pts}"/>`;
    }
    case "triangle":
      return `<polygon points="0,${(-hh).toFixed(2)} ${hw.toFixed(2)},${hh.toFixed(2)} ${(-hw).toFixed(2)},${hh.toFixed(2)}"/>`;
    case "pennant":
      return `<polygon points="${(-hw).toFixed(2)},${(-hh).toFixed(2)} ${hw.toFixed(2)},0 ${(-hw).toFixed(2)},${hh.toFixed(2)}"/>`;
    case "star": {
      const rOuter = Math.min(hw, hh);
      const rInner = rOuter * 0.48;
      const pts = [];
      for (let i = 0; i < 10; i += 1) {
        const angle = (-Math.PI / 2) + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? rOuter : rInner;
        pts.push(`${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`);
      }
      return `<polygon points="${pts.join(" ")}"/>`;
    }
    default:
      return `<circle cx="0" cy="0" r="${(Math.min(w, h) / 2).toFixed(2)}"/>`;
  }
}

function renderGarment(state, layout) {
  const isShirt = layout.variant.garment === "shirt";
  const style = state.diagramStyle || "colour";
  const fillColor = style === "colour" ? layout.garmentColor : "#ffffff";
  const strokeColor =
    style === "official"
      ? layout.lineColor
      : style === "ink-saver"
        ? "#3b4252"
        : isLightColor(layout.garmentColor)
          ? shadeHex(layout.garmentColor, -65)
          : shadeHex(layout.garmentColor, -34);

  const seamColor =
    style === "colour"
      ? isLightColor(layout.garmentColor)
        ? "rgba(26,26,26,0.22)"
        : "rgba(255,255,255,0.24)"
      : strokeColor;

  const ribFill =
    style === "colour"
      ? isLightColor(layout.garmentColor)
        ? shadeHex(layout.garmentColor, -14)
        : shadeHex(layout.garmentColor, -18)
      : "#ffffff";

  // Garment torso + sleeves silhouette around cx = 480 with realistic upper-sleeve width for badge pairs.
  const bodyPath = isShirt
    ? `
      M 426 112
      Q 480 96 534 112
      L 598 138
      Q 628 150 642 180
      L 694 364
      L 708 544
      Q 680 552 652 544
      L 630 378
      L 598 288
      L 594 584
      Q 480 608 366 584
      L 362 288
      L 330 378
      L 308 544
      Q 280 552 252 544
      L 266 364
      L 318 180
      Q 332 150 362 138
      Z
    `
    : `
      M 428 112
      Q 480 96 532 112
      L 596 138
      Q 626 150 642 180
      L 692 362
      L 704 540
      Q 676 546 650 540
      L 630 380
      L 598 288
      L 594 574
      Q 480 598 366 574
      L 362 288
      L 330 380
      L 310 540
      Q 284 546 256 540
      L 268 362
      L 318 180
      Q 334 150 364 138
      Z
    `;

  let details = "";

  // Subtle torso/sleeve highlight in full-colour mode
  if (style === "colour") {
    details += `
      <path d="M 366 286 Q 480 268 594 286 L 594 574 Q 480 596 366 574 Z" fill="rgba(0,0,0,0.035)" stroke="none"/>
    `;
  }

  // Raglan / armhole shoulder seams
  details += `
    <path d="M 366 146 Q 372 224 362 288" fill="none" stroke="${esc(seamColor)}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M 594 146 Q 588 224 598 288" fill="none" stroke="${esc(seamColor)}" stroke-width="1.4" stroke-linecap="round"/>
  `;

  if (isShirt) {
    // Shirt collar peeks out beneath neckerchief
    details += `
      <path d="M 426 112 Q 480 132 534 112 L 542 136 Q 480 156 418 136 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- Epaulettes -->
      <path d="M 346 154 L 400 130 L 408 148 L 354 172 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="395" cy="142" r="2.2" fill="${esc(strokeColor)}"/>
      <path d="M 614 154 L 560 130 L 552 148 L 606 172 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="565" cy="142" r="2.2" fill="${esc(strokeColor)}"/>
      <!-- Centre placket & buttons -->
      <path d="M 472 238 V 572 M 488 238 V 572" fill="none" stroke="${esc(seamColor)}" stroke-width="1.2"/>
      <circle cx="480" cy="462" r="2.5" fill="none" stroke="${esc(strokeColor)}" stroke-width="1.3"/>
      <circle cx="480" cy="498" r="2.5" fill="none" stroke="${esc(strokeColor)}" stroke-width="1.3"/>
      <circle cx="480" cy="534" r="2.5" fill="none" stroke="${esc(strokeColor)}" stroke-width="1.3"/>
      <!-- Left chest pocket with buttoned flap -->
      <path d="M 505 328 H 575 V 404 Q 540 411 505 404 Z" fill="${esc(style === "colour" ? shadeHex(layout.garmentColor, -8) : "#ffffff")}" stroke="${esc(strokeColor)}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M 505 328 H 575 V 344 L 540 353 L 505 344 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="540" cy="346" r="2.2" fill="${esc(strokeColor)}"/>
      <!-- Cuffs with button -->
      <path d="M 254 524 Q 280 531 307 524 L 308 544 Q 280 552 252 544 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
      <circle cx="295" cy="536" r="2.2" fill="none" stroke="${esc(strokeColor)}" stroke-width="1.2"/>
      <path d="M 653 524 Q 680 531 706 524 L 708 544 Q 680 552 652 544 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
      <circle cx="665" cy="536" r="2.2" fill="none" stroke="${esc(strokeColor)}" stroke-width="1.2"/>
      <!-- Scout Belt & Buckle -->
      <path d="M 365 568 Q 480 590 595 568 L 594 590 Q 480 612 366 590 Z" fill="${esc(style === "colour" ? "#1e293b" : "#ffffff")}" stroke="${esc(strokeColor)}" stroke-width="1.7"/>
      <rect x="466" y="576" width="28" height="22" rx="4" fill="${esc(style === "colour" ? "#d99b00" : "#ffffff")}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
      <circle cx="480" cy="587" r="7.5" fill="none" stroke="${esc(style === "colour" ? "#5a3d00" : strokeColor)}" stroke-width="1.3"/>
      <g transform="translate(480 587) scale(0.72)">${iconPathMarkup("fleur", style === "colour" ? "#5a3d00" : strokeColor)}</g>
    `;
  } else {
    // Crewneck sweatshirt collar, ribbed cuffs & ribbed hem
    details += `
      <path d="M 428 112 Q 480 132 532 112 Q 528 128 480 136 Q 432 128 428 112 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
      <!-- Ribbed cuffs -->
      <path d="M 258 518 Q 284 524 310 518 L 310 540 Q 284 546 256 540 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
      <path d="M 650 518 Q 676 524 702 518 L 704 540 Q 676 546 650 540 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
      <!-- Ribbed waistband -->
      <path d="M 366 554 Q 480 574 594 554 L 594 574 Q 480 598 366 574 Z" fill="${esc(ribFill)}" stroke="${esc(strokeColor)}" stroke-width="1.6"/>
    `;
  }

  return `
    <g class="ug-garment">
      <path d="${bodyPath}" fill="${esc(fillColor)}" stroke="${esc(strokeColor)}" stroke-width="2" stroke-linejoin="round"/>
      ${details}
    </g>
  `;
}

/**
 * Generates pattern fill layers inside a clipped scarf region.
 */
function neckerPatternLayers(necker, idPrefix, strokeOutline) {
  const { pattern, primary, secondary, tertiary } = necker;
  const p = esc(primary);
  const s = esc(secondary);
  const t = esc(tertiary);

  // Outer paths for borders along collar and tails:
  const collarOuter = "M 396 146 Q 414 196 472 214 L 488 214 Q 546 196 564 146";
  const leftTailEdges = "M 472 232 L 456 382 L 478 446";
  const rightTailEdges = "M 488 232 L 504 380 L 482 446";

  const defs = [];
  let collarFill = `<rect x="380" y="88" width="200" height="145" fill="${p}"/>`;
  let tailsFill = `<rect x="444" y="218" width="76" height="240" fill="${p}"/>`;

  if (pattern === "single-border") {
    collarFill += `<path d="${collarOuter}" fill="none" stroke="${s}" stroke-width="13" stroke-linejoin="round"/>`;
    tailsFill += `
      <path d="${leftTailEdges}" fill="none" stroke="${s}" stroke-width="12" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${s}" stroke-width="12" stroke-linejoin="round"/>
    `;
  } else if (pattern === "double-border") {
    collarFill += `
      <path d="${collarOuter}" fill="none" stroke="${s}" stroke-width="16" stroke-linejoin="round"/>
      <path d="${collarOuter}" fill="none" stroke="${p}" stroke-width="10" stroke-linejoin="round"/>
      <path d="${collarOuter}" fill="none" stroke="${t}" stroke-width="5" stroke-linejoin="round"/>
    `;
    tailsFill += `
      <path d="${leftTailEdges}" fill="none" stroke="${s}" stroke-width="15" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${s}" stroke-width="15" stroke-linejoin="round"/>
      <path d="${leftTailEdges}" fill="none" stroke="${p}" stroke-width="9" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${p}" stroke-width="9" stroke-linejoin="round"/>
      <path d="${leftTailEdges}" fill="none" stroke="${t}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${t}" stroke-width="4.5" stroke-linejoin="round"/>
    `;
  } else if (pattern === "triple-border") {
    collarFill += `
      <path d="${collarOuter}" fill="none" stroke="${s}" stroke-width="19" stroke-linejoin="round"/>
      <path d="${collarOuter}" fill="none" stroke="${t}" stroke-width="12" stroke-linejoin="round"/>
      <path d="${collarOuter}" fill="none" stroke="${s}" stroke-width="6" stroke-linejoin="round"/>
    `;
    tailsFill += `
      <path d="${leftTailEdges}" fill="none" stroke="${s}" stroke-width="18" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${s}" stroke-width="18" stroke-linejoin="round"/>
      <path d="${leftTailEdges}" fill="none" stroke="${t}" stroke-width="11" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${t}" stroke-width="11" stroke-linejoin="round"/>
      <path d="${leftTailEdges}" fill="none" stroke="${s}" stroke-width="5" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${s}" stroke-width="5" stroke-linejoin="round"/>
    `;
  } else if (pattern === "piped") {
    collarFill += `<path d="${collarOuter}" fill="none" stroke="${s}" stroke-width="5.5" stroke-linejoin="round"/>`;
    tailsFill += `
      <path d="${leftTailEdges}" fill="none" stroke="${s}" stroke-width="5" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${s}" stroke-width="5" stroke-linejoin="round"/>
    `;
  } else if (pattern === "halved") {
    collarFill = `
      <rect x="380" y="88" width="100" height="145" fill="${p}"/>
      <rect x="480" y="88" width="100" height="145" fill="${s}"/>
    `;
    tailsFill = `
      <rect x="444" y="218" width="36" height="240" fill="${p}"/>
      <rect x="480" y="218" width="40" height="240" fill="${s}"/>
    `;
  } else if (pattern === "halved-border") {
    collarFill = `
      <rect x="380" y="88" width="100" height="145" fill="${p}"/>
      <rect x="480" y="88" width="100" height="145" fill="${s}"/>
      <path d="${collarOuter}" fill="none" stroke="${t}" stroke-width="11" stroke-linejoin="round"/>
    `;
    tailsFill = `
      <rect x="444" y="218" width="36" height="240" fill="${p}"/>
      <rect x="480" y="218" width="40" height="240" fill="${s}"/>
      <path d="${leftTailEdges}" fill="none" stroke="${t}" stroke-width="10" stroke-linejoin="round"/>
      <path d="${rightTailEdges}" fill="none" stroke="${t}" stroke-width="10" stroke-linejoin="round"/>
    `;
  } else if (pattern === "striped") {
    const patId = `${idPrefix}-necker-stripe`;
    defs.push(`
      <pattern id="${patId}" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="20" height="20" fill="${p}"/>
        <rect width="8" height="20" fill="${s}"/>
        <rect x="9" width="2.4" height="20" fill="${t}"/>
      </pattern>
    `);
    collarFill = `<rect x="380" y="88" width="200" height="145" fill="url(#${patId})"/>`;
    tailsFill = `<rect x="444" y="218" width="76" height="240" fill="url(#${patId})"/>`;
  } else if (pattern === "tartan") {
    const patId = `${idPrefix}-necker-tartan`;
    defs.push(`
      <pattern id="${patId}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
        <rect width="24" height="24" fill="${p}"/>
        <rect x="0" y="0" width="9" height="24" fill="${s}" fill-opacity="0.62"/>
        <rect x="0" y="0" width="24" height="9" fill="${s}" fill-opacity="0.62"/>
        <rect x="14" y="0" width="2" height="24" fill="${t}" fill-opacity="0.9"/>
        <rect x="0" y="14" width="24" height="2" fill="${t}" fill-opacity="0.9"/>
      </pattern>
    `);
    collarFill = `<rect x="380" y="88" width="200" height="145" fill="url(#${patId})"/>`;
    tailsFill = `<rect x="444" y="218" width="76" height="240" fill="url(#${patId})"/>`;
  } else if (pattern === "quartered") {
    collarFill = `
      <rect x="380" y="88" width="100" height="72" fill="${p}"/>
      <rect x="480" y="88" width="100" height="72" fill="${s}"/>
      <rect x="380" y="160" width="100" height="73" fill="${s}"/>
      <rect x="480" y="160" width="100" height="73" fill="${p}"/>
    `;
    tailsFill = `
      <rect x="444" y="218" width="36" height="112" fill="${s}"/>
      <rect x="480" y="218" width="40" height="112" fill="${p}"/>
      <rect x="444" y="330" width="36" height="128" fill="${p}"/>
      <rect x="480" y="330" width="40" height="128" fill="${s}"/>
    `;
  } else if (pattern === "contrast-point") {
    collarFill = `
      <rect x="380" y="88" width="200" height="145" fill="${p}"/>
      <polygon points="448,100 512,100 480,148" fill="${s}"/>
    `;
    tailsFill = `
      <rect x="444" y="218" width="76" height="240" fill="${p}"/>
      <polygon points="452,374 508,374 480,448" fill="${s}"/>
    `;
  }

  return { defs: defs.join(""), collarFill, tailsFill, strokeOutline };
}

function renderNecker(state, layout, idPrefix) {
  if (!state.showNecker) return { defs: "", markup: "" };
  const necker = state.necker;
  const strokeOutline =
    state.diagramStyle === "official"
      ? layout.lineColor
      : isLightColor(necker.primary) && isLightColor(necker.secondary)
        ? "#4a5568"
        : "#1e293b";

  // Smooth rolled neckerchief collar + back triangle fold + two layered hanging tails.
  const collarPath =
    "M 432 104 Q 480 86 528 104 Q 554 114 564 144 Q 546 196 488 214 L 472 214 Q 414 196 396 144 Q 406 114 432 104 Z";
  const innerNeckCut =
    "M 434 112 Q 480 100 526 112 Q 534 134 516 156 Q 496 178 480 202 Q 464 178 444 156 Q 426 134 434 112 Z";
  const leftTailPath =
    "M 472 226 L 486 226 L 494 374 L 478 446 L 456 382 Z";
  const rightTailPath =
    "M 476 226 L 490 226 L 504 380 L 482 446 L 468 372 Z";

  const { defs, collarFill, tailsFill } = neckerPatternLayers(necker, idPrefix, strokeOutline);
  const collarClipId = `${idPrefix}-necker-collar-clip`;
  const leftTailClipId = `${idPrefix}-necker-ltail-clip`;
  const rightTailClipId = `${idPrefix}-necker-rtail-clip`;

  const woggleFill = esc(necker.woggle || "#6b3e26");
  const woggleStroke = isLightColor(necker.woggle || "#6b3e26") ? "#4a5568" : "#1a1a1a";

  const allDefs = `
    ${defs}
    <clipPath id="${collarClipId}"><path d="${collarPath}"/></clipPath>
    <clipPath id="${leftTailClipId}"><path d="${leftTailPath}"/></clipPath>
    <clipPath id="${rightTailClipId}"><path d="${rightTailPath}"/></clipPath>
  `;

  const markup = `
    <g class="ug-necker">
      <!-- Rolled collar & back point -->
      <g clip-path="url(#${collarClipId})">
        ${collarFill}
        <!-- Subtle inner neck shadow -->
        <path d="${innerNeckCut}" fill="rgba(0,0,0,0.08)"/>
      </g>
      <path d="${collarPath}" fill="none" stroke="${esc(strokeOutline)}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="${innerNeckCut}" fill="none" stroke="${esc(strokeOutline)}" stroke-width="1.3" stroke-opacity="0.55" stroke-linejoin="round"/>

      <!-- Hanging tails (right underneath, left slightly overlapping) -->
      <g clip-path="url(#${rightTailClipId})">
        ${tailsFill}
        <rect x="466" y="226" width="40" height="224" fill="rgba(0,0,0,0.07)"/>
      </g>
      <path d="${rightTailPath}" fill="none" stroke="${esc(strokeOutline)}" stroke-width="1.7" stroke-linejoin="round"/>

      <g clip-path="url(#${leftTailClipId})">
        ${tailsFill}
      </g>
      <path d="${leftTailPath}" fill="none" stroke="${esc(strokeOutline)}" stroke-width="1.7" stroke-linejoin="round"/>

      <!-- Woggle -->
      <rect x="469" y="206" width="22" height="28" rx="5" fill="${woggleFill}" stroke="${esc(woggleStroke)}" stroke-width="1.7"/>
      <path d="M 472 213 H 488 M 472 227 H 488" stroke="rgba(255,255,255,0.28)" stroke-width="1.1" stroke-linecap="round"/>
    </g>
  `;

  return { defs: allDefs, markup };
}

/**
 * Renders the primary + custom name tapes on the top of the right sleeve.
 */
function renderNameTapes(layout, idPrefix, selectedId, interactive) {
  const defs = [];
  const pieces = [];

  layout.tapes.forEach((tape, idx) => {
    const isSelected = interactive && selectedId === tape.id;
    const text = tape.displayText || "GROUP NAME";
    const fontSize = text.length > 22 ? 5.1 : text.length > 16 ? 5.9 : text.length > 11 ? 6.8 : 7.6;
    const w = tape.w;
    const h = tape.h;
    const hw = w / 2;
    const hh = h / 2;

    let shapeMarkup = "";
    if (tape.shape === "curved") {
      // Classic gentle upward arc matching woven UK Scout Group name tapes
      const arcDepth = 8;
      const ribbonPath = `M ${-hw} ${hh * 0.55} Q 0 ${-hh - arcDepth} ${hw} ${hh * 0.55} L ${hw - 1.5} ${hh + 2.5} Q 0 ${hh - arcDepth + 2} ${-hw + 1.5} ${hh + 2.5} Z`;
      const textPathId = `${idPrefix}-tapepath-${idx}`;
      defs.push(
        `<path id="${textPathId}" d="M ${-hw + 3} ${hh * 0.65} Q 0 ${-hh * 0.35 - arcDepth + 4.5} ${hw - 3} ${hh * 0.65}" fill="none"/>`,
      );
      shapeMarkup = `
        <path d="${ribbonPath}" fill="${esc(tape.bg)}" stroke="${esc(tape.border)}" stroke-width="1.3" stroke-linejoin="round"/>
        <text font-family="Nunito Sans, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" fill="${esc(tape.fg)}" letter-spacing="0.35">
          <textPath href="#${textPathId}" startOffset="50%" text-anchor="middle">${esc(text)}</textPath>
        </text>
      `;
    } else {
      shapeMarkup = `
        <rect x="${-hw}" y="${-hh}" width="${w}" height="${h}" rx="2.5" fill="${esc(tape.bg)}" stroke="${esc(tape.border)}" stroke-width="1.3"/>
        <text x="0" y="${(fontSize * 0.35).toFixed(2)}" text-anchor="middle" font-family="Nunito Sans, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" fill="${esc(tape.fg)}" letter-spacing="0.3">${esc(text)}</text>
      `;
    }

    const hitAttrs = interactive
      ? `data-item-id="${esc(tape.id)}" data-item-kind="${esc(tape.kind)}" tabindex="0" role="button" aria-label="${esc(tape.calloutLabel)}: ${esc(text)}"`
      : "";

    pieces.push(`
      <g class="ug-badge ug-tape${isSelected ? " is-selected" : ""}" transform="translate(${tape.x.toFixed(1)} ${tape.y.toFixed(1)}) rotate(${tape.rotation})" ${hitAttrs}>
        ${isSelected ? `<rect x="${-hw - 5}" y="${-hh - 7}" width="${w + 10}" height="${h + 14}" rx="6" class="ug-selection-ring"/>` : ""}
        ${shapeMarkup}
      </g>
    `);
  });

  return { defs: defs.join(""), markup: pieces.join("") };
}

/**
 * Renders a single badge (or multi-badge cluster) with optional uploaded image, icon, or short text.
 */
function renderSingleBadge(badge, state, layout, idPrefix, selectedId, interactive, artworkMap = null) {
  const isSelected = interactive && selectedId === badge.id;
  const style = state.diagramStyle || "colour";
  const scale = badge.scale || 1;
  const rot = badge.rotation || 0;
  const useOfficialArt = style !== "official";
  const resolveArtHref = (path) => (path ? artworkMap?.[path] || path : "");

  const badgeFill =
    style === "official"
      ? "#ffffff"
      : style === "ink-saver"
        ? "#f7f8fa"
        : badge.fill;
  const badgeStroke =
    style === "official"
      ? layout.lineColor
      : style === "ink-saver"
        ? "#3b4252"
        : badge.stroke;
  const glyphColor =
    style === "official"
      ? layout.lineColor
      : style === "ink-saver"
        ? "#2d3748"
        : badge.textColor || (isLightColor(badgeFill) ? "#1a1a1a" : "#ffffff");

  let defs = "";
  let inner = "";

  if (badge.shape === "challenge-cluster") {
    const count = Math.max(1, Math.min(10, badge.count || 6));
    const r = 10.6;
    const dx = 21.2;
    // Arrange neatly in official honeycomb rows matching Squirrels(4), Beavers(2-1-2-1), Cubs(2-3-2), Scouts(2-3-4).
    const rowsByCount = {
      1: [1],
      2: [2],
      3: [1, 2],
      4: [2, 2],
      5: [2, 3],
      6: [2, 1, 2, 1],
      7: [2, 3, 2],
      8: [2, 3, 3],
      9: [2, 3, 4],
      10: [2, 3, 3, 2],
    };
    const rows = rowsByCount[count] || [2, 3, 2];
    const rowOffsets = [0];
    for (let rIdx = 1; rIdx < rows.length; rIdx += 1) {
      const sameParity = rows[rIdx] % 2 === rows[rIdx - 1] % 2;
      rowOffsets.push(rowOffsets[rIdx - 1] + (sameParity ? 24.4 : 18.2));
    }
    const totalH = rowOffsets[rowOffsets.length - 1];
    const startY = -totalH / 2;
    const hexW = 20.4;
    const hexH = 23.5;
    const artItems = useOfficialArt && Array.isArray(badge.artworkItems) ? badge.artworkItems : [];
    const hexes = [];
    let artIdx = 0;
    rows.forEach((cols, rowIdx) => {
      const rowY = startY + rowOffsets[rowIdx];
      const startX = -((cols - 1) * dx) / 2;
      for (let c = 0; c < cols; c += 1) {
        const cx = startX + c * dx;
        const artPath = artItems.length ? artItems[artIdx % artItems.length] : "";
        const href = artPath ? resolveArtHref(artPath) : "";
        artIdx += 1;
        if (href) {
          hexes.push(`
            <g transform="translate(${cx.toFixed(1)} ${rowY.toFixed(1)})">
              <image href="${esc(href)}" x="${(-hexW / 2).toFixed(2)}" y="${(-hexH / 2).toFixed(2)}" width="${hexW.toFixed(2)}" height="${hexH.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>
            </g>
          `);
        } else {
          hexes.push(`
            <g transform="translate(${cx.toFixed(1)} ${rowY.toFixed(1)})">
              <g fill="${esc(badgeFill)}" stroke="${esc(badgeStroke)}" stroke-width="1.35" stroke-linejoin="round">
                ${badgeShapeElement("hexagon", r * 1.92, r * 2.02)}
              </g>
            </g>
          `);
        }
      }
    });
    inner = hexes.join("");
  } else if (badge.shape === "activity-column") {
    const count = Math.max(1, Math.min(6, badge.count || 3));
    const r = 10.8;
    const artSize = r * 2.15;
    const spacing = 26;
    const startY = -((count - 1) * spacing) / 2;
    const artItems = useOfficialArt && Array.isArray(badge.artworkItems) ? badge.artworkItems : [];
    const circles = [];
    for (let i = 0; i < count; i += 1) {
      const cy = startY + i * spacing;
      const artPath = artItems.length ? artItems[i % artItems.length] : "";
      const href = artPath ? resolveArtHref(artPath) : "";
      if (href) {
        circles.push(
          `<image href="${esc(href)}" x="${(-artSize / 2).toFixed(2)}" y="${(cy - artSize / 2).toFixed(2)}" width="${artSize.toFixed(2)}" height="${artSize.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`,
        );
      } else {
        circles.push(
          `<circle cx="0" cy="${cy.toFixed(1)}" r="${r}" fill="${esc(badgeFill)}" stroke="${esc(badgeStroke)}" stroke-width="1.4"/>`,
        );
      }
    }
    inner = circles.join("");
  } else if (badge.shape === "joining-row") {
    const count = Math.max(1, Math.min(12, badge.count || 3));
    const perRow = 6;
    const numRows = Math.ceil(count / perRow);
    const sz = count > perRow ? 13.5 : 14.5;
    const gap = count > perRow ? 2.2 : 2.6;
    const rowStep = 15.5;
    const startY = -((numRows - 1) * rowStep) / 2;
    const artItems = useOfficialArt && Array.isArray(badge.artworkItems) ? badge.artworkItems : [];
    const boxes = [];
    for (let i = 0; i < count; i += 1) {
      const rowIdx = Math.floor(i / perRow);
      const colIdx = i % perRow;
      const colsInRow = Math.min(perRow, count - rowIdx * perRow);
      const totalW = colsInRow * sz + (colsInRow - 1) * gap;
      const startX = -totalW / 2 + sz / 2;
      const cx = startX + colIdx * (sz + gap);
      const cy = startY + rowIdx * rowStep;
      const artPath = artItems.length ? artItems[i % artItems.length] : "";
      const href = artPath ? resolveArtHref(artPath) : "";
      if (href) {
        boxes.push(
          `<image href="${esc(href)}" x="${(cx - sz / 2).toFixed(2)}" y="${(cy - sz / 2).toFixed(2)}" width="${sz.toFixed(2)}" height="${sz.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`,
        );
      } else {
        boxes.push(`
          <g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">
            <rect x="${(-sz / 2).toFixed(1)}" y="${(-sz / 2).toFixed(1)}" width="${sz}" height="${sz}" rx="2" fill="${esc(badgeFill)}" stroke="${esc(badgeStroke)}" stroke-width="1.3"/>
            <text x="0" y="3.1" text-anchor="middle" font-family="Nunito Sans, system-ui, sans-serif" font-size="8" font-weight="800" fill="${esc(glyphColor)}">${i + 1}</text>
          </g>
        `);
      }
    }
    inner = boxes.join("");
  } else {
    const w = badge.w || 22;
    const h = badge.h || 22;
    const shapeEl = badgeShapeElement(badge.shape, w, h);
    const officialHref = useOfficialArt && badge.artworkPath ? resolveArtHref(badge.artworkPath) : "";

    if (badge.imageDataUrl) {
      const clipId = `${idPrefix}-imgclip-${badge.id.replace(/[^a-z0-9_-]/gi, "")}`;
      defs += `<clipPath id="${clipId}">${shapeEl}</clipPath>`;
      inner = `
        <g fill="${esc(badgeFill)}" stroke="none">${shapeEl}</g>
        <image href="${esc(badge.imageDataUrl)}" x="${(-w / 2).toFixed(2)}" y="${(-h / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
        <g fill="none" stroke="${esc(badgeStroke)}" stroke-width="1.5" stroke-linejoin="round">${shapeEl}</g>
      `;
    } else if (officialHref) {
      inner = `<image href="${esc(officialHref)}" x="${(-w / 2).toFixed(2)}" y="${(-h / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`;
    } else {
      let detail = "";
      const customText = String(badge.text || "").trim();
      if (customText) {
        const len = customText.length;
        const fs = Math.max(5.5, Math.min(h * 0.48, (w * 1.45) / Math.max(2, len)));
        detail = `<text x="0" y="${(fs * 0.36).toFixed(2)}" text-anchor="middle" font-family="Nunito Sans, system-ui, sans-serif" font-size="${fs.toFixed(1)}" font-weight="900" fill="${esc(glyphColor)}">${esc(customText.slice(0, 8))}</text>`;
      } else if (badge.icon && badge.icon !== "none") {
        const iconScale = Math.min(w, h) / 26;
        detail = `<g transform="scale(${iconScale.toFixed(2)})">${iconPathMarkup(badge.icon, glyphColor)}</g>`;
      } else if (badge.shape === "bar" && badge.id === "leadership-stripe") {
        detail = `<line x1="${(-w * 0.36).toFixed(1)}" y1="0" x2="${(w * 0.36).toFixed(1)}" y2="0" stroke="${esc(glyphColor)}" stroke-width="1.8" stroke-linecap="round"/>`;
      }

      inner = `
        <g fill="${esc(badgeFill)}" stroke="${esc(badgeStroke)}" stroke-width="1.45" stroke-linejoin="round">
          ${shapeEl}
        </g>
        ${detail}
      `;
    }
  }

  const ringW = Math.max(badge.w || 24, 24) + 12;
  const ringH = Math.max(badge.h || 24, 24) + 12;
  const hitAttrs = interactive
    ? `data-item-id="${esc(badge.id)}" data-item-kind="${esc(badge.kind)}" tabindex="0" role="button" aria-label="${esc(badge.label)}"`
    : "";

  const markup = `
    <g class="ug-badge${badge.kind === "custom" ? " ug-badge--custom" : ""}${isSelected ? " is-selected" : ""}" transform="translate(${badge.x.toFixed(1)} ${badge.y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)})" ${hitAttrs}>
      ${isSelected ? `<rect x="${(-ringW / 2).toFixed(1)}" y="${(-ringH / 2).toFixed(1)}" width="${ringW.toFixed(1)}" height="${ringH.toFixed(1)}" rx="7" class="ug-selection-ring"/>` : ""}
      ${inner}
    </g>
  `;

  return { defs, markup };
}

function renderBeltBuckles(state, layout) {
  if (!layout.showBeltBuckles) return "";
  const stroke = state.diagramStyle === "official" ? layout.lineColor : "#3b4252";
  const labelColor = state.diagramStyle === "official" ? layout.lineColor : "#2d3748";
  const fillMetal = state.diagramStyle === "colour" ? "#d6dce5" : "#ffffff";
  const fillDark = state.diagramStyle === "colour" ? "#3b4252" : "#ffffff";

  return `
    <g class="ug-belt-buckles" transform="translate(0 12)">
      <!-- Explorer Belt buckle -->
      <g transform="translate(418 654)">
        <rect x="-36" y="-14" width="72" height="28" rx="4" fill="${esc(fillMetal)}" stroke="${esc(stroke)}" stroke-width="1.5"/>
        <rect x="-30" y="-9" width="8" height="18" rx="1.5" fill="#ffffff" stroke="${esc(stroke)}" stroke-width="1.2"/>
        <rect x="22" y="-9" width="8" height="18" rx="1.5" fill="#ffffff" stroke="${esc(stroke)}" stroke-width="1.2"/>
        <circle cx="0" cy="0" r="14" fill="${esc(fillDark)}" stroke="${esc(stroke)}" stroke-width="1.5"/>
        <g transform="scale(1.15)">${iconPathMarkup("fleur", state.diagramStyle === "colour" ? "#ffffff" : stroke)}</g>
        <text x="0" y="30" text-anchor="middle" font-family="Nunito Sans, system-ui, sans-serif" font-size="10.5" font-weight="700" fill="${esc(labelColor)}">Explorer Belt</text>
      </g>
      <!-- Young Leader's Belt Buckle -->
      <g transform="translate(548 654)">
        <rect x="-38" y="-14" width="76" height="28" rx="4" fill="${esc(fillMetal)}" stroke="${esc(stroke)}" stroke-width="1.5"/>
        <rect x="-32" y="-9" width="8" height="18" rx="1.5" fill="#ffffff" stroke="${esc(stroke)}" stroke-width="1.2"/>
        <rect x="24" y="-9" width="8" height="18" rx="1.5" fill="#ffffff" stroke="${esc(stroke)}" stroke-width="1.2"/>
        <ellipse cx="0" cy="0" rx="18" ry="13" fill="${esc(fillDark)}" stroke="${esc(stroke)}" stroke-width="1.5"/>
        <g transform="scale(1.05)">${iconPathMarkup("shield", state.diagramStyle === "colour" ? "#ffe627" : stroke)}</g>
        <text x="0" y="30" text-anchor="middle" font-family="Nunito Sans, system-ui, sans-serif" font-size="10.5" font-weight="700" fill="${esc(labelColor)}">Young Leader’s Belt Buckle</text>
      </g>
    </g>
  `;
}

function renderCallouts(state, layout, selectedId, interactive) {
  if (!state.showCallouts || !layout.callouts.length) return "";
  const lineColor = state.diagramStyle === "official" ? layout.lineColor : "#4b5563";
  const textColor = state.diagramStyle === "official" ? layout.lineColor : "#1f2937";
  const dotFill = state.diagramStyle === "official" ? layout.lineColor : "#590fa9";

  return `
    <g class="ug-callouts">
      ${layout.callouts
        .map((callout) => {
          const isSelected = interactive && selectedId === callout.id;
          const anchor = callout.side === "left" ? "end" : "start";
          const lineHeight = 13.5;
          const firstLineY = callout.labelY - ((callout.lines.length - 1) * lineHeight) / 2 + 3.8;
          const tspans = callout.lines
            .map(
              (line, idx) =>
                `<tspan x="${callout.labelX}" y="${(firstLineY + idx * lineHeight).toFixed(1)}">${esc(line)}</tspan>`,
            )
            .join("");

          const attrs = interactive
            ? `data-item-id="${esc(callout.id)}" data-item-kind="${esc(callout.kind)}"`
            : "";

          return `
            <g class="ug-callout${isSelected ? " is-selected" : ""}" ${attrs}>
              <polyline
                class="ug-callout__line"
                points="${callout.tickStartX.toFixed(1)},${callout.elbowY.toFixed(1)} ${callout.elbowX.toFixed(1)},${callout.elbowY.toFixed(1)} ${callout.targetX.toFixed(1)},${callout.targetY.toFixed(1)}"
                fill="none"
                stroke="${esc(lineColor)}"
                stroke-width="1.15"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle class="ug-callout__dot" cx="${callout.targetX.toFixed(1)}" cy="${callout.targetY.toFixed(1)}" r="2.7" fill="${esc(dotFill)}" stroke="#ffffff" stroke-width="0.9"/>
              <text
                class="ug-callout__label"
                text-anchor="${anchor}"
                font-family="Nunito Sans, system-ui, sans-serif"
                font-size="11.2"
                font-weight="700"
                fill="${esc(textColor)}"
              >${tspans}</text>
            </g>
          `;
        })
        .join("")}
    </g>
  `;
}

/**
 * Generates the complete uniform diagram SVG string.
 */
export function renderUniformSvg(
  state,
  layout,
  {
    interactive = true,
    includeCallouts = true,
    includeHeader = false,
    selectedId = null,
    idPrefix = "ug",
    embedFontCss = "",
    artworkMap = null,
    background = "transparent",
  } = {},
) {
  const height = layout.showBeltBuckles ? CANVAS.height : 690;
  const necker = renderNecker(state, layout, idPrefix);
  const tapes = renderNameTapes(layout, idPrefix, selectedId, interactive);

  const badgeDefs = [];
  const badgeMarkup = [];
  layout.visibleBadges.forEach((badge) => {
    const rendered = renderSingleBadge(badge, state, layout, idPrefix, selectedId, interactive, artworkMap);
    if (rendered.defs) badgeDefs.push(rendered.defs);
    badgeMarkup.push(rendered.markup);
  });

  const headerBlock = includeHeader
    ? `
      <text x="32" y="42" font-family="Nunito Sans, system-ui, sans-serif" font-size="22" font-weight="900" fill="${esc(layout.section.accent)}">${esc(layout.title)}</text>
      ${
        state.districtName || state.countyName
          ? `<text x="32" y="61" font-family="Nunito Sans, system-ui, sans-serif" font-size="12" font-weight="700" fill="#5f5f5f">${esc(
              [state.districtName, state.countyName].filter(Boolean).join(" • "),
            )}</text>`
          : ""
      }
    `
    : "";

  const bgRect =
    background && background !== "transparent"
      ? `<rect x="0" y="0" width="${CANVAS.width}" height="${height}" fill="${esc(background)}"/>`
      : "";

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${CANVAS.width} ${height}"
      width="${CANVAS.width}"
      height="${height}"
      class="ug-svg${interactive ? " ug-svg--interactive" : ""}"
      role="img"
      aria-label="${esc(layout.title)} badge placement diagram"
    >
      <defs>
        ${embedFontCss ? `<style>${embedFontCss}</style>` : ""}
        ${necker.defs}
        ${tapes.defs}
        ${badgeDefs.join("")}
      </defs>
      ${bgRect}
      ${headerBlock}
      ${renderGarment(state, layout)}
      ${necker.markup}
      <g class="ug-badges">
        ${tapes.markup}
        ${badgeMarkup.join("")}
      </g>
      ${renderBeltBuckles(state, layout)}
      ${includeCallouts ? renderCallouts(state, layout, selectedId, interactive) : ""}
    </svg>
  `.trim();
}

/**
 * Generates a standalone triangular necker preview SVG (used in the Necker customiser panel & PDF summary).
 */
export function renderNeckerPreviewSvg(necker, idPrefix = "np") {
  const { pattern, primary, secondary, tertiary, woggle } = necker;
  const p = esc(primary);
  const s = esc(secondary);
  const t = esc(tertiary);
  const w = esc(woggle || "#6b3e26");

  const triPath = "M 18 16 L 182 16 L 100 104 Z";
  const edgePath = "M 18 16 L 100 104 L 182 16";
  const clipId = `${idPrefix}-tri-clip`;
  let defs = `<clipPath id="${clipId}"><path d="${triPath}"/></clipPath>`;
  let body = `<rect x="0" y="0" width="200" height="120" fill="${p}"/>`;

  if (pattern === "single-border") {
    body += `<path d="${edgePath}" fill="none" stroke="${s}" stroke-width="18" stroke-linejoin="round"/>`;
  } else if (pattern === "double-border") {
    body += `
      <path d="${edgePath}" fill="none" stroke="${s}" stroke-width="22" stroke-linejoin="round"/>
      <path d="${edgePath}" fill="none" stroke="${p}" stroke-width="13" stroke-linejoin="round"/>
      <path d="${edgePath}" fill="none" stroke="${t}" stroke-width="6" stroke-linejoin="round"/>
    `;
  } else if (pattern === "triple-border") {
    body += `
      <path d="${edgePath}" fill="none" stroke="${s}" stroke-width="26" stroke-linejoin="round"/>
      <path d="${edgePath}" fill="none" stroke="${t}" stroke-width="16" stroke-linejoin="round"/>
      <path d="${edgePath}" fill="none" stroke="${s}" stroke-width="7" stroke-linejoin="round"/>
    `;
  } else if (pattern === "piped") {
    body += `<path d="${edgePath}" fill="none" stroke="${s}" stroke-width="7" stroke-linejoin="round"/>`;
  } else if (pattern === "halved") {
    body = `<rect x="0" y="0" width="100" height="120" fill="${p}"/><rect x="100" y="0" width="100" height="120" fill="${s}"/>`;
  } else if (pattern === "halved-border") {
    body = `
      <rect x="0" y="0" width="100" height="120" fill="${p}"/>
      <rect x="100" y="0" width="100" height="120" fill="${s}"/>
      <path d="${edgePath}" fill="none" stroke="${t}" stroke-width="15" stroke-linejoin="round"/>
    `;
  } else if (pattern === "striped") {
    const pid = `${idPrefix}-pat-s`;
    defs += `<pattern id="${pid}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="22" height="22" fill="${p}"/><rect width="9" height="22" fill="${s}"/><rect x="10" width="2.5" height="22" fill="${t}"/></pattern>`;
    body = `<rect x="0" y="0" width="200" height="120" fill="url(#${pid})"/>`;
  } else if (pattern === "tartan") {
    const pid = `${idPrefix}-pat-t`;
    defs += `<pattern id="${pid}" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="26" height="26" fill="${p}"/><rect width="10" height="26" fill="${s}" fill-opacity="0.62"/><rect width="26" height="10" fill="${s}" fill-opacity="0.62"/><rect x="15" width="2.2" height="26" fill="${t}"/><rect y="15" width="26" height="2.2" fill="${t}"/></pattern>`;
    body = `<rect x="0" y="0" width="200" height="120" fill="url(#${pid})"/>`;
  } else if (pattern === "quartered") {
    body = `
      <rect x="0" y="0" width="100" height="54" fill="${p}"/>
      <rect x="100" y="0" width="100" height="54" fill="${s}"/>
      <rect x="0" y="54" width="100" height="66" fill="${s}"/>
      <rect x="100" y="54" width="100" height="66" fill="${p}"/>
    `;
  } else if (pattern === "contrast-point") {
    body = `
      <rect x="0" y="0" width="200" height="120" fill="${p}"/>
      <polygon points="74,76 126,76 100,106" fill="${s}"/>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 116" width="200" height="116" aria-hidden="true">
      <defs>${defs}</defs>
      <g clip-path="url(#${clipId})">${body}</g>
      <path d="${triPath}" fill="none" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
      <rect x="90" y="8" width="20" height="22" rx="4" fill="${w}" stroke="#1e293b" stroke-width="1.8"/>
    </svg>
  `.trim();
}
