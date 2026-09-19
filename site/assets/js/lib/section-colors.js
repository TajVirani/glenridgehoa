// Section colors live here and nowhere else, so list chips and map polygons always match.
const SECTION_COLORS = ["#597ea3", "#2c455d", "#416180", "#1d2d3d"];

// Which color each Section gets, by its position in the sections Content
// (1, 2, 3A, 3B, 4, 5, 6A, 6B). Chosen from the real plat so that no two
// Sections that touch on the map share a color. Section 5 touches six others,
// so it is the only one in its color.
const COLOR_ORDER = [0, 1, 3, 0, 1, 2, 3, 0];

/** Color for the Section at `index` (0-based position in the sections Content). */
export function sectionColor(index) {
  const slot = COLOR_ORDER[index % COLOR_ORDER.length];
  return SECTION_COLORS[slot === undefined ? 0 : slot];
}
