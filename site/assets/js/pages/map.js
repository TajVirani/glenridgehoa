/*
 * The Community Map page.
 *
 * The map Band reads the sections Content once and builds three things from
 * it: the map itself (lib/section-map.js), the chips beside it, and the list
 * of Section rules below it. The list is plain links, so every Section stays
 * reachable when the map cannot be drawn at all.
 *
 * Choosing a Section flies the map and writes `?section=N` into the address
 * bar, so the view can be linked to and shared; arriving with `?section=N`
 * flies there once the map is on the page.
 */

import "../shell/site-header.js";
import "../shell/site-footer.js";
import { icon } from "../shell/dom.js";
import { boardEmail, loadContent, renderBandEmpty, renderBandError } from "../lib/content.js";
import { enableJumpLinks, jumpTo } from "../lib/motion.js";
import { sectionColor } from "../lib/section-colors.js";
import { createSectionMap, sectionName } from "../lib/section-map.js";

const LOCK_ICON = [
  "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
  "M7 11V7a5 5 0 0 1 10 0v4"
];

const chips = new Map();

enableJumpLinks(document);

const band = document.getElementById("section-map-band");
loadContent("sections").then(
  (content) => fillMapBand(content),
  () => renderBandError(band)
);

fillQuestions();

function fillMapBand(content) {
  const sections = Array.isArray(content && content.sections) ? content.sections : [];
  if (!sections.length) {
    renderBandEmpty(band, "Section information is not available yet.");
    return;
  }

  // The list first: it is the part that has to work whatever the map does.
  fillSectionList(sections);

  const container = document.getElementById("section-map");
  let sectionMap;
  try {
    sectionMap = createSectionMap(container, content, { onSelect: markChosen });
  } catch {
    // No Leaflet, or no boundaries to draw. The list below carries the page.
    container.hidden = true;
    document.getElementById("section-map-note").hidden = true;
    document.getElementById("section-chips-panel").hidden = true;
    document.getElementById("section-map-unavailable").hidden = false;
    return;
  }

  fillChips(sections, sectionMap);

  const asked = new URL(window.location.href).searchParams.get("section");
  if (asked) sectionMap.flyToSection(asked);
}

// One chip per Section that the map drew, in Content order, colored to match
// its polygon.
function fillChips(sections, sectionMap) {
  const list = document.getElementById("section-chips");
  const template = document.getElementById("section-chip-template");
  const drawn = new Set(sectionMap.sectionIds);

  sections.forEach((section, index) => {
    const key = sectionId(section, index);
    if (!drawn.has(key)) return;

    const item = template.content.firstElementChild.cloneNode(true);
    const button = item.querySelector("[data-chip]");
    item.querySelector("[data-swatch]").style.backgroundColor = sectionColor(index);
    item.querySelector("[data-name]").textContent = sectionName(section, index);
    button.addEventListener("click", () => {
      sectionMap.flyToSection(key);
      bringMapIntoView();
    });

    chips.set(key, button);
    list.append(item);
  });
}

// Below `lg` the chips sit under the map, so a chip can fly a map the visitor
// cannot see. Jump to it when little of it is on screen, keeping the focus on
// the chip that was pressed.
function bringMapIntoView() {
  const container = document.getElementById("section-map");
  const box = container.getBoundingClientRect();
  const onScreen = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
  if (onScreen < Math.min(box.height, 180)) jumpTo(container, { focus: false });
}

// Every Section as a plain link to its rules: the map is never the only way in.
function fillSectionList(sections) {
  const list = document.getElementById("section-list");
  const template = document.getElementById("section-item-template");

  sections.forEach((section, index) => {
    const item = template.content.firstElementChild.cloneNode(true);
    const link = item.querySelector("[data-link]");
    const swatch = item.querySelector("[data-swatch]");

    swatch.style.backgroundColor = sectionColor(index);
    swatch.textContent = sectionId(section, index);
    item.querySelector("[data-name]").textContent = sectionName(section, index);

    const rules = typeof section.rules === "string" ? section.rules.trim() : "";
    if (rules) {
      link.href = rules;
      if (section.portal === true) {
        const portal = item.querySelector("[data-portal]");
        portal.prepend(icon(LOCK_ICON, 16));
        portal.hidden = false;
      }
    } else {
      // Nothing to link to yet: say so rather than offering a dead link.
      link.removeAttribute("target");
      link.removeAttribute("rel");
      item.querySelector("[data-label]").textContent = "Rules not linked yet";
    }

    list.append(item);
  });
}

// The map tells the page which Section is showing, however it was chosen: a
// chip, a click on the map, or the address the visitor arrived with.
function markChosen(id) {
  const key = String(id);
  for (const [chipKey, button] of chips) {
    button.setAttribute("aria-pressed", chipKey === key ? "true" : "false");
  }

  const address = new URL(window.location.href);
  address.searchParams.set("section", key);
  window.history.replaceState(null, "", address.toString());
}

// The board's address always resolves, with or without site.json; the request
// Portal link only appears once its address is known.
function fillQuestions() {
  boardEmail().then((email) => {
    const link = document.getElementById("map-board-email");
    link.href = "mailto:" + email;
    link.textContent = email;
  });

  loadContent("site").then(
    (site) => {
      const url = site && typeof site.requestUrl === "string" ? site.requestUrl.trim() : "";
      if (!url) return;
      document.getElementById("map-request-link").href = url;
      document.getElementById("map-request").hidden = false;
    },
    () => {
      // site.json is unreadable: the email above is still an answer.
    }
  );
}

function sectionId(section, index) {
  if (section && (typeof section.id === "number" || typeof section.id === "string")) return String(section.id);
  return String(index + 1);
}
