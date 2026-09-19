/*
 * Content: reading the five JSON files the board edits.
 *
 * This is the only module that fetches Content and the only place Content
 * dates are parsed. Every page and every Band goes through it, so a broken
 * file degrades one Band instead of taking a page down.
 */

/** The board's address, used when site.json is the file that failed to load. */
export const FALLBACK_BOARD_EMAIL = "glenridgehomeowners@gmail.com";

/** The message shown in a Band whose Content could not be read. */
const LOAD_ERROR_TEXT = "This information couldn't be loaded. Please email the board at ";

// site/assets/js/lib/ -> site/content/. Resolved against this module's own URL,
// so it works from any page and at any path the site is published under.
const CONTENT_DIR = new URL("../../../content/", import.meta.url);

// One fetch per Content file per page load; the header, the footer and any
// Band can all ask for site.json without asking the network three times.
const loaded = new Map();

/** Load a Content file by name ("news", "site", …) and return its parsed contents. */
export function loadContent(name) {
  if (!loaded.has(name)) {
    const request = fetch(new URL(name + ".json", CONTENT_DIR)).then((response) => {
      if (!response.ok) {
        throw new Error("Could not read " + name + ".json (" + response.status + ")");
      }
      return response.json();
    });
    loaded.set(name, request);
  }
  return loaded.get(name);
}

/** Parse a Content date ("2026-10-07") as local noon, so it never shifts a day. */
export function parseContentDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a Content date for reading ("Oct 7, 2026"); options override the default parts. */
export function formatContentDate(value, options) {
  const date = parseContentDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", options || { month: "short", day: "numeric", year: "numeric" });
}

/** The board's email from site.json, falling back to the constant when that file failed. */
export async function boardEmail() {
  try {
    const site = await loadContent("site");
    if (site && typeof site.email === "string" && site.email.trim()) return site.email.trim();
  } catch {
    // site.json is the file that failed; the fallback below is the point.
  }
  return FALLBACK_BOARD_EMAIL;
}

/** Replace a Band's contents with the shared "couldn't be loaded" message and the board's email. */
export async function renderBandError(band) {
  if (!band) return;
  const email = await boardEmail();
  const message = document.createElement("p");
  message.className = "m-0 max-w-[60ch] text-base";
  message.append(LOAD_ERROR_TEXT);
  const link = document.createElement("a");
  link.href = "mailto:" + email;
  link.className = "underline underline-offset-2";
  link.textContent = email;
  message.append(link, ".");
  replaceChildren(band, message);
}

/** Replace a Band's contents with a plain sentence for when there is nothing to list. */
export function renderBandEmpty(band, sentence) {
  if (!band) return;
  const message = document.createElement("p");
  message.className = "m-0 max-w-[60ch] text-base";
  message.textContent = sentence;
  replaceChildren(band, message);
}

function replaceChildren(parent, child) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
  parent.append(child);
}
