# Glenridge HOA website

The public website of the Glenridge Homeowners Association, Clearcreek Township, Ohio: [glenridgehomeowners.com](https://glenridgehomeowners.com).

A static site on GitHub Pages. Plain HTML, Tailwind from a CDN, a little vanilla JavaScript, and Content read from JSON files. There is no build step: the `site/` folder is the website.

## I want to…

- **Update news, meetings or documents** → [CONTENT-GUIDE.md](CONTENT-GUIDE.md). No software needed; you edit in the browser.
- **Change how the site looks or works** → [CONTRIBUTING.md](CONTRIBUTING.md).
- **Understand the project's vocabulary** (Section, Document, Portal, Band…) → [CONTEXT.md](CONTEXT.md).
- **Understand why it is built this way** → [docs/adr/](docs/adr/).

## Run it locally

```
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000>. A network connection is required (Tailwind, Leaflet, fonts and map tiles load from public CDNs).

Developers changing JavaScript also run the linter:

```
npm install
npm run lint
```

## Publishing

Every push to `main` is checked (Content files, internal links, lint) and, if the checks pass, `site/` is published to GitHub Pages. A failed check leaves the previous version live.
