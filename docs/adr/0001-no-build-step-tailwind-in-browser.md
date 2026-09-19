# No build step; Tailwind is compiled in the browser

The site is maintained by volunteers and its Content is edited by board members in GitHub's web editor, so the published files are the source files: no bundler, no compiler, no generated output. Tailwind therefore runs from its browser build (`@tailwindcss/browser`, exact version pinned, loaded from a public CDN) with the theme defined once in `site/assets/js/theme.js`.

Tailwind's documentation recommends the browser build for development only. We set that aside deliberately: for five low-traffic pages, the cost (roughly 280 KB of script and styles generated on load) is smaller than the cost of a toolchain that someone has to install, understand and keep working for years.

## Considered options

- **Tailwind CLI run by a GitHub Action**: smallest payload, but the CSS a maintainer sees locally is no longer what ships, and a broken toolchain blocks every change.
- **Hand-written CSS**: no dependency at all, but gives up the utility vocabulary the design was built in.

## Consequences

- JavaScript is required to see a styled page. Every page carries a `<noscript>` line with the board's email address.
- Tailwind v4 needs Safari 16.4+, Chrome 111+ or Firefox 128+. Older browsers get an unstyled but readable page.
- Upgrading Tailwind is a one-line version change in each page's `<head>`, done on purpose and checked by eye. Never `@latest`.
- If the site outgrows this (many more pages, measurable load complaints), the way out is the CLI option above; the markup does not change.
