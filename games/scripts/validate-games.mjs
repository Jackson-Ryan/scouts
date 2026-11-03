#!/usr/bin/env node
/**
 * Check data/games.json against the shared schema.
 * Run with: npm run validate
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateLibrary } from "./game-schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "data", "games.json");

let games;
try {
  games = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
} catch (error) {
  console.error(`Could not read ${file}`);
  console.error(error.message);
  process.exit(1);
}

const { errors, warnings } = validateLibrary(games);

warnings.forEach((warning) => console.warn(`warning: ${warning}`));

if (errors.length > 0) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"} found:\n`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const variants = games.filter((game) => game.variantOf).length;
const twistCount = games.reduce((total, game) => total + (game.themedTwists?.length || 0), 0);
console.log(`Checked ${games.length} games: ${variants} variants, ${twistCount} themed twists. No problems found.`);
