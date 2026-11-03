#!/usr/bin/env node
/**
 * Check every local asset reference in the repo.
 *
 * Scans HTML files (any depth) for src/href attributes and CSS files for
 * url(...) references, then verifies the target file exists. SVG sprite
 * references (icons.svg#name) are also checked against the sprite's ids.
 *
 * Run with: npm run check
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skipDirs = new Set([".git", "node_modules"]);
const problems = [];
let checked = 0;

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (skipDirs.has(entry)) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      walk(path, files);
    } else {
      files.push(path);
    }
  }
  return files;
}

function isExternal(value) {
  return (
    !value ||
    value.startsWith("#") ||
    /^(https?:|mailto:|tel:|data:|javascript:)/i.test(value) ||
    value.startsWith("//")
  );
}

function checkReference(file, reference) {
  if (isExternal(reference)) return;
  // Ignore values built in inline scripts, such as 'assets/' + base + '/x'.
  if (/[\s+']/.test(reference)) return;

  const [withoutQuery] = reference.split("?");
  const [pathPart, fragment] = withoutQuery.split("#");
  if (!pathPart) return;

  let target = resolve(dirname(file), decodeURIComponent(pathPart));
  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, "index.html");
  }

  if (!existsSync(target)) {
    problems.push(`${file.slice(root.length + 1)} -> missing ${reference}`);
    return;
  }

  checked += 1;

  if (fragment && extname(target) === ".svg") {
    const svg = readFileSync(target, "utf8");
    if (!svg.includes(`id="${fragment}"`)) {
      problems.push(`${file.slice(root.length + 1)} -> ${reference} has no matching id`);
    }
  }
}

const files = walk(root);

// The tool manifest powers the home page; make sure every tool it lists exists.
const manifestFile = join(root, "tools.json");
if (existsSync(manifestFile)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8").replace(/^\uFEFF/, ""));
    const tools = Array.isArray(manifest.tools) ? manifest.tools : [];
    if (tools.length === 0) problems.push("tools.json -> no tools are listed");
    for (const tool of tools) {
      if (!tool.id || !tool.title) {
        problems.push("tools.json -> every tool needs an id and a title");
        continue;
      }
      if (tool.status === "planned" || !tool.href) continue;
      const target = resolve(root, decodeURIComponent(String(tool.href)));
      const indexFile = existsSync(target) && statSync(target).isDirectory() ? join(target, "index.html") : target;
      if (!existsSync(indexFile)) {
        problems.push(`tools.json -> ${tool.id}: ${tool.href} does not exist`);
      } else {
        checked += 1;
      }
    }
  } catch (error) {
    problems.push(`tools.json -> could not be parsed: ${error.message}`);
  }
}

for (const file of files) {
  const extension = extname(file).toLowerCase();
  const text = readFileSync(file, "utf8");

  if (extension === ".html") {
    for (const match of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
      checkReference(file, match[1]);
    }
  }

  if (extension === ".css") {
    for (const match of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      checkReference(file, match[1]);
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} broken reference${problems.length === 1 ? "" : "s"}:\n`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log(`Checked ${checked} local references across ${files.length} files. No broken links.`);
