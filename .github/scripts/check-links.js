/*
 * Link check: every link inside the website points at a file that is there.
 *
 * It reads the pages in the site folder and follows every href and src that
 * stays inside the site (addresses starting with http://, https://, mailto:
 * or tel:, and links to a place on the same page, are somebody else's
 * business). It then does the same, as far as it can, for page addresses
 * written as plain text in the site's JavaScript, which is where the header
 * and footer menus are built.
 *
 * Run it from the repository root:
 *
 *   node .github/scripts/check-links.js            checks site/
 *   node .github/scripts/check-links.js some/dir   checks another copy of it
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const siteRoot = resolve(process.argv[2] || join(repoRoot, "site"));

/** Problems found so far: one readable sentence each. */
const problems = [];

// Addresses that lead away from the site, or nowhere at all.
const LEAVES_THE_SITE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function problem(where, line, message) {
  problems.push(where + ", line " + line + ": " + message);
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

function shortPath(path) {
  const inside = relative(repoRoot, path);
  return inside && !inside.startsWith("..") ? inside : path;
}

/* ------------------------------------------------------------------ *
 * Does this address land on a file in the site folder?
 * ------------------------------------------------------------------ */

function resolveInSite(address) {
  const withoutHash = address.split("#")[0].split("?")[0];
  if (!withoutHash) return { skip: true };

  let decoded = withoutHash;
  try {
    decoded = decodeURIComponent(withoutHash);
  } catch {
    // An address the browser cannot decode either; check it as written.
  }

  if (decoded.startsWith("/")) {
    return { escapes: true, target: decoded };
  }

  const target = resolve(siteRoot, decoded);
  if (target !== siteRoot && !target.startsWith(siteRoot + sep)) {
    return { escapes: true, target: decoded };
  }
  return { target, exists: isFile(target) };
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function report(where, line, address, result) {
  if (result.skip) return;
  if (result.escapes) {
    problem(
      where,
      line,
      '"' + address + '" points outside the site folder. Every address inside the site is written relative to the page, like "documents.html" or "assets/img/favicon.svg".'
    );
    return;
  }
  if (!result.exists) {
    problem(
      where,
      line,
      '"' + address + '" has nothing behind it. There is no ' + shortPath(result.target) + " — add that file, or correct the address."
    );
  }
}

/* ------------------------------------------------------------------ *
 * The pages
 * ------------------------------------------------------------------ */

const LINK_ATTRIBUTE = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function checkPage(name) {
  const source = readFileSync(join(siteRoot, name), "utf8");
  let found = 0;
  for (const match of source.matchAll(LINK_ATTRIBUTE)) {
    const address = (match[1] !== undefined ? match[1] : match[2]).trim();
    if (!address || LEAVES_THE_SITE.test(address)) continue;
    found += 1;
    report(name, lineOf(source, match.index), address, resolveInSite(address));
  }
  return found;
}

/* ------------------------------------------------------------------ *
 * Page addresses written into the site's JavaScript
 *
 * Only plain text in quotes is checked: an address pieced together at run
 * time is beyond what reading the file can tell us.
 * ------------------------------------------------------------------ */

const QUOTED_PAGE = /(["'])([^"'\n]+\.html)\1/g;

function checkScript(path) {
  const source = readFileSync(path, "utf8");
  const name = shortPath(path);
  let found = 0;
  for (const match of source.matchAll(QUOTED_PAGE)) {
    const address = match[2].trim();
    if (!address || LEAVES_THE_SITE.test(address)) continue;
    found += 1;
    report(name, lineOf(source, match.index), address, resolveInSite(address));
  }
  return found;
}

function scriptsUnder(directory) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...scriptsUnder(path));
    else if (entry.name.endsWith(".js")) found.push(path);
  }
  return found;
}

/* ------------------------------------------------------------------ *
 * Running the checks
 * ------------------------------------------------------------------ */

function pageNames() {
  try {
    return readdirSync(siteRoot)
      .filter((name) => name.toLowerCase().endsWith(".html"))
      .sort();
  } catch {
    return [];
  }
}

console.log("Checking the links in " + shortPath(siteRoot) + "\n");

const pages = pageNames();
if (pages.length === 0) {
  problems.push(shortPath(siteRoot) + ": there are no pages here. The website is the .html files in this folder.");
}

let links = 0;
for (const page of pages) links += checkPage(page);

let scripted = 0;
for (const script of scriptsUnder(join(siteRoot, "assets", "js"))) scripted += checkScript(script);

console.log("  " + pages.length + (pages.length === 1 ? " page" : " pages") + ": " + pages.join(", "));
console.log("  " + links + " links inside the site, plus " + scripted + " page addresses in the site's JavaScript\n");

if (problems.length > 0) {
  console.error("Some links do not lead anywhere:\n");
  for (const message of problems) console.error("  - " + message);
  const tally =
    problems.length === 1
      ? "1 link to fix. The website keeps showing its previous version until it is fixed."
      : problems.length + " links to fix. The website keeps showing its previous version until they are fixed.";
  console.error("\n" + tally);
  process.exitCode = 1;
} else {
  console.log("Every link inside the site leads somewhere.");
}
