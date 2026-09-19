/*
 * The Tailwind theme: the one place the site's colors and fonts are defined.
 *
 * This is a blocking classic script in every page's <head>, placed before the
 * Tailwind browser build, so the theme exists before Tailwind's first compile
 * and therefore before first paint. Tailwind v4 is configured in CSS, so the
 * theme is a `@theme` block inside a <style type="text/tailwindcss">, which the
 * browser build reads along with every other stylesheet of that type.
 *
 * The scheme is mono steel-blue with no second accent. Reach for a step of the
 * ramp rather than adding a color here.
 */
(function () {
  "use strict";

  // `static` keeps every step of the ramp as a custom property on :root even
  // when no page uses that step's utility, so CSS that cannot be a utility
  // (assets/css/site.css, and the map's Leaflet styling) can read the palette
  // from here instead of repeating the values.
  var theme = [
    "@theme static {",
    "  --color-steel-100: #eef6ff;",
    "  --color-steel-200: #d6ebff;",
    "  --color-steel-300: #b5d9fd;",
    "  --color-steel-400: #94bce3;",
    "  --color-steel-500: #749dc4;",
    "  --color-steel-600: #597ea3;",
    "  --color-steel-700: #416180;",
    "  --color-steel-800: #2c455d;",
    "  --color-steel-900: #1d2d3d;",
    "  --color-ink: #1d1f20;",
    "  --color-paper: #f2f2f3;",
    "  --font-heading: 'Barlow Condensed', system-ui, sans-serif;",
    "  --font-body: 'Barlow', system-ui, sans-serif;",
    // Tailwind's own default font family reads --font-sans; pointing it at the
    // body face makes unclassed text match the rest of the site.
    "  --font-sans: 'Barlow', system-ui, sans-serif;",
    "}"
  ].join("\n");

  var style = document.createElement("style");
  style.setAttribute("type", "text/tailwindcss");
  style.textContent = theme;
  document.head.appendChild(style);
})();
