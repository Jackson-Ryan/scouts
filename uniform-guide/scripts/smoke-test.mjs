#!/usr/bin/env node
/**
 * Smoke test for the Interactive Uniform & Badge Placement Guide.
 *
 * Run with: npm run smoke:uniform
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  NECKER_PATTERNS,
  OFFICIAL_VARIANT_OPTIONS,
  SECTIONS,
  createDefaultState,
  normaliseState,
} from "../assets/js/uniform-data.js";
import { collectArtworkPaths, resolveUniformLayout } from "../assets/js/uniform-layout.js";
import { renderNeckerPreviewSvg, renderUniformSvg } from "../assets/js/uniform-svg.js";
import { createUniformPdf, uniformPdfFilename } from "../assets/js/uniform-pdf.js";

function loadJsPdf() {
  const code = readFileSync(new URL("../../kit-list/assets/js/vendor/jspdf.umd.min.js", import.meta.url), "utf8");
  const module = { exports: {} };
  new Function("exports", "module", code)(module.exports, module);
  return module.exports.jsPDF;
}

// 1. Verify all 7 sections and all 16 official uniform variants resolve & render clean SVG.
let variantCount = 0;
for (const section of SECTIONS) {
  for (const variant of section.variants) {
    variantCount += 1;
    const state = normaliseState({
      ...createDefaultState(),
      section: section.id,
      variant: variant.id,
      groupName: "1st Boxford",
    });
    const layout = resolveUniformLayout(state);
    assert.ok(layout.visibleBadges.length >= 10, `${section.id}/${variant.id} should have official badges`);
    assert.equal(layout.tapes.length, 1);
    assert.equal(layout.tapes[0].displayText, "1ST BOXFORD");

    // Check left and right callouts never overlap vertically.
    for (const sideCallouts of [layout.leftCallouts, layout.rightCallouts]) {
      for (let i = 1; i < sideCallouts.length; i += 1) {
        const prev = sideCallouts[i - 1];
        const curr = sideCallouts[i];
        const prevBottom = prev.labelY + prev.height / 2;
        const currTop = curr.labelY - curr.height / 2;
        assert.ok(
          currTop >= prevBottom - 0.5,
          `Callout overlap on ${section.id}/${variant.id} between "${prev.label}" and "${curr.label}"`,
        );
      }
    }

    const svg = renderUniformSvg(state, layout);
    assert.ok(svg.startsWith("<svg"), "expected valid SVG root");
    assert.ok(svg.includes("1ST BOXFORD"), "expected group name tape text inside SVG");
    assert.ok(svg.includes("assets/badges/shared/world-membership.svg"), "expected official SVG artwork in colour mode");

    for (const artPath of collectArtworkPaths(layout)) {
      const diskUrl = new URL(`../${artPath}`, import.meta.url);
      assert.ok(existsSync(diskUrl), `Missing official badge SVG referenced by ${section.id}/${variant.id}: ${artPath}`);
    }

    const officialLineState = { ...state, diagramStyle: "official" };
    const officialSvg = renderUniformSvg(officialLineState, resolveUniformLayout(officialLineState));
    assert.equal(officialSvg.includes("assets/badges/"), false, "official line-art mode should omit full-colour badge SVGs");
  }
}
assert.equal(SECTIONS.length, 7, "expected all 7 UK Scout sections");
assert.equal(variantCount, 17, "expected all 17 uniform variants (16 official layouts + dedicated Sea Cubs)");

// 1b. Validate manifest.json & all 260 extracted official Scouts badge SVGs on disk.
const manifest = JSON.parse(readFileSync(new URL("../assets/badges/manifest.json", import.meta.url), "utf8"));
const manifestEntries = Object.values(manifest.badges || {});
assert.equal(manifest.count, 260, "expected manifest count to be 260");
assert.equal(manifestEntries.length, 260, "expected 260 badge entries in manifest.json");
for (const entry of manifestEntries) {
  const fileUrl = new URL(`../${entry.path}`, import.meta.url);
  assert.ok(existsSync(fileUrl), `Missing badge asset on disk: ${entry.path}`);
  const svgText = readFileSync(fileUrl, "utf8");
  assert.ok(svgText.includes("<svg"), `Invalid SVG content in ${entry.path}`);
}
for (const opts of Object.values(OFFICIAL_VARIANT_OPTIONS)) {
  for (const opt of opts) {
    if (opt.path) {
      assert.ok(existsSync(new URL(`../${opt.path}`, import.meta.url)), `Missing variant asset: ${opt.path}`);
    }
  }
}

// 1c. Verify artworkMap data URI replacement, 12 Joining In awards, and custom artworkPath persistence.
const dataUriCheckState = normaliseState({
  ...createDefaultState(),
  section: "cubs",
  badgeOverrides: { "joining-in": { count: 12 } },
  customBadges: [
    {
      id: "cb-official",
      label: "Custom Staged Swimmer",
      zone: "left-sleeve",
      shape: "circle",
      x: 650,
      y: 420,
      artworkPath: "assets/badges/shared/staged-swimmer.svg",
    },
  ],
});
const dataUriCheckLayout = resolveUniformLayout(dataUriCheckState);
const inlinedSvg = renderUniformSvg(dataUriCheckState, dataUriCheckLayout, {
  artworkMap: {
    "assets/badges/shared/world-membership.svg": "data:image/svg+xml;base64,WORLD_TEST",
    "assets/badges/shared/staged-swimmer.svg": "data:image/svg+xml;base64,SWIM_TEST",
  },
});
assert.ok(inlinedSvg.includes("data:image/svg+xml;base64,WORLD_TEST"), "expected artworkMap substitution for official badge");
assert.ok(inlinedSvg.includes("data:image/svg+xml;base64,SWIM_TEST"), "expected artworkMap substitution for custom library badge");
assert.ok(inlinedSvg.includes("assets/badges/shared/joining-in-12.svg"), "expected Joining In Award 12 to render when count=12");

// 2. Verify Nation rules (England, Scotland, Wales, Northern Ireland).
const englandLayout = resolveUniformLayout(normaliseState({ ...createDefaultState(), nation: "england" }));
assert.equal(englandLayout.visibleBadges.some((b) => b.id === "wales-right" || b.id === "scotland"), false);

const walesLayout = resolveUniformLayout(normaliseState({ ...createDefaultState(), nation: "wales" }));
assert.equal(walesLayout.visibleBadges.filter((b) => b.id.startsWith("wales-")).length, 2);

const scotlandLayout = resolveUniformLayout(normaliseState({ ...createDefaultState(), nation: "scotland" }));
assert.ok(scotlandLayout.visibleBadges.some((b) => b.id === "scotland"));

const niLayout = resolveUniformLayout(normaliseState({ ...createDefaultState(), nation: "ni" }));
const ulster = niLayout.visibleBadges.find((b) => b.id === "ulster");
const niCounty = niLayout.visibleBadges.find((b) => b.id === "county");
const niDistrict = niLayout.visibleBadges.find((b) => b.id === "district");
assert.ok(ulster && niCounty && niDistrict, "Northern Ireland layout should include Ulster, County and District");
assert.ok(niDistrict.y > niCounty.y, "District badge should sit centrally below Ulster and County in NI");
assert.ok(niLayout.footnotes.some((fn) => fn.includes("Northern Ireland")));

// 3. Verify custom name tapes above & below stack cleanly and shift sleeve badges down.
const baseBeavers = resolveUniformLayout(createDefaultState());
const baseCountyY = baseBeavers.visibleBadges.find((b) => b.id === "county").y;

const multiTapeState = normaliseState({
  ...createDefaultState(),
  section: "beavers",
  groupName: "4th Colchester",
  districtName: "Colchester North",
  tapes: {
    primary: { ...createDefaultState().tapes.primary },
    custom: [
      { id: "t-above", position: "above", text: "COLCHESTER NORTH", calloutLabel: "District Name Tape" },
      { id: "t-below", position: "below", text: "SEA SCOUTS", calloutLabel: "Sea Scouts Tape" },
    ],
  },
  customBadges: [
    {
      id: "cb-dist",
      label: "Colchester Exclusive Badge",
      zone: "right-sleeve",
      shape: "shield",
      x: 320,
      y: 430,
      fill: "#590fa9",
      stroke: "#ffe627",
      icon: "star",
    },
  ],
  badgeOverrides: {
    cornwell: { visible: false },
    district: { label: "Custom Colchester District Badge", fill: "#d62828" },
  },
});
const multiLayout = resolveUniformLayout(multiTapeState);
assert.equal(multiLayout.tapes.length, 3);
assert.equal(multiLayout.tapes[0].displayText, "COLCHESTER NORTH");
assert.equal(multiLayout.tapes[1].displayText, "4TH COLCHESTER");
assert.equal(multiLayout.tapes[2].displayText, "SEA SCOUTS");
assert.ok(multiLayout.tapes[0].y < multiLayout.tapes[1].y && multiLayout.tapes[1].y < multiLayout.tapes[2].y);

const shiftedCountyY = multiLayout.visibleBadges.find((b) => b.id === "county").y;
assert.ok(shiftedCountyY > baseCountyY + 20, "extra name tapes should shift lower right-sleeve badges downward");
assert.equal(multiLayout.visibleBadges.some((b) => b.id === "cornwell"), false, "hidden badge should not render");
assert.equal(
  multiLayout.visibleBadges.find((b) => b.id === "district").label,
  "Custom Colchester District Badge",
);
assert.ok(multiLayout.visibleBadges.some((b) => b.id === "cb-dist"));

// 4. Verify all 11 necker patterns render cleanly in full SVG & necker preview SVG.
for (const pat of NECKER_PATTERNS) {
  const s = normaliseState({
    ...createDefaultState(),
    necker: { ...createDefaultState().necker, pattern: pat.id },
  });
  const svg = renderUniformSvg(s, resolveUniformLayout(s), { idPrefix: `t-${pat.id}` });
  const prev = renderNeckerPreviewSvg(s.necker, `p-${pat.id}`);
  assert.ok(svg.includes("ug-necker"), `pattern ${pat.id} missing necker group`);
  assert.ok(prev.startsWith("<svg"), `pattern ${pat.id} preview invalid`);
}

// 5. Verify real A4 PDF output with embedded Nunito Sans fonts (both 2-page with sewing key & 1-page without).
const jsPDF = loadJsPdf();
const fonts = {
  regular: readFileSync(new URL("../../kit-list/assets/fonts/NunitoSans-Regular.ttf", import.meta.url)).toString("base64"),
  bold: readFileSync(new URL("../../kit-list/assets/fonts/NunitoSans-Bold.ttf", import.meta.url)).toString("base64"),
  black: readFileSync(new URL("../../kit-list/assets/fonts/NunitoSans-Black.ttf", import.meta.url)).toString("base64"),
};

const docWithKey = createUniformPdf({ jsPDF, state: multiTapeState, layout: multiLayout, fonts });
assert.ok(docWithKey.getNumberOfPages() >= 2, "expected 2+ pages when sewing key is enabled");

const singlePageState = { ...multiTapeState, includeSewingKeyInPdf: false };
const docSingle = createUniformPdf({ jsPDF, state: singlePageState, fonts });
assert.equal(docSingle.getNumberOfPages(), 1, "expected 1 page when sewing key is disabled");

const filename = uniformPdfFilename(multiTapeState, multiLayout);
assert.equal(filename, "4th-colchester-beaver-scout-uniform-uniform-guide.pdf");

const outputPath = join(tmpdir(), `scout-uniform-guide-smoke-${process.pid}.pdf`);
writeFileSync(outputPath, Buffer.from(docWithKey.output("arraybuffer")));
const pdfBytes = readFileSync(outputPath);
unlinkSync(outputPath);
assert.ok(pdfBytes.length > 10000, "expected real PDF with embedded Nunito Sans fonts");
assert.equal(pdfBytes.subarray(0, 5).toString(), "%PDF-");

console.log(
  `Uniform Guide smoke test passed: ${SECTIONS.length} sections, ${variantCount} variants, ${NECKER_PATTERNS.length} necker patterns, ${docWithKey.getNumberOfPages()} PDF pages.`,
);
