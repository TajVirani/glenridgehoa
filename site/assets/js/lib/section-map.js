/*
 * The Section map.
 *
 * One map, drawn once and used by more than one page: the Community Map page
 * and the Home page show the same eight Section polygons, in the same colors
 * as their list chips, because both the polygons here and the chips there ask
 * lib/section-colors.js for the color.
 *
 * Leaflet is a page-level <script>, so the `L` global only exists on pages
 * that load it. Nothing outside a function here touches `L`: importing this
 * module is always safe, and a page without Leaflet simply never calls
 * createSectionMap (or catches the error it throws and shows its list).
 *
 * Popups are built as real elements, never as an HTML string, the same rule
 * the rest of the site follows for Content.
 */

import { element, icon } from "../shell/dom.js";
import { sectionColor } from "./section-colors.js";
import { prefersReducedMotion } from "./motion.js";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "© OpenStreetMap contributors";
const MAX_ZOOM = 19;

// Used only when the sections Content is missing its map view; the neighborhood
// center, so an incomplete file still opens over Glenridge.
const FALLBACK_CENTER = [39.571, -84.181];
const FALLBACK_ZOOM = 16;

// A flight to a Section is a Jump, so it keeps to the site's 200-300 ms range.
const FLY_SECONDS = 0.3;

// Padding, in pixels, around the whole neighborhood and around one Section.
const FIT_PADDING = [12, 12];
const SECTION_PADDING = [40, 40];

// Below this the container has no usable height yet (its stylesheet has not
// arrived, or the page is hidden), and anything measured from it would be wrong.
const MIN_USABLE_HEIGHT = 40;

const FILL_OPACITY = 0.55;
const FILL_OPACITY_HOVER = 0.78;

const LOCK_ICON = [
  "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
  "M7 11V7a5 5 0 0 1 10 0v4"
];

/** The name to show for a Section, falling back to its number when the Content has none. */
export function sectionName(section, index) {
  if (section && typeof section.name === "string" && section.name.trim()) return section.name.trim();
  return "Section " + sectionKey(section, index);
}

/**
 * Draw the Sections of the sections Content into `container` and return the
 * handle the page drives it with: `{ map, sectionIds, flyToSection, invalidateSize, remove }`.
 */
export function createSectionMap(container, content, options) {
  if (typeof L === "undefined") throw new Error("Leaflet is not available on this page.");
  if (!container) throw new Error("The Section map needs a container element.");

  const settings = options || {};
  const sections = Array.isArray(content && content.sections) ? content.sections : [];
  if (!sections.some(hasBoundary)) throw new Error("The sections Content has no boundaries to draw.");

  const map = L.map(container, {
    center: isLatLng(content.center) ? content.center : FALLBACK_CENTER,
    zoom: typeof content.zoom === "number" ? content.zoom : FALLBACK_ZOOM,
    // The map sits inside a scrolling page: the wheel belongs to the page
    // unless a caller asks otherwise.
    scrollWheelZoom: settings.scrollWheelZoom === true,
    keyboard: true
  });

  L.tileLayer(TILE_URL, { maxZoom: MAX_ZOOM, attribution: TILE_ATTRIBUTION }).addTo(map);

  const group = L.featureGroup().addTo(map);
  const layers = new Map();

  // Walk every entry, including any without a boundary, so a Section's color
  // comes from its position in the Content and matches the page's list.
  sections.forEach((section, index) => {
    if (!hasBoundary(section)) return;
    const key = sectionKey(section, index);
    const polygon = L.polygon(section.polygon, {
      color: "#f2f2f3",
      weight: 3,
      fillColor: sectionColor(index),
      fillOpacity: FILL_OPACITY
    });
    polygon.bindPopup(buildPopup(section, index));
    polygon.bindTooltip(element("span", { text: key }), {
      permanent: true,
      direction: "center",
      className: "section-label",
      interactive: false
    });
    polygon.on("mouseover", () => polygon.setStyle({ fillOpacity: FILL_OPACITY_HOVER }));
    polygon.on("mouseout", () => polygon.setStyle({ fillOpacity: FILL_OPACITY }));
    polygon.on("popupopen", () => {
      if (typeof settings.onSelect === "function") settings.onSelect(key);
    });
    polygon.addTo(group);
    layers.set(key, polygon);
  });

  // The whole neighborhood is the opening view, but only once the container has
  // a real height: Tailwind compiles in the browser, so the map can be built a
  // moment before the class that gives it its height takes effect.
  let framed = false;
  let waiting = null;
  let observer = null;

  function frame() {
    map.invalidateSize(false);
    if (container.clientHeight < MIN_USABLE_HEIGHT) return;
    if (waiting !== null) {
      const key = waiting;
      waiting = null;
      framed = true;
      show(key);
      return;
    }
    if (framed) return;
    framed = true;
    map.fitBounds(group.getBounds(), { padding: FIT_PADDING, animate: false });
  }

  function show(key) {
    const layer = layers.get(key);
    if (!layer) return;
    const bounds = layer.getBounds();
    if (prefersReducedMotion()) {
      map.fitBounds(bounds, { padding: SECTION_PADDING, animate: false });
    } else {
      map.flyToBounds(bounds, { padding: SECTION_PADDING, duration: FLY_SECONDS });
    }
    layer.openPopup();
  }

  if (typeof ResizeObserver === "function") {
    observer = new ResizeObserver(() => frame());
    observer.observe(container);
  }
  frame();

  return {
    /** The Leaflet map itself, for anything a page needs that is not below. */
    map,
    /** The ids of the Sections actually drawn, in Content order, as strings. */
    sectionIds: Array.from(layers.keys()),

    /** Fly to a Section and open its popup; instant under reduced motion. False if there is no such Section. */
    flyToSection(id) {
      const key = String(id);
      if (!layers.has(key)) return false;
      if (container.clientHeight < MIN_USABLE_HEIGHT) {
        // Asked for before the container had a height: fly as soon as it does.
        waiting = key;
        return true;
      }
      framed = true;
      show(key);
      return true;
    },

    /** Re-measure the container after the page around it changes shape. */
    invalidateSize() {
      frame();
    },

    /** Take the map off the page and stop watching its container. */
    remove() {
      if (observer) observer.disconnect();
      map.remove();
    }
  };
}

// The popup for one Section: its name, and the link to its rules, saying in
// words when that link opens a new tab or needs the Portal login.
function buildPopup(section, index) {
  const name = sectionName(section, index);
  const popup = element("div", { class: "section-popup" }, [
    element("h3", { class: "section-popup-title", text: name })
  ]);

  const rules = typeof section.rules === "string" ? section.rules.trim() : "";
  if (!rules) {
    popup.append(element("p", { class: "section-popup-note", text: "The rules for this section are not linked yet." }));
    return popup;
  }

  popup.append(
    element("a", { class: "section-popup-link", href: rules, target: "_blank", rel: "noopener" }, [
      "Open the " + name + " rules",
      element("span", { class: "sr-only", text: " (opens in a new tab)" })
    ])
  );

  if (section.portal === true) {
    popup.append(
      element("p", { class: "section-popup-portal" }, [icon(LOCK_ICON, 16), "Portal login required"])
    );
  }

  return popup;
}

function sectionKey(section, index) {
  if (section && (typeof section.id === "number" || typeof section.id === "string")) return String(section.id);
  return String(typeof index === "number" ? index + 1 : "");
}

function hasBoundary(section) {
  return Boolean(section) && Array.isArray(section.polygon) && section.polygon.length >= 3 && section.polygon.every(isLatLng);
}

function isLatLng(point) {
  return Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]);
}
