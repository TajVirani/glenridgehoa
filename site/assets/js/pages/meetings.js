/*
 * The Meetings page.
 *
 * The board keeps one list of meetings; `lib/meetings.js` decides which one is
 * next, which are still upcoming and which are past. This module only fills the
 * page's templates with what it gets back: the next meeting is called out in
 * the intro Band, the meetings after it fill the Upcoming Band, and the past
 * ones fill the list that becomes a table-like grid from md up.
 */

import "../shell/site-header.js";
import "../shell/site-footer.js";
import { formatContentDate, loadContent, renderBandEmpty, renderBandError } from "../lib/content.js";
import { splitMeetings } from "../lib/meetings.js";
import { enableJumpLinks } from "../lib/motion.js";

enableJumpLinks(document);

const nextBand = document.getElementById("next-meeting");
const upcomingBand = document.getElementById("upcoming-body");
const pastBand = document.getElementById("past-body");

loadContent("meetings").then(fillPage, () => {
  // Every Band on this page reads the same file, so a broken file takes all
  // three down together; the Shell, the intro text and the request Band stay.
  renderBandError(nextBand);
  renderBandError(upcomingBand);
  renderBandError(pastBand);
});

// The request Band's button leads to the Portal, so it stays hidden until
// site.json says where the Portal is, exactly as the Shell's buttons do.
loadContent("site").then(
  (site) => {
    const url = site && typeof site.requestUrl === "string" ? site.requestUrl.trim() : "";
    if (!url) return;
    const button = document.getElementById("agenda-request");
    button.href = url;
    button.hidden = false;
  },
  () => {
    // site.json is unreadable: the Band keeps its heading and offers no link.
  }
);

function fillPage(data) {
  const { next, upcoming, past } = splitMeetings(data);
  const fileLocation = data && typeof data.location === "string" ? data.location.trim() : "";
  fillNext(next);
  fillUpcoming(upcoming, next, fileLocation);
  fillPast(past);
}

function fillNext(meeting) {
  if (!meeting) {
    renderBandEmpty(nextBand, "No upcoming meetings are scheduled.");
    return;
  }

  const date = document.getElementById("next-date");
  date.setAttribute("datetime", meeting.date);
  date.textContent = formatContentDate(meeting.date, { weekday: "long", month: "long", day: "numeric" });

  document.getElementById("next-headline").textContent = join([meeting.time, meeting.title]);
  show(document.getElementById("next-note"), meeting.note);
  show(document.getElementById("next-location"), meeting.location);
}

function fillUpcoming(meetings, next, fileLocation) {
  if (!meetings.length) {
    renderBandEmpty(
      upcomingBand,
      next ? "No other meetings are scheduled yet." : "No upcoming meetings are scheduled."
    );
    return;
  }

  const list = document.getElementById("upcoming-list");
  const template = document.getElementById("upcoming-template");

  for (const meeting of meetings) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector("[data-month]").textContent = formatContentDate(meeting.date, { month: "short" });
    row.querySelector("[data-day]").textContent = formatContentDate(meeting.date, { day: "numeric" });
    row.querySelector("[data-title]").textContent = meeting.title;
    row.querySelector("[data-when]").textContent = join([
      formatContentDate(meeting.date, { weekday: "long" }),
      meeting.time
    ]);
    show(row.querySelector("[data-note]"), meeting.note);
    // The location only earns a line here when this meeting is somewhere other
    // than the usual place; the usual place is already on the next meeting.
    show(row.querySelector("[data-location]"), meeting.location === fileLocation ? "" : meeting.location);
    list.append(row);
  }
}

function fillPast(meetings) {
  if (!meetings.length) {
    renderBandEmpty(pastBand, "No past meetings are listed yet.");
    return;
  }

  const list = document.getElementById("past-list");
  const template = document.getElementById("past-template");

  for (const meeting of meetings) {
    const row = template.content.firstElementChild.cloneNode(true);
    const label = formatContentDate(meeting.date);

    const date = row.querySelector("[data-date]");
    date.setAttribute("datetime", meeting.date);
    date.textContent = label;
    row.querySelector("[data-title]").textContent = meeting.title;

    const agenda = fillLink(row, "agenda", meeting.agenda, meeting.title, label);
    const minutes = fillLink(row, "minutes", meeting.minutes, meeting.title, label);
    // The Portal note belongs to the links, so it only appears alongside one.
    if (meeting.portal && (agenda || minutes)) row.querySelector("[data-portal]").hidden = false;

    list.append(row);
  }
}

// One agenda or minutes link: hidden unless the board has added it, opening in
// a new tab and saying so in words for anyone who cannot see the row.
function fillLink(row, name, url, title, dateLabel) {
  if (!url) return false;
  const link = row.querySelector("[data-" + name + "]");
  link.href = url;
  link.hidden = false;
  row.querySelector("[data-" + name + "-context]").textContent =
    " for " + join([title, dateLabel], ", ") + " (opens in a new tab)";
  return true;
}

// Show an element with its text, or leave it hidden when the board left that
// field out: a missing optional field hides its element rather than printing
// an empty line.
function show(element, value) {
  if (!element || !value) return;
  element.textContent = value;
  element.hidden = false;
}

function join(parts, separator) {
  return parts.filter(Boolean).join(separator || " · ");
}
