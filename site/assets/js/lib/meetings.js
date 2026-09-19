/*
 * Meetings: which meeting is next, which are still upcoming, which are past.
 *
 * The board keeps one list of meetings and never marks any of them (see
 * CONTENT-GUIDE.md); the split is worked out here by comparing each date with
 * today. This is the only module that makes that decision, so the Meetings
 * page and the Home page's next meeting Band can never disagree.
 */

import { parseContentDate } from "./content.js";

/**
 * Split the meetings Content into the next meeting, the upcoming ones after it and the past ones.
 *
 * `next` is the soonest meeting dated today or later, or `null` when there is
 * none. `upcoming` holds the meetings after that one, soonest first, and never
 * repeats `next`. `past` holds the meetings before today, most recent first. A
 * meeting dated today is upcoming, never past. An entry without a usable date
 * is left out instead of throwing, and every returned meeting carries the
 * location that applies to it: its own where it has one, the file-wide one
 * otherwise.
 */
export function splitMeetings(data, today = new Date()) {
  const entries = data && Array.isArray(data.meetings) ? data.meetings : [];
  const fileLocation = text(data && data.location);
  const startOfToday = startOfDay(today);

  const dated = [];
  for (const entry of entries) {
    const date = parseContentDate(entry && entry.date);
    if (!date) continue; // a missing or misspelled date drops one meeting, not the page
    dated.push({ at: date.getTime(), meeting: toMeeting(entry, fileLocation) });
  }

  const upcoming = dated.filter((row) => row.at >= startOfToday).sort((a, b) => a.at - b.at).map(justMeeting);
  const past = dated.filter((row) => row.at < startOfToday).sort((a, b) => b.at - a.at).map(justMeeting);

  return { next: upcoming.length ? upcoming[0] : null, upcoming: upcoming.slice(1), past };
}

// One meeting, with every field a page reads present as a string: an empty
// string means the board left it out, so a page can hide the element without
// ever printing "undefined".
function toMeeting(entry, fileLocation) {
  return {
    date: entry.date,
    time: text(entry.time),
    title: text(entry.title),
    note: text(entry.note),
    location: text(entry.location) || fileLocation,
    agenda: text(entry.agenda),
    minutes: text(entry.minutes),
    portal: entry.portal === true
  };
}

function justMeeting(row) {
  return row.meeting;
}

// Midnight this morning: a meeting is parsed at local noon, so anything dated
// today lands after this and counts as upcoming.
function startOfDay(today) {
  const now = today instanceof Date && !Number.isNaN(today.getTime()) ? today : new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
