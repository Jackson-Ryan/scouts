#!/usr/bin/env node
/**
 * A small smoke test for the browser scripts.
 *
 * It uses jsdom to load each page, wires up the same globals the browser
 * would provide, runs the page module and checks the rendered output.
 *
 * Setup: npm install
 * Run:   npm run smoke
 */

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (condition) {
    console.log(`  ok  ${message}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${message}`);
  }
}

async function waitFor(condition, message, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = condition();
    if (value) return value;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  }
  throw new Error(`Timed out waiting for: ${message}`);
}

const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.href ?? String(input);
  const parsed = new URL(url);
  if (parsed.protocol === "file:") {
    const body = await readFile(parsed, "utf8");
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(input, init);
};

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

async function loadPage(urlPath, moduleName) {
  const [file] = urlPath.split("?");
  const html = await readFile(join(root, file), "utf8");
  const dom = new JSDOM(html, { url: `http://localhost:8080/${urlPath}`, pretendToBeVisual: true });
  const { window } = dom;
  window.Element.prototype.scrollIntoView = () => {};

  setGlobal("window", window);
  setGlobal("document", window.document);
  setGlobal("localStorage", window.localStorage);
  setGlobal("CustomEvent", window.CustomEvent);
  setGlobal("Event", window.Event);
  setGlobal("HTMLElement", window.HTMLElement);
  setGlobal("Element", window.Element);
  setGlobal("Node", window.Node);
  setGlobal("navigator", window.navigator);

  const script = join(root, "assets", "js", moduleName);
  await import(`${pathToFileURL(script).href}?smoke=${Date.now()}-${Math.random()}`);
  return dom;
}

function fire(element, type) {
  element.dispatchEvent(new element.ownerDocument.defaultView.Event(type, { bubbles: true }));
}

function typeInto(element, value) {
  element.value = value;
  fire(element, "input");
  fire(element, "change");
}

async function testIndex() {
  console.log("\nindex.html");
  const library = JSON.parse(await readFile(join(root, "data", "games.json"), "utf8"));
  const dom = await loadPage("index.html", "index.js");
  const doc = dom.window.document;

  await waitFor(() => doc.querySelectorAll("#game-grid .game-card").length === 12, "first page of games");
  assert(doc.querySelectorAll("#featured-grid .game-card").length === 3, "three featured games render");
  assert(
    doc.querySelector("#results-count").textContent.includes(String(library.length)),
    `result count shows the library total (${library.length})`,
  );
  assert(doc.querySelectorAll("#quick-chips [data-chip]").length === 6, "six quick filter chips render");
  assert(doc.querySelectorAll("#filter-theme option").length > 5, "theme filter is populated");

  const search = doc.querySelector("#filter-search");
  search.value = "parachute";
  fire(search, "input");
  await waitFor(() => doc.querySelector("#results-count").textContent.includes("match"), "search filters the grid");
  assert(
    [...doc.querySelectorAll(".game-card__title")].some((title) => title.textContent.includes("Parachute Popcorn")),
    "search finds Parachute Popcorn",
  );

  doc.querySelector("#clear-filters").click();
  await waitFor(() => doc.querySelectorAll("#game-grid .game-card").length === 12, "filters clear");

  doc.querySelector('[data-chip="section:beavers"]').click();
  await waitFor(() => doc.querySelector("#filter-section").value === "beavers", "section chip applies");
  assert(doc.querySelector("#results-title").textContent.includes("Beavers"), "heading reflects section filter");
  assert(doc.querySelectorAll("#game-grid .game-card").length > 0, "section filter shows results");

  const saveButton = doc.querySelector("#game-grid [data-save-id]");
  const savedId = saveButton.dataset.saveId;
  saveButton.click();
  await waitFor(() => dom.window.localStorage.getItem("scouts-games-saved-v1")?.includes(savedId), "saved game is stored");
  assert(doc.querySelector(".header-saved__count").textContent === "1", "header saved count updates");

  doc.querySelector('[data-chip="all"]').click();
  await waitFor(() => doc.querySelectorAll("#game-grid .game-card").length === 12, "all games chip resets filters");

  const firstId = doc.querySelector("#game-grid .game-card").dataset.gameId;
  doc.querySelector('#pagination button[data-page="2"]').click();
  await waitFor(() => doc.querySelector("#game-grid .game-card").dataset.gameId !== firstId, "pagination changes page");
  assert(doc.querySelectorAll("#game-grid .game-card").length === 12, "page two has twelve games");

  await waitFor(() => doc.querySelector('[data-chip="saved"] .chip__count').textContent === "1", "saved chip count updates");
  doc.querySelector('[data-chip="saved"]').click();
  await waitFor(() => doc.querySelectorAll("#game-grid .game-card").length === 1, "saved filter shows one game");

  doc.querySelector('[data-chip="all"]').click();
  await waitFor(() => doc.querySelectorAll("#game-grid .game-card").length === 12, "filters reset before theme test");

  const themeSelect = doc.querySelector("#filter-theme");
  themeSelect.value = "halloween";
  fire(themeSelect, "change");
  await waitFor(() => doc.querySelector("#results-count").textContent.includes("match"), "theme filter applies");

  dom.window.close();
}

async function testGame(id, expectations) {
  console.log(`\ngame.html?id=${id}`);
  const dom = await loadPage(`game.html?id=${id}`, "game.js");
  const doc = dom.window.document;

  await waitFor(() => doc.querySelector("#game-content") && !doc.querySelector("#game-content").hidden, "game content renders");
  assert(doc.querySelector("#game-title").textContent === expectations.title, `title is ${expectations.title}`);
  assert(doc.querySelectorAll("#game-main .content-block").length >= 4, "content blocks render");
  assert(doc.querySelector("#game-main .safety-box"), "safety box renders");
  assert(doc.querySelectorAll("#game-sidebar .accordion__item").length >= 1, "leader tips render");
  assert(doc.querySelectorAll(".steps li").length >= 3, "rules steps render");
  assert(!doc.querySelector("#twists-section").hidden, "themed twists section is visible");
  assert(doc.querySelectorAll(".twist-card").length >= 1, "at least one twist card renders");
  assert(!doc.querySelector("#variants-section").hidden, "variants section is visible");
  assert(doc.querySelectorAll("#variants-grid .game-card").length >= 1, "variant cards render");
  assert(doc.querySelectorAll("#related-grid .game-card").length === 3, "three related games render");

  if (expectations.variantOf) {
    assert(
      doc.querySelector("#variant-family")?.textContent.includes(expectations.variantOf),
      `variant family links back to ${expectations.variantOf}`,
    );
  }

  dom.window.close();
}

async function testNotFound() {
  console.log("\ngame.html?id=does-not-exist");
  const dom = await loadPage("game.html?id=does-not-exist", "game.js");
  const doc = dom.window.document;
  await waitFor(() => !doc.querySelector("#game-not-found").hidden, "not found panel renders");
  assert(doc.querySelector("#game-title").textContent === "Game not found", "not found title renders");
  dom.window.close();
}

async function testAdd() {
  console.log("\nadd.html");
  const dom = await loadPage("add.html", "add.js");
  const doc = dom.window.document;

  await waitFor(() => !doc.querySelector("#prepare-game").disabled, "form is ready");
  assert(doc.querySelectorAll("#game-variant option").length > 20, "base games populate the variant picker");
  assert(doc.querySelectorAll("#icon-picker .icon-choice").length > 40, "icon picker is populated");
  assert(doc.querySelectorAll("#color-picker .swatch").length === 10, "colour picker is populated");
  assert(doc.querySelector("#preview-card .game-card"), "live preview card renders");

  typeInto(doc.querySelector("#game-title"), "Test Volcano Game");
  typeInto(doc.querySelector("#game-summary"), "A quick throwing game used to check the add form works from end to end.");
  doc.querySelector('input[name="sections"][value="cubs"]').click();
  typeInto(doc.querySelector("#game-duration"), "10–20 mins");
  typeInto(doc.querySelector("#game-equipment"), "Soft balls\nCones");
  typeInto(doc.querySelector("#game-setup"), "Mark a throwing line and place cones at the far end.");
  typeInto(doc.querySelector("#game-steps"), "Teams throw soft balls at the cones.\nCollect any knocked-over cones.");
  typeInto(doc.querySelector("#game-winning"), "The team with the most cones standing after five minutes wins.");
  typeInto(doc.querySelector("#game-safety"), "Use soft balls, keep throwers behind the line and clear the running area.");

  await waitFor(
    () => doc.querySelector("#preview-card .game-card__title")?.textContent === "Test Volcano Game",
    "preview updates with the title",
  );
  assert(doc.querySelectorAll("#preview-checklist .is-done").length >= 5, "checklist tracks completed fields");

  doc.querySelector("#prepare-game").click();
  await waitFor(() => !doc.querySelector("#export-panel").hidden, "export panel opens");
  const json = JSON.parse(doc.querySelector("#json-preview").textContent);
  assert(json.id === "test-volcano-game", `generated id is ${json.id}`);
  assert(json.sections.length === 1 && json.sections[0] === "cubs", "selected section is included");
  assert(json.equipment.length === 2, "equipment lines are parsed");
  assert(json.added && /^\d{4}-\d{2}-\d{2}$/.test(json.added), "added date is set");
  assert(json.featured === false, "new games are not featured by default");
  assert(json.variantOf === null, "new games are not variants by default");

  doc.querySelector("#add-twist").click();
  const twistRow = doc.querySelector("[data-twist-row]");
  twistRow.querySelector("[data-twist-title]").value = "Lava Twist";
  twistRow.querySelector("[data-twist-text]").value = "Call the cones volcanoes and play spooky music.";
  fire(twistRow.querySelector("[data-twist-text]"), "input");
  await waitFor(() => doc.querySelector("#export-panel").hidden, "editing after export closes the export panel");

  doc.querySelector("#prepare-game").click();
  await waitFor(() => !doc.querySelector("#export-panel").hidden, "export panel reopens");
  const updated = JSON.parse(doc.querySelector("#json-preview").textContent);
  assert(updated.themedTwists.length === 1, "themed twist is included in the JSON");

  doc.querySelector("#reset-form").click();
  await waitFor(() => doc.querySelector("#game-title").value === "" && doc.querySelector("#export-panel").hidden, "reset clears the form");
  doc.querySelector("#prepare-game").click();
  await waitFor(() => !doc.querySelector("#form-status").hidden, "validation message appears");
  assert(doc.querySelector("#form-status").textContent.includes("fix"), "validation asks for fixes");
  assert(doc.querySelector('[data-error-for="title"]').textContent.length > 0, "title error is shown");
  assert(doc.querySelector("#game-title").classList.contains("is-invalid"), "title field is marked invalid");

  dom.window.close();
}

async function main() {
  await testIndex();
  await testGame("french-v-english", { title: "French v English" });
  await testGame("snowball-siege", { title: "Snowball Siege", variantOf: "French v English" });
  await testNotFound();
  await testAdd();

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
