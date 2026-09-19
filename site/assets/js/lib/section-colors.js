// Section colors live here and nowhere else, so list chips and map polygons always match.
const SECTION_COLORS = ["#597ea3", "#2c455d", "#416180", "#1d2d3d"];

/**
 * Color for the Section at `index` (0-based position in the sections Content).
 * The offset per row of four keeps neighbouring Sections on the map distinct.
 */
export function sectionColor(index) {
  return SECTION_COLORS[(index + Math.floor(index / 4)) % SECTION_COLORS.length];
}
