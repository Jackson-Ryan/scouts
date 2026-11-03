#!/usr/bin/env node
/**
 * Add one or more games to data/games.json from a JSON file.
 *
 * Usage:
 *   node scripts/add-game.mjs path/to/game.json
 *   node scripts/add-game.mjs path/to/game.json --dry-run
 *   node scripts/add-game.mjs path/to/games-array.json
 *
 * The file can contain a single game object or an array of games.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { validateGame, validateLibrary } from "./game-schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const libraryFile = join(here, "..", "data", "games.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const inputFile = args.find((arg) => !arg.startsWith("--"));

if (!inputFile) {
  console.error("Usage: node scripts/add-game.mjs path/to/game.json [--dry-run]");
  process.exit(1);
}

let games;
try {
  games = JSON.parse(readFileSync(libraryFile, "utf8").replace(/^\uFEFF/, ""));
} catch (error) {
  console.error(`Could not read ${libraryFile}`);
  console.error(error.message);
  process.exit(1);
}

const libraryCheck = validateLibrary(games);
if (libraryCheck.errors.length > 0) {
  console.error("The existing games file has problems. Fix these first:");
  libraryCheck.errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

let incoming;
try {
  incoming = JSON.parse(readFileSync(resolve(inputFile), "utf8").replace(/^\uFEFF/, ""));
} catch (error) {
  console.error(`Could not read ${inputFile}`);
  console.error(error.message);
  process.exit(1);
}

const newGames = Array.isArray(incoming) ? incoming : [incoming];
const knownIds = new Set(games.map((game) => game.id));
const gamesById = new Map(games.map((game) => [game.id, game]));
const errors = [];

newGames.forEach((game, index) => {
  const label = game?.title ? `“${game.title}”` : `entry ${index + 1}`;
  const gameErrors = validateGame(game, { knownIds, gamesById });
  if (gameErrors.length > 0) {
    gameErrors.forEach((error) => errors.push(`${label}: ${error}`));
    return;
  }
  knownIds.add(game.id);
  gamesById.set(game.id, game);
});

if (errors.length > 0) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} found:\n`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const nextLibrary = [...games, ...newGames];

if (dryRun) {
  console.log(`Dry run: ${newGames.length} game${newGames.length === 1 ? "" : "s"} would be added.`);
  console.log(nextLibrary.map((game) => `- ${game.title} (${game.id})`).join("\n"));
  process.exit(0);
}

writeFileSync(libraryFile, `${JSON.stringify(nextLibrary, null, 2)}\n`, "utf8");
console.log(`Added ${newGames.length} game${newGames.length === 1 ? "" : "s"} to data/games.json:`);
newGames.forEach((game) => console.log(`- ${game.title} (${game.id})`));
console.log("Run npm run validate to double-check the library.");
