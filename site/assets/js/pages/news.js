/*
 * The News page.
 *
 * Every news item, newest first, with its date, topic, title, summary and any
 * extra paragraphs. The markup for an item lives in the page's <template>
 * elements; this module only clones them and writes text, so nothing a board
 * member types can change the page's structure.
 *
 * The news column is the Band that depends on news.json: if that file cannot be
 * read, the message goes there and the title Band, the Portal cards and the
 * Shell are untouched.
 */

import "../shell/site-header.js";
import "../shell/site-footer.js";
import { enableJumpLinks } from "../lib/motion.js";
import { formatContentDate, loadContent, renderBandEmpty, renderBandError } from "../lib/content.js";
import { splitMeetings } from "../lib/meetings.js";
import { newestFirst } from "../lib/news.js";

/** The filter button that shows every topic at once. */
const ALL_TOPICS = "All";

const region = document.getElementById("news");
const filters = document.getElementById("news-filters");
const list = document.getElementById("news-list");
const count = document.getElementById("news-count");
const itemTemplate = document.getElementById("news-item-template");
const paragraphTemplate = document.getElementById("news-paragraph-template");
const filterTemplate = document.getElementById("news-filter-template");

enableJumpLinks(document);

loadContent("news").then(
  (news) => renderNews(newestFirst(news && news.items)),
  () => renderBandError(region)
);

loadContent("site").then(
  (site) => {
    fillPortalCard(document.getElementById("news-pay"), site && site.payUrl);
    fillPortalCard(document.getElementById("news-request"), site && site.requestUrl);
  },
  () => {
    // site.json is unreadable: the Portal cards stay hidden rather than
    // offering a link that goes nowhere. The news itself is unaffected.
  }
);

// The meetings card names the next meeting, worked out from the one list of
// meetings by lib/meetings.js, and keeps its written line when there is no
// next meeting or meetings.json cannot be read.
loadContent("meetings").then(
  (data) => {
    const next = splitMeetings(data).next;
    if (!next) return;
    const when = formatContentDate(next.date, { weekday: "long", month: "long", day: "numeric" });
    if (!when) return;
    document.getElementById("news-next-meeting").textContent = "Next: " + [when, next.time].filter(Boolean).join(", ");
  },
  () => {
    // meetings.json is unreadable: the card still leads to the Meetings page.
  }
);

function renderNews(items) {
  if (!items.length) {
    renderBandEmpty(region, "There is no news yet. Announcements from the board will appear here.");
    return;
  }
  renderFilters(items);
  showTopic(items, ALL_TOPICS);
}

/** One button per topic used by the news, plus "All". Hidden when no item carries one. */
function renderFilters(items) {
  const topics = [];
  for (const item of items) {
    const topic = textOf(item.tag);
    if (topic && !topics.includes(topic)) topics.push(topic);
  }
  if (!topics.length) return;

  for (const topic of [ALL_TOPICS, ...topics]) {
    const button = clone(filterTemplate);
    button.textContent = topic;
    button.setAttribute("aria-pressed", topic === ALL_TOPICS ? "true" : "false");
    button.addEventListener("click", () => {
      for (const other of filters.children) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      }
      showTopic(items, topic);
    });
    filters.append(button);
  }
  filters.hidden = false;
}

function showTopic(items, topic) {
  const visible = topic === ALL_TOPICS ? items : items.filter((item) => textOf(item.tag) === topic);
  const batch = document.createDocumentFragment();
  for (const item of visible) batch.append(newsItem(item));
  list.replaceChildren(batch);
  count.textContent =
    "Showing " + visible.length + " of " + items.length + (items.length === 1 ? " news item" : " news items");
}

function newsItem(item) {
  const node = clone(itemTemplate);
  const date = node.querySelector("[data-date]");
  const body = node.querySelector("[data-body]");

  const dateLabel = formatContentDate(item.date);
  if (dateLabel) {
    date.setAttribute("datetime", item.date);
    date.textContent = dateLabel;
  } else {
    date.remove();
  }

  fill(node.querySelector("[data-tag]"), textOf(item.tag));
  fill(node.querySelector("[data-title]"), textOf(item.title));
  fill(node.querySelector("[data-summary]"), textOf(item.summary));

  const paragraphs = Array.isArray(item.body) ? item.body.map(textOf).filter(Boolean) : [];
  if (paragraphs.length) {
    for (const paragraph of paragraphs) {
      const line = clone(paragraphTemplate);
      line.textContent = paragraph;
      body.append(line);
    }
  } else {
    body.remove();
  }

  return node;
}

/** Write a field's text, or take its element out of the page when the field is missing. */
function fill(node, value) {
  if (!node) return;
  if (value) node.textContent = value;
  else node.remove();
}

function fillPortalCard(card, url) {
  if (!card || typeof url !== "string" || !url.trim()) return;
  card.href = url.trim();
  card.hidden = false;
}

function clone(template) {
  return template.content.firstElementChild.cloneNode(true);
}

function textOf(value) {
  return typeof value === "string" ? value.trim() : "";
}
