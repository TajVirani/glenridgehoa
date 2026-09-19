# Contributing

How the Glen Ridge HOA website is built. Read this before changing anything under `site/`.

- Vocabulary (**Section**, **Document**, **Portal**, **Content**, **Shell**, **Band**, **Jump**, **Disclosure**) is defined in [CONTEXT.md](CONTEXT.md). Use those words in code, comments and commits.
- The reasons behind the three big decisions are in [docs/adr/](docs/adr/).
- Editing news, meetings or Documents? That is [CONTENT-GUIDE.md](CONTENT-GUIDE.md), not this file.

## The shape of the project

The site is static files on GitHub Pages at `glenridgehomeowners.com`. There is no build step: what is in `site/` is exactly what visitors receive (ADR-0001, ADR-0002).

```
site/                       the website, and the only folder that is published
  index.html  news.html  map.html  documents.html  meetings.html  404.html
  CNAME
  content/                  Content: the five JSON files the board edits
    site.json  news.json  meetings.json  documents.json  sections.json
  assets/
    js/
      theme.js              Tailwind theme: the one place colors and fonts are defined
      shell/                site-header.js, site-footer.js, dom.js (element and icon builders)
      lib/                  content.js, motion.js, meetings.js, news.js, section-colors.js, section-map.js
      pages/                one module per page: home.js, news.js, map.js, documents.js, meetings.js, not-found.js
    css/site.css            the escape hatch (see "CSS")
    img/
docs/adr/                   architecture decisions
.github/workflows/          checks + deploy
```

File and folder names are lowercase, hyphenated, with no spaces. Every URL inside the site is relative (`content/news.json`, not `/content/news.json`), so the site works at the custom domain, at a `github.io` subpath, and from a local server.

Preview locally with `npm run serve` (or `python3 -m http.server --directory site`) and open `http://localhost:8000`. Pages fetch their Content, so opening them from `file://` does not work.

## Libraries

Everything the browser loads from a third party comes from a public CDN. The allowed list is:

| Library | Purpose |
| --- | --- |
| `@tailwindcss/browser` | all styling |
| `leaflet` | the Section map |
| Google Fonts (Barlow, Barlow Condensed) | type |

- Load from jsDelivr (`cdn.jsdelivr.net/npm/...`); fonts from Google Fonts.
- Pin the exact version in the URL. Upgrades are deliberate, one-line changes.
- Add `integrity` and `crossorigin` attributes wherever the file is static (Leaflet's JS and CSS).
- Adding a library means adding a row to this table in the same change, with a reason. Prefer the platform: there is no framework, and the pages do not need one.

`package.json` holds lint tooling for developers only. Nothing from `node_modules` is ever referenced by the site.

## CSS

Tailwind utilities, for everything.

- The theme lives in `assets/js/theme.js` and nowhere else: the `steel-100…900` ramp, `ink` (#1d1f20), `paper` (#f2f2f3), `font-heading` (Barlow Condensed) and `font-body` (Barlow). The scheme is mono steel-blue with no second accent; reach for the ramp rather than a new color.
- `theme.js` is a blocking classic script placed in `<head>` before the Tailwind script, so the theme exists before first paint.
- `assets/css/site.css` is the escape hatch for what utilities cannot express: overrides of Leaflet's own classes, and `@keyframes`. If a rule could be a utility, it is a utility.
- Shape language: square corners, solid steel color Bands, inline Lucide-style SVG icons at `stroke-width="1.5"`, hover and focus states drawn from the steel ramp.

## Pages and the Shell

- Each page is a plain `.html` file containing its own Bands and `<template>` elements, and loads exactly one page module from `assets/js/pages/`.
- The Shell is two custom elements defined once: `<site-header current="home|news|map|documents|meetings">` (sets `aria-current` on the nav) and `<site-footer>`. They render into the light DOM so Tailwind classes apply. Change the header or footer in its module and every page follows.
- Every page includes a `<noscript>` line giving the board's email address.

## JavaScript

Native ES modules, no bundler, no TypeScript.

- A page module imports only from `lib/` and `shell/`. Page modules do not import each other.
- `lib/content.js` is the only code that calls `fetch()` for Content, and the only place dates are parsed.
- `lib/motion.js` is the only code that scrolls or animates height.
- `lib/meetings.js` is the only code that decides which meetings are next, upcoming and past.
- `lib/section-map.js` owns the Leaflet map. `lib/section-colors.js` owns the Section colors: list chips and map polygons get their color from the same function, so they always match.
- Run `npm run check` before committing: it is what the deploy workflow runs (Content check, internal link check, lint). ESLint's recommended rules apply, plus the text-only rule below.

### Dates

Content stores dates as `YYYY-MM-DD`. Parse them as `new Date(d + 'T12:00:00')`. Parsing the bare string gives midnight UTC, which is the previous day in Ohio.

## Rendering Content

Content is read from JSON and written to the page as text.

1. The page's HTML holds a `<template>` with the full Tailwind markup for one item (one news item, one meeting, one Document).
2. The page module clones the template and fills it using `textContent` and attribute setters (`href`, `datetime`).
3. `innerHTML`, `outerHTML` and `insertAdjacentHTML` are lint errors. JSON never contains HTML; a field that needs paragraphs is an array of strings.

This keeps markup in the HTML files where it can be seen and styled, and means nothing an editor types can break or script a page.

### Every fact lives in one place

Content is edited by non-technical board members, so the site derives what it can instead of asking for it twice:

- There is one list of meetings. Upcoming, past and "next meeting" are computed from each meeting's date against today.
- Section rules appear in the Documents library from `sections.json`; they are not repeated in `documents.json`.
- Section colors are code, not Content.

### When Content is missing or broken

- Each Band fails on its own. If `news.json` cannot be loaded or parsed, the news Band shows: "This information couldn't be loaded. Please email the board at …" and the rest of the page works.
- The board's email comes from `site.json`, with a fallback constant in `lib/content.js` for when `site.json` is the file that failed.
- A missing optional field hides its element; it never prints `undefined` or throws.
- Empty lists get a sentence ("No upcoming meetings are scheduled."), never a blank Band.
- No spinners. Bands reserve their height so the page does not shift when Content arrives.

## Motion

Anything that moves the visitor animates, and all of it goes through `lib/motion.js`.

- **Jumps** animate: in-page links, back-to-top, the skip link, and the map flying to a Section (chip click or `?section=N`). Jump targets clear the header (`scroll-mt-*`). The skip link moves keyboard focus immediately; only the scroll is animated.
- **Disclosures** animate open and closed: the mobile menu, and anything added later that expands in place. Keep `aria-expanded` in sync.
- Durations are 200–300 ms.
- Arriving on a page with a `#hash` in the URL is a page load, not a Jump, and is not animated.
- Under `prefers-reduced-motion: reduce`, every Jump and Disclosure is instant. `lib/motion.js` checks this once so callers cannot forget. There are no exceptions.

## Responsive

- Write mobile-first: base classes are the phone layout, `sm:` / `md:` / `lg:` add to it. Tailwind's default breakpoints.
- Nothing scrolls sideways at 320 px wide.
- Below `md`, the nav is a Disclosure menu.
- On phones, tabular Content (past meetings, Documents) stacks into list rows rather than becoming a scrolling table.
- The map stays tall enough to use on a phone.
- Check every change at 320, 768 and 1280 px.

## Accessibility

WCAG 2.2 AA is a requirement, checked by hand on every change:

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, headings in order.
- Everything works from the keyboard, with a visible focus state from the steel ramp.
- Text contrast of at least 4.5:1 (3:1 for large text and icons). Check new pairings from the ramp before using them.
- Interactive targets are at least 48 px (`min-h-12`).
- The skip link is the first focusable element on every page.
- The map is never the only way to reach information: every Section is also listed as a link beside it.
- Links that open a new tab or need the Portal login say so in text, not only with an icon.

## Git and deployment

- Content edits are committed straight to `main`, usually from GitHub's web editor. Code changes go on a branch and are merged.
- Every push to `main` runs the workflow: JSON syntax, required keys per Content file, internal links, ESLint. If all pass, `site/` is published. If any fail, the previous version stays live.
- Commit messages describe the change in plain language ("Add October minutes link", "Fix header focus ring").
- The repository is public and tool-neutral: code, comments, docs and commit messages describe the project and carry no names of editors, assistants or vendors, and no attribution trailers.
