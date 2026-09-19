/*
 * Content check: the five files in site/content/ that the board edits.
 *
 * It reads each file, makes sure it is still readable text, that every entry
 * has the lines it needs, that dates and links are written the way the content
 * guide describes, and that the board's email address is the same everywhere.
 *
 * Every message names the file and the entry in plain language, because the
 * person reading it is usually a board member who has just edited a file on
 * GitHub, not a developer.
 *
 * Run it from the repository root:
 *
 *   node .github/scripts/check-content.js            checks site/
 *   node .github/scripts/check-content.js some/dir   checks another copy of it
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const siteRoot = resolve(process.argv[2] || join(repoRoot, "site"));
const contentRoot = join(siteRoot, "content");

/** Problems found so far: one readable sentence each. */
const problems = [];

function problem(file, message) {
  problems.push(file + ": " + message);
}

/* ------------------------------------------------------------------ *
 * The shape of each file, as the content guide describes it.
 * ------------------------------------------------------------------ */

// A line to copy when one is missing, so the fix can be pasted straight in.
const EXAMPLE_LINES = {
  date: '"date": "2026-09-14"',
  title: '"title": "Fall dues invoices mailed"',
  summary: '"summary": "One or two sentences about what happened."',
  time: '"time": "7:00 PM"',
  url: '"url": "https://example.com/documents/bylaws"',
  rules: '"rules": "https://example.com/documents/section-1-rules"',
  id: '"id": 1',
  name: '"name": "Section 1"',
  polygon: '"polygon": [[39.578, -84.190], [39.578, -84.1855], [39.571, -84.1855], [39.571, -84.190]]',
  payUrl: '"payUrl": "https://example.com/portal/pay-dues"',
  requestUrl: '"requestUrl": "https://example.com/portal/submit-a-request"',
  email: '"email": "glenridgehomeowners@gmail.com"',
  items: '"items": [ … ]',
  groups: '"groups": [ … ]',
  meetings: '"meetings": [ … ]',
  sections: '"sections": [ … ]',
};

// Keys whose value is a date written year-month-day.
const DATE_KEYS = new Set(["date", "updated"]);

// Keys whose value is a link to somewhere else on the web.
const LINK_KEYS = new Set(["url", "agenda", "minutes", "rules", "payUrl", "requestUrl", "facebookUrl", "nextdoorUrl"]);

/* ------------------------------------------------------------------ *
 * Reading a file
 * ------------------------------------------------------------------ */

function readContentFile(file) {
  let source;
  try {
    source = readFileSync(join(contentRoot, file), "utf8");
  } catch {
    problem(file, "this file is missing from site/content/. It has to be there, even if it is nearly empty.");
    return null;
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    problem(file, describeUnreadableFile(source, error));
    return null;
  }
}

/** Turn a parser complaint into something an editor can act on. */
function describeUnreadableFile(source, error) {
  const place = locateParseError(source, error);
  const where = place
    ? "The reading stopped at line " + place.line + ", so the slip is on that line or just above it."
    : "";
  return [
    "this file can no longer be read.",
    where,
    "It is almost always punctuation. Look for a missing or extra comma (every entry is followed by a comma except the last one in a list),",
    "a missing quotation mark, or a missing } or ]. Fixing it and committing again publishes the site as usual.",
  ]
    .filter(Boolean)
    .join(" ");
}

function locateParseError(source, error) {
  const message = String(error && error.message);
  const lineColumn = /line (\d+) column (\d+)/.exec(message);
  if (lineColumn) return { line: Number(lineColumn[1]) };
  const position = /position (\d+)/.exec(message);
  if (!position) return null;
  const before = source.slice(0, Number(position[1]));
  return { line: before.split("\n").length };
}

/* ------------------------------------------------------------------ *
 * Naming an entry the way its editor sees it
 * ------------------------------------------------------------------ */

function describeEntry(entry, index, noun) {
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const title = firstText(entry.title, entry.name);
    if (title) return "the " + noun + ' "' + title + '"';
    if (typeof entry.date === "string" && entry.date.trim()) {
      return "the " + noun + " dated " + entry.date.trim();
    }
  }
  return "the " + ordinal(index + 1) + " " + noun + " (counting from the top of the list)";
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return n + "th";
  if (n % 10 === 1) return n + "st";
  if (n % 10 === 2) return n + "nd";
  if (n % 10 === 3) return n + "rd";
  return n + "th";
}

/* ------------------------------------------------------------------ *
 * The checks every entry goes through
 * ------------------------------------------------------------------ */

function present(entry, key) {
  return Object.prototype.hasOwnProperty.call(entry, key) && entry[key] !== null;
}

function requireKeys(file, entry, where, keys) {
  for (const key of keys) {
    const example = EXAMPLE_LINES[key];
    if (!present(entry, key)) {
      problem(file, where + ' has no "' + key + '". Add a line like ' + example + ".");
    } else if (typeof entry[key] === "string" && !entry[key].trim()) {
      problem(file, where + ' has an empty "' + key + '". Fill it in, like ' + example + ".");
    } else if (Array.isArray(entry[key]) && entry[key].length === 0) {
      problem(file, where + ' has an empty "' + key + '". Fill it in, like ' + example + ".");
    }
  }
}

/** Dates, links, plain text, body and portal: the rules that apply anywhere. */
function checkEntryValues(file, entry, where) {
  for (const [key, value] of Object.entries(entry)) {
    if (DATE_KEYS.has(key)) checkDate(file, where, key, value);
    if (LINK_KEYS.has(key)) checkLink(file, where, key, value);
    if (key === "body") checkBody(file, where, value);
    if (key === "portal") checkPortal(file, where, value);
    checkPlainText(file, where, key, value);
  }
}

function checkDate(file, where, key, value) {
  if (typeof value !== "string") {
    problem(file, where + ' has a "' + key + '" that is not written as text. Write it in quotes, year-month-day: ' + EXAMPLE_LINES.date + ".");
    return;
  }
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!parts) {
    problem(file, where + ' has "' + key + '": "' + value + '". Dates are written year-month-day with dashes, like ' + EXAMPLE_LINES.date + ".");
    return;
  }
  const [, year, month, day] = parts.map(Number);
  const asDate = new Date(Date.UTC(year, month - 1, day));
  const real =
    asDate.getUTCFullYear() === year && asDate.getUTCMonth() === month - 1 && asDate.getUTCDate() === day;
  if (!real) {
    problem(file, where + ' has "' + key + '": "' + value + '", which is not a day on the calendar. Check the month and the day.');
  }
}

function checkLink(file, where, key, value) {
  if (typeof value !== "string" || !value.trim()) {
    problem(file, where + ' has a "' + key + '" that is not a link. Paste the whole web address in quotes, like ' + (EXAMPLE_LINES[key] || EXAMPLE_LINES.url) + ".");
    return;
  }
  const link = value.trim();

  const wellFormed = /^https?:\/\/[^\s"<>]+$/.test(link) && canBeRead(link);
  if (!wellFormed) {
    problem(file, where + ' has "' + key + '": "' + link + '". A link has to be the whole web address, starting with https:// — copy it from the address bar of your browser.');
  }
}

function canBeRead(link) {
  try {
    new URL(link);
    return true;
  } catch {
    return false;
  }
}

function checkBody(file, where, value) {
  if (!Array.isArray(value)) {
    problem(file, where + ' has a "body" that is not a list of paragraphs. Write it as ["First paragraph.", "Second paragraph."], one quoted paragraph per line.');
    return;
  }
  const allText = value.every((paragraph) => typeof paragraph === "string");
  if (!allText) {
    problem(file, where + ' has a "body" where something is not a quoted paragraph. Every line inside the body is text in quotes.');
  }
}

function checkPortal(file, where, value) {
  if (value !== true && value !== false) {
    problem(file, where + ' has "portal": ' + JSON.stringify(value) + '. Write "portal": true when the Portal login is needed, and leave the line out otherwise.');
  }
}

/** Content is plain text: nothing may carry a < that starts a tag. */
function checkPlainText(file, where, key, value) {
  for (const text of textsIn(value)) {
    const tag = /<[A-Za-z][^\s>]*/.exec(text);
    if (tag) {
      problem(file, where + ' has "' + key + '" containing "' + tag[0] + '", which looks like HTML. Content is plain text only: write the words plainly and leave out any < tags.');
      return;
    }
  }
}

function textsIn(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  return [];
}

function asList(file, data, key, noun) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    problem(file, "this file should start with { and end with }, with the list of " + noun + "s inside it.");
    return [];
  }
  if (!Array.isArray(data[key])) {
    problem(file, 'this file has no "' + key + '" list. It needs a line like ' + EXAMPLE_LINES[key] + " holding every " + noun + ".");
    return [];
  }
  return data[key];
}

function checkEntries(file, entries, noun, required) {
  entries.forEach((entry, index) => {
    const where = describeEntry(entry, index, noun);
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      problem(file, where + " is not written as an entry. Copy a whole existing entry, from its { to its }, and change the words.");
      return;
    }
    requireKeys(file, entry, where, required);
    checkEntryValues(file, entry, where);
  });
}

function checkFileSettings(file, data, where) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.some((item) => item && typeof item === "object")) continue;
      checkEntryValues(file, { [key]: value }, where);
    }
  }
}

/* ------------------------------------------------------------------ *
 * The five files
 * ------------------------------------------------------------------ */

function checkNews() {
  const file = "news.json";
  const data = readContentFile(file);
  if (!data) return 0;
  checkFileSettings(file, data, "the lines at the top of the file");
  const items = asList(file, data, "items", "news item");
  checkEntries(file, items, "news item", ["date", "title", "summary"]);
  return items.length;
}

function checkMeetings() {
  const file = "meetings.json";
  const data = readContentFile(file);
  if (!data) return 0;
  checkFileSettings(file, data, "the lines at the top of the file");
  const meetings = asList(file, data, "meetings", "meeting");
  checkEntries(file, meetings, "meeting", ["date", "time", "title"]);
  return meetings.length;
}

function checkDocuments() {
  const file = "documents.json";
  const data = readContentFile(file);
  if (!data) return 0;
  checkFileSettings(file, data, "the lines at the top of the file");
  const groups = asList(file, data, "groups", "group");
  let items = 0;
  groups.forEach((group, index) => {
    const where = describeEntry(group, index, "group");
    if (!group || typeof group !== "object" || Array.isArray(group)) {
      problem(file, where + " is not written as a group. A group has a title and a list of items.");
      return;
    }
    requireKeys(file, group, where, ["title"]);
    checkEntryValues(file, group, where);
    if (!Array.isArray(group.items)) {
      problem(file, where + ' has no "items" list. Every group holds its documents in a line like ' + EXAMPLE_LINES.items + ".");
      return;
    }
    items += group.items.length;
    checkEntries(file, group.items, "document", ["title", "url"]);
  });
  return items;
}

function checkSections() {
  const file = "sections.json";
  const data = readContentFile(file);
  if (!data) return 0;
  checkFileSettings(file, data, "the lines at the top of the file");
  const sections = asList(file, data, "sections", "Section");
  checkEntries(file, sections, "Section", ["id", "name", "rules", "polygon"]);
  sections.forEach((section, index) => {
    if (!section || typeof section !== "object") return;
    const where = describeEntry(section, index, "Section");
    if (present(section, "polygon")) checkPolygon(file, where, section.polygon);
  });
  return sections.length;
}

function checkPolygon(file, where, polygon) {
  const corners = Array.isArray(polygon) ? polygon : null;
  if (!corners || corners.length < 3) {
    problem(file, where + ' has a "polygon" that is not a boundary. It is a list of at least three latitude/longitude corners; ask the site maintainer before changing one.');
    return;
  }
  const shaped = corners.every(
    (corner) => Array.isArray(corner) && corner.length === 2 && corner.every((number) => typeof number === "number" && Number.isFinite(number))
  );
  if (!shaped) {
    problem(file, where + ' has a corner in its "polygon" that is not a pair of numbers. Each corner looks like [39.578, -84.190]; ask the site maintainer before changing one.');
  }
}

function checkSite() {
  const file = "site.json";
  const data = readContentFile(file);
  if (!data) return null;
  if (typeof data !== "object" || Array.isArray(data)) {
    problem(file, "this file should start with { and end with }, with one line for each setting.");
    return null;
  }
  const where = "this file";
  requireKeys(file, data, where, ["payUrl", "requestUrl", "email"]);
  checkEntryValues(file, data, where);
  const email = typeof data.email === "string" ? data.email.trim() : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    problem(file, 'the "email" line reads "' + email + '", which is not an email address. It looks like ' + EXAMPLE_LINES.email + ".");
    return null;
  }
  return email || null;
}

/* ------------------------------------------------------------------ *
 * The board's email address, which lives in three places
 * ------------------------------------------------------------------ */

const TOGETHER =
  "These three have to say the same thing: site/content/site.json, the fallback address in site/assets/js/lib/content.js, and the address in the <noscript> line of every page.";

function checkBoardEmailEverywhere(email) {
  if (!email) return;

  const libraryPath = join(siteRoot, "assets", "js", "lib", "content.js");
  let library;
  try {
    library = readFileSync(libraryPath, "utf8");
  } catch {
    problem(shortPath(libraryPath), "this file is missing, so the board's address could not be checked against it.");
    return;
  }
  const fallback = /FALLBACK_BOARD_EMAIL\s*=\s*"([^"]+)"/.exec(library);
  if (!fallback) {
    problem(shortPath(libraryPath), "the fallback board address (FALLBACK_BOARD_EMAIL) is not in this file any more. " + TOGETHER);
  } else if (fallback[1] !== email) {
    problem(
      shortPath(libraryPath),
      'the fallback board address is "' + fallback[1] + '", but site.json says "' + email + '". ' + TOGETHER
    );
  }

  for (const page of pageFiles()) {
    checkPageEmail(page, email);
  }
}

function checkPageEmail(page, email) {
  const label = page.name;
  const noscript = /<noscript\b[^>]*>([\s\S]*?)<\/noscript>/i.exec(page.source);
  if (!noscript) {
    problem(label, "this page has no <noscript> line. Every page carries one giving the board's email address for visitors without JavaScript.");
    return;
  }
  const found = noscript[1].match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  if (found.length === 0) {
    problem(label, "the <noscript> line on this page gives no email address. It tells visitors without JavaScript how to reach the board.");
    return;
  }
  const wrong = found.filter((address) => address !== email);
  if (wrong.length > 0) {
    problem(label, 'the <noscript> line says "' + wrong[0] + '", but site.json says "' + email + '". ' + TOGETHER);
  }
}

function pageFiles() {
  let names;
  try {
    names = readdirSync(siteRoot);
  } catch {
    return [];
  }
  return names
    .filter((name) => name.toLowerCase().endsWith(".html"))
    .sort()
    .map((name) => ({ name, source: readFileSync(join(siteRoot, name), "utf8") }));
}

function shortPath(path) {
  const inside = relative(repoRoot, path);
  return inside && !inside.startsWith("..") ? inside : path;
}

/* ------------------------------------------------------------------ *
 * Running the checks
 * ------------------------------------------------------------------ */

console.log("Checking the content files in " + shortPath(contentRoot) + "\n");

const counts = [
  ["news.json", checkNews(), "news items"],
  ["meetings.json", checkMeetings(), "meetings"],
  ["documents.json", checkDocuments(), "documents"],
  ["sections.json", checkSections(), "Sections"],
];
const boardEmail = checkSite();
checkBoardEmailEverywhere(boardEmail);

for (const [file, count, noun] of counts) {
  console.log("  " + file.padEnd(16) + count + " " + noun);
}
console.log("  " + "site.json".padEnd(16) + (boardEmail ? "board address " + boardEmail : "settings"));
console.log("");

if (problems.length > 0) {
  console.error("Something in the content needs fixing before the website can be published:\n");
  for (const message of problems) console.error("  - " + message);
  const tally =
    problems.length === 1
      ? "1 thing to fix. The website keeps showing its previous version until it is fixed."
      : problems.length + " things to fix. The website keeps showing its previous version until they are fixed.";
  console.error("\n" + tally + " CONTENT-GUIDE.md explains each file.");
  process.exitCode = 1;
} else {
  console.log("The content is in good order.");
}
