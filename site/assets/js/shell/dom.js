/*
 * The Shell's element builders.
 *
 * The header and the footer are each defined once, in JavaScript, so a change
 * reaches every page. Content is never written as an HTML string anywhere on
 * this site (see CONTRIBUTING.md, "Rendering Content"), so the Shell is built
 * from real elements too: `element()` for HTML, `icon()` for the inline
 * Lucide-style SVG icons.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** Create an element: attributes by name, `text` for its text, plus any children (nodes or strings). */
export function element(tag, attributes, children) {
  const node = document.createElement(tag);
  if (attributes) {
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || value === null || value === false) continue;
      if (name === "text") node.textContent = String(value);
      else if (value === true) node.setAttribute(name, "");
      else node.setAttribute(name, String(value));
    }
  }
  if (children) {
    for (const child of children) {
      if (child === undefined || child === null || child === false) continue;
      node.append(child);
    }
  }
  return node;
}

/** Create a decorative inline icon: a 24x24 outline drawing at stroke-width 1.5, from its path data. */
export function icon(paths, size) {
  const svg = document.createElementNS(SVG_NS, "svg");
  const box = String(size || 22);
  svg.setAttribute("width", box);
  svg.setAttribute("height", box);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const data of paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", data);
    svg.appendChild(path);
  }
  return svg;
}
