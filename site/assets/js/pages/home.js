/*
 * The Home page.
 *
 * Four Bands read Content, and each one reads a different file, so a file the
 * board has broken takes only its own Band with it: the three newest news
 * items, the next meeting (also called out in the hero), the Section map with
 * its list of Sections, and the Portal cards at the foot of the page.
 *
 * Nothing here decides anything twice. The newest news is the top of the same
 * order the News page shows, the next meeting comes from lib/meetings.js, and
 * the map and the colors of the list beside it come from lib/section-map.js
 * and lib/section-colors.js, exactly as the Community Map page does.
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
import { splitMeetings } from "../lib/meetings.js";
import { newestFirst } from "../lib/news.js";
import { enableJumpLinks, jumpTo } from "../lib/motion.js";
import { sectionColor } from "../lib/section-colors.js";
import { createSectionMap, sectionName } from "../lib/section-map.js";

/** How many news items the Home page shows (CONTENT-GUIDE.md: "The home page shows the first three"). */
const NEWS_SHOWN = 3;

const newsBand = document.getElementById("home-news");
const meetingBand = document.getElementById("home-next-meeting");
const sectionBand = document.getElementById("home-sections");

const chips = new Map();

enableJumpLinks(document);

loadContent("news").then(
  (news) => fillNews(newestFirst(news && news.items).slice(0, NEWS_SHOWN)),
  () => renderBandError(newsBand)
);

loadContent("meetings").then(
  (data) => fillNextMeeting(splitMeetings(data).next),
  () => {
    // The hero keeps its plain link to the Meetings page; only the Band that
    // promises a date has to admit it has none.
    renderBandError(meetingBand);
  }
);

loadContent("sections").then(fillSectionBand, () => renderBandError(sectionBand));

fillPortalCards();

/* ------------------------------------------------------------------ *
 * News
 * ------------------------------------------------------------------ */

function fillNews(items) {
  if (!items.length) {
    renderBandEmpty(newsBand, "There is no news yet. Announcements from the board will appear here.");
    return;
  }

  const list = document.getElementById("home-news-list");
  const template = document.getElementById("home-news-template");

  for (const item of items) {
    const card = template.content.firstElementChild.cloneNode(true);
    const date = card.querySelector("[data-date]");

    const dateLabel = formatContentDate(item.date);
    if (dateLabel) {
      date.setAttribute("datetime", item.date);
      date.textContent = dateLabel;
    } else {
      date.remove();
    }

    fill(card.querySelector("[data-tag]"), textOf(item.tag));
    fill(card.querySelector("[data-title]"), textOf(item.title));
    fill(card.querySelector("[data-summary]"), textOf(item.summary));

    list.append(card);
  }
}

/* ------------------------------------------------------------------ *
 * The next meeting
 * ------------------------------------------------------------------ */

function fillNextMeeting(meeting) {
  if (!meeting) {
    renderBandEmpty(meetingBand, "No upcoming meetings are scheduled.");
    return;
  }

  const date = document.getElementById("home-next-date");
  date.setAttribute("datetime", meeting.date);
  date.textContent = formatContentDate(meeting.date, { weekday: "long", month: "long", day: "numeric" });

  document.getElementById("home-next-headline").textContent = join([meeting.time, meeting.title]);
  show(document.getElementById("home-next-note"), meeting.note);
  show(document.getElementById("home-next-location"), meeting.location);

  fillHeroMeeting(meeting);
}

// The hero's meetings row, which reads as a plain link to the Meetings page
// until the date of the next meeting is known.
function fillHeroMeeting(meeting) {
  const when = formatContentDate(meeting.date, { weekday: "short", month: "short", day: "numeric" });
  if (!when) return;

  document.getElementById("hero-meeting-label").textContent = "Next board meeting";
  show(document.getElementById("hero-meeting-title"), meeting.title);
  document.getElementById("hero-meeting-when").textContent = join([when, meeting.time]);
  document.getElementById("hero-meeting-context").textContent = " (the meetings calendar and minutes)";
}

/* ------------------------------------------------------------------ *
 * The Sections
 * ------------------------------------------------------------------ */

function fillSectionBand(content) {
  const sections = Array.isArray(content && content.sections) ? content.sections : [];
  if (!sections.length) {
    renderBandEmpty(sectionBand, "Section information is not available yet.");
    return;
  }

  // The list first: it is the part that has to work whatever the map does.
  fillSectionList(sections);
  fillSectionEmail();

  const container = document.getElementById("home-map");
  let sectionMap;
  try {
    sectionMap = createSectionMap(container, content, { onSelect: markChosen });
  } catch {
    // No Leaflet, or no boundaries to draw. The list beside it carries the
    // Band, and its "Show" buttons stay out of the page.
    container.hidden = true;
    document.getElementById("home-map-unavailable").hidden = false;
    return;
  }

  enableChips(sectionMap);
}

// Every Section as a link to it on the Community Map page: the map here is
// never the only way in.
function fillSectionList(sections) {
  const list = document.getElementById("home-section-list");
  const template = document.getElementById("home-section-template");

  sections.forEach((section, index) => {
    const item = template.content.firstElementChild.cloneNode(true);
    const key = sectionId(section, index);
    const name = sectionName(section, index);
    const swatch = item.querySelector("[data-swatch]");

    swatch.style.backgroundColor = sectionColor(index);
    swatch.textContent = key;
    item.querySelector("[data-name]").textContent = name;
    item.querySelector("[data-link]").href = "map.html?section=" + encodeURIComponent(key);

    const chip = item.querySelector("[data-chip]");
    item.querySelector("[data-chip-context]").textContent = " " + name + " on the map above";
    chips.set(key, chip);

    list.append(item);
  });
}

// The "Show" buttons only appear once there is a map for them to move, and
// only for the Sections that map actually drew.
function enableChips(sectionMap) {
  const drawn = new Set(sectionMap.sectionIds);
  for (const [key, chip] of chips) {
    if (!drawn.has(key)) continue;
    chip.addEventListener("click", () => {
      sectionMap.flyToSection(key);
      bringMapIntoView();
    });
    chip.hidden = false;
  }
}

// Below `lg` the list sits under the map, so a button can fly a map the visitor
// cannot see. Jump to it when little of it is on screen, keeping the focus on
// the button that was pressed.
function bringMapIntoView() {
  const container = document.getElementById("home-map");
  const box = container.getBoundingClientRect();
  const onScreen = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
  if (onScreen < Math.min(box.height, 180)) jumpTo(container, { focus: false });
}

// The map tells the page which Section is showing, however it was chosen.
function markChosen(id) {
  const key = String(id);
  for (const [chipKey, chip] of chips) {
    chip.setAttribute("aria-pressed", chipKey === key ? "true" : "false");
  }
}

// The board's address always resolves, with or without site.json.
function fillSectionEmail() {
  const link = document.getElementById("home-section-email");
  if (!link) return;
  boardEmail().then((email) => {
    link.href = "mailto:" + email;
  });
}

/* ------------------------------------------------------------------ *
 * The Portal cards
 * ------------------------------------------------------------------ */

function fillPortalCards() {
  loadContent("site").then(
    (site) => {
      fillPortalCard(document.getElementById("home-pay"), site && site.payUrl);
      fillPortalCard(document.getElementById("home-request"), site && site.requestUrl);
    },
    () => {
      // site.json is unreadable: the Portal cards stay out of the page rather
      // than offering a link that goes nowhere.
    }
  );
}

function fillPortalCard(card, url) {
  if (!card || typeof url !== "string" || !url.trim()) return;
  card.href = url.trim();
  card.hidden = false;
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

/** Write a field's text, or take its element out of the page when the field is missing. */
function fill(node, value) {
  if (!node) return;
  if (value) node.textContent = value;
  else node.remove();
}

// Show an element with its text, or leave it hidden when the board left that
// field out.
function show(node, value) {
  if (!node || !value) return;
  node.textContent = value;
  node.hidden = false;
}

function join(parts) {
  return parts.filter(Boolean).join(" · ");
}

function sectionId(section, index) {
  if (section && (typeof section.id === "number" || typeof section.id === "string")) return String(section.id);
  return String(index + 1);
}

function textOf(value) {
  return typeof value === "string" ? value.trim() : "";
}
