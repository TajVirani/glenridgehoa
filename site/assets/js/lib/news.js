import { parseContentDate } from "./content.js";

/** News items newest first; file order breaks ties, and items with a missing or misspelled date go last. */
export function newestFirst(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item === "object")
    .map((item, order) => ({ item, order, at: timeOf(item.date) }))
    .sort((a, b) => b.at - a.at || a.order - b.order)
    .map((entry) => entry.item);
}

function timeOf(value) {
  const date = parseContentDate(value);
  return date ? date.getTime() : -Infinity;
}
