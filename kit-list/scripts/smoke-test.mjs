#!/usr/bin/env node
/**
 * Smoke test for the Kit List Generator.
 *
 * Run with: npm run smoke:kit
 */

import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildKitList, defaultAnswers, csvRows } from "../assets/js/kit-data.js";
import { buildCsv } from "../assets/js/kit-csv.js";
import { createKitListPdf } from "../assets/js/kit-pdf.js";

function loadJsPdf() {
  const code = readFileSync(new URL("../assets/js/vendor/jspdf.umd.min.js", import.meta.url), "utf8");
  const module = { exports: {} };
  new Function("exports", "module", code)(module.exports, module);
  return module.exports.jsPDF;
}

function itemNames(list) {
  return list.groups.flatMap((group) => group.items.map((item) => item.name));
}

function itemIds(list) {
  return list.groups.flatMap((group) => group.items.map((item) => item.id));
}

const base = {
  ...defaultAnswers(),
  section: "cubs",
  tripType: "weekend",
  nights: 2,
  weather: ["mild"],
  accommodation: "tent",
};

// Default night counts follow the section conventions.
assert.equal(buildKitList({ ...base, section: "beavers", nights: 1 }).nights, 1);
assert.equal(buildKitList({ ...base, section: "cubs" }).nights, 2);
assert.equal(buildKitList({ ...base, section: "scouts" }).nights, 2);

// A day trip never includes sleeping kit.
const dayTrip = buildKitList({ ...base, tripType: "day", nights: 0, activities: ["hiking"] });
assert.equal(dayTrip.nights, 0);
assert.equal(itemNames(dayTrip).some((name) => name.toLowerCase().includes("sleeping bag")), false);

// A sleepover is always indoors, even if the previous answer said tent.
const sleepover = buildKitList({ ...base, tripType: "sleepover", accommodation: "tent", nights: 1 });
assert.equal(sleepover.accommodation, "Indoor");
assert.equal(itemNames(sleepover).includes("Tent"), false);
assert.ok(itemNames(sleepover).includes("Sleeping bag"));

// Paddling with showers adds the extra shower kit parents always forget.
const paddling = buildKitList({
  ...base,
  season: "summer",
  showers: "yes",
  activities: ["water"],
  activityOptions: { water: { types: ["paddle"], sessions: "2", wetsuit: "provided", showers: "yes" } },
});
const names = itemNames(paddling);
assert.ok(names.includes("Extra shower kit for after paddling"), "expected the extra shower kit");
assert.ok(names.includes("Swimming costume or trunks"), "expected swimwear");
assert.equal(paddling.groups.flatMap((group) => group.items).find((item) => item.id === "swimwear").qty, "2");
assert.equal(paddling.groups.flatMap((group) => group.items).find((item) => item.id === "towel").qty, "3");

// With showers on site, paddling gets the extra shower kit even before the
// leader answers the water-specific shower question.
const paddlingDefaults = buildKitList({
  ...base,
  showers: "yes",
  activities: ["water"],
  activityOptions: { water: { types: ["paddle"] } },
});
assert.ok(itemNames(paddlingDefaults).includes("Extra shower kit for after paddling"));

// Winter adds warmth.
const winter = buildKitList({ ...base, season: "winter", weather: ["freezing"] });
assert.ok(itemNames(winter).includes("Warm hat or beanie"));
assert.ok(itemNames(winter).includes("Extra blanket"));

// No duplicate item ids in the output.
const duplicateIds = itemIds(paddling).filter((id, index, all) => all.indexOf(id) !== index);
assert.deepEqual(duplicateIds, []);

// CSV escaping and shape.
const csvList = buildKitList({
  ...base,
  customItems: 'Spare boot laces\nSomething with a comma, and "quotes"',
});
const csv = buildCsv(csvList);
assert.match(csv, /^Item,Category,Quantity,Notes\r\n/);
assert.match(csv, /"Something with a comma, and ""quotes"""/);
assert.equal(csvRows(csvList)[0].length, 4);

// The PDF builder produces a real, multi-page document with the brand fonts.
const jsPDF = loadJsPdf();
const fonts = {
  regular: readFileSync(new URL("../assets/fonts/NunitoSans-Regular.ttf", import.meta.url)).toString("base64"),
  bold: readFileSync(new URL("../assets/fonts/NunitoSans-Bold.ttf", import.meta.url)).toString("base64"),
  black: readFileSync(new URL("../assets/fonts/NunitoSans-Black.ttf", import.meta.url)).toString("base64"),
};
const doc = createKitListPdf({ jsPDF, list: paddling, fonts, logoDataUrl: null });
assert.ok(doc.getNumberOfPages() >= 2, "expected a multi-page PDF");
const outputPath = join(tmpdir(), `scout-kit-list-smoke-${process.pid}.pdf`);
writeFileSync(outputPath, Buffer.from(doc.output("arraybuffer")));
const pdfBytes = readFileSync(outputPath);
unlinkSync(outputPath);
assert.ok(pdfBytes.length > 10000, "expected a PDF with embedded fonts");
assert.equal(pdfBytes.subarray(0, 5).toString(), "%PDF-");

console.log(`Kit List Generator smoke test passed: ${paddling.totalItems} generated items, ${doc.getNumberOfPages()} PDF pages.`);