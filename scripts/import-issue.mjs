#!/usr/bin/env node
/**
 * Import a game submission from a GitHub issue body.
 *
 * The workflow sets ISSUE_BODY and runs this script. It looks for JSON
 * between the GAME_SUBMISSION markers, validates it and appends it to
 * data/games.json.
 *
 * Outputs (for the workflow):
 *   status=added|invalid|skipped
 *   title=<game title>
 *   message=<human readable summary>
 */

import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSubmission, validateGame, validateLibrary } from "./game-schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const libraryFile = join(here, "..", "data", "games.json");

function setOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  const line = `${key}=${String(value).replace(/\r?\n/g, " ")}\n`;
  if (output) appendFileSync(output, line, "utf8");
}

const body = process.env.ISSUE_BODY || "";
const { game, error, found } = parseSubmission(body);

if (!found) {
  console.log(`Status: skipped (${error || "No game submission markers were found."})`);
  setOutput("status", "skipped");
  setOutput("message", error || "No game submission markers were found.");
  process.exit(0);
}

if (error) {
  console.log(`Status: invalid (${error})`);
  setOutput("status", "invalid");
  setOutput("title", "Game submission");
  setOutput("message", error);
  process.exit(1);
}

let games;
try {
  games = JSON.parse(readFileSync(libraryFile, "utf8").replace(/^\uFEFF/, ""));
} catch (readError) {
  console.error(`Could not read ${libraryFile}: ${readError.message}`);
  setOutput("status", "invalid");
  setOutput("message", "The library file could not be read.");
  process.exit(1);
}

const libraryCheck = validateLibrary(games);
if (libraryCheck.errors.length > 0) {
  console.error("The existing games file has problems:");
  libraryCheck.errors.forEach((problem) => console.error(`- ${problem}`));
  setOutput("status", "invalid");
  setOutput("message", "The existing games file has problems, so the submission could not be added.");
  process.exit(1);
}

const knownIds = new Set(games.map((item) => item.id));
const gamesById = new Map(games.map((item) => [item.id, item]));
const incoming = Array.isArray(game) ? game : [game];
const errors = [];

incoming.forEach((item, index) => {
  const label = item?.title ? `“${item.title}”` : `entry ${index + 1}`;
  const gameErrors = validateGame(item, { knownIds, gamesById });
  if (gameErrors.length > 0) {
    gameErrors.forEach((problem) => errors.push(`${label}: ${problem}`));
    return;
  }
  knownIds.add(item.id);
  gamesById.set(item.id, item);
});

if (errors.length > 0) {
  const message = `The submission could not be added:\n${errors.map((problem) => `- ${problem}`).join("\n")}`;
  console.error(message);
  setOutput("status", "invalid");
  setOutput("title", incoming[0]?.title || "Untitled game");
  setOutput("message", message.replace(/\n/g, " | "));
  process.exit(1);
}

const nextLibrary = [...games, ...incoming];
writeFileSync(libraryFile, `${JSON.stringify(nextLibrary, null, 2)}\n`, "utf8");

const titles = incoming.map((item) => item.title).join(", ");
console.log(`Added: ${titles}`);
setOutput("status", "added");
setOutput("title", titles);
setOutput("message", `Added ${incoming.length} game${incoming.length === 1 ? "" : "s"}: ${titles}`);
