/*
 * The Documents page.
 *
 * The library has two sources and they fail independently: the groups come
 * from the documents Content, and the Section rules group is built from the
 * sections Content (a Section's rules link is entered once, in sections.json,
 * and never repeated in documents.json). A Document is a link to where the
 * association's material already lives, so every one of them opens in a new
 * tab and says so; the ones behind the Portal login say that too, in words.
 */

import "../shell/site-header.js";
import "../shell/site-footer.js";
import {
  boardEmail,
  formatContentDate,
  loadContent,
  renderBandEmpty,
  renderBandError
} from "../lib/content.js";
import { sectionColor } from "../lib/section-colors.js";
import { enableJumpLinks } from "../lib/motion.js";

const groupsBand = document.getElementById("document-groups");
const sectionsBand = document.getElementById("section-rules");
const groupTemplate = document.getElementById("document-group-template");
const itemTemplate = document.getElementById("document-item-template");
const sectionTemplate = document.getElementById("section-rules-template");

enableJumpLinks(document);

loadContent("documents").then(
  (data) => fillGroups(data),
  () => renderBandError(groupsBand)
);

loadContent("sections").then(
  (data) => fillSections(data),
  () => renderBandError(sectionsBand)
);

fillRequestBand();

/** Render the Document groups, or the Band's empty sentence when there are none to show. */
function fillGroups(data) {
  const groups = data && Array.isArray(data.groups) ? data.groups : null;
  if (!groups) {
    renderBandError(groupsBand);
    return;
  }

  const rendered = [];
  for (const group of groups) {
    const node = buildGroup(group);
    if (node) rendered.push(node);
  }

  if (!rendered.length) {
    renderBandEmpty(groupsBand, "No documents are listed yet.");
    return;
  }
  groupsBand.replaceChildren(...rendered);
}

/** One group: its heading and its Documents. Returns null when nothing in it can be listed. */
function buildGroup(group) {
  if (!group || typeof group !== "object") return null;
  const items = Array.isArray(group.items) ? group.items : [];

  const node = groupTemplate.content.firstElementChild.cloneNode(true);
  const list = node.querySelector("[data-group-items]");

  let count = 0;
  for (const item of items) {
    const row = buildItem(item);
    if (!row) continue;
    list.append(row);
    count += 1;
  }
  if (!count) return null;

  node.querySelector("[data-group-title]").textContent = text(group.title) || "Documents";
  return node;
}

/** One Document row. A Document is a titled link: without a title or a url there is nothing to list. */
function buildItem(item) {
  if (!item || typeof item !== "object") return null;
  const title = text(item.title);
  const url = text(item.url);
  if (!title || !url) return null;

  const node = itemTemplate.content.firstElementChild.cloneNode(true);
  const link = node.querySelector("[data-item-link]");
  link.href = url;
  node.querySelector("[data-item-title]").textContent = title;

  const desc = text(item.desc);
  if (desc) show(node.querySelector("[data-item-desc]"), desc);

  // "Portal login required" is text, not only the lock icon, so it is read out
  // as part of the link before the homeowner follows it.
  if (item.portal === true) node.querySelector("[data-item-portal]").hidden = false;

  const updated = formatContentDate(item.updated, { month: "short", year: "numeric" });
  if (updated) {
    node.querySelector("[data-item-updated]").hidden = false;
    const time = node.querySelector("[data-item-updated-time]");
    time.textContent = updated;
    time.setAttribute("datetime", text(item.updated));
  }

  return node;
}

/** Render the Section rules group, with each chip in the same color the map gives that Section. */
function fillSections(data) {
  const sections = data && Array.isArray(data.sections) ? data.sections : null;
  if (!sections) {
    renderBandError(sectionsBand);
    return;
  }

  const list = document.createElement("ol");
  list.className = "m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4";
  list.setAttribute("aria-label", "Section rules");

  sections.forEach((section, index) => {
    const row = buildSection(section, index);
    if (row) list.append(row);
  });

  if (!list.childElementCount) {
    renderBandEmpty(sectionsBand, "Section rules will be listed here once the board adds them.");
    return;
  }
  sectionsBand.replaceChildren(list);
}

/** One Section: the color chip, the rules link when there is one, and the link to it on the map. */
function buildSection(section, index) {
  if (!section || typeof section !== "object") return null;
  const id = typeof section.id === "number" || typeof section.id === "string" ? String(section.id) : "";
  const name = text(section.name) || (id ? "Section " + id : "");
  if (!name) return null;

  const node = sectionTemplate.content.firstElementChild.cloneNode(true);

  const chip = node.querySelector("[data-section-chip]");
  chip.style.backgroundColor = sectionColor(index);
  chip.textContent = id;

  node.querySelector("[data-section-name]").textContent = name;

  const rules = text(section.rules);
  if (rules) {
    const link = node.querySelector("[data-section-rules]");
    link.href = rules;
    link.hidden = false;
    node.querySelector("[data-section-rules-label]").textContent = " for " + name + " (opens in a new tab)";
  }
  if (section.portal === true) node.querySelector("[data-section-portal]").hidden = false;

  // The map is never the only way to reach a Section, and this list is never
  // the only way either: each row also opens that Section on the map.
  const mapLink = node.querySelector("[data-section-map]");
  mapLink.href = id ? "map.html?section=" + encodeURIComponent(id) : "map.html";
  node.querySelector("[data-section-map-label]").textContent = " for " + name;

  return node;
}

/** The closing Band: the Portal request link when site.json gives one, and always the board's email. */
function fillRequestBand() {
  const emailLink = document.getElementById("board-email");
  const requestLink = document.getElementById("request-link");

  boardEmail().then((address) => {
    emailLink.href = "mailto:" + address;
    emailLink.textContent = address;
  });

  loadContent("site").then(
    (site) => {
      const url = text(site && site.requestUrl);
      if (!url) return;
      requestLink.href = url;
      requestLink.hidden = false;
    },
    () => {
      // site.json is the file that failed: the Portal button stays hidden
      // rather than offering a link that goes nowhere, and the email above
      // still gives the homeowner a way to ask.
    }
  );
}

function show(node, value) {
  node.textContent = value;
  node.hidden = false;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
