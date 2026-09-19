# Documents are links; the repo never stores them

The association's governing documents, Section rules, agendas and minutes already live in the management company's Portal or in the board's Google Drive, and those copies are the ones that get updated. The site therefore lists Documents as titled links to where they already are. No PDFs are committed, and there is no upload folder.

Storing copies would make the website a second source of truth that silently goes stale, and would ask non-technical editors to upload binaries through GitHub.

Meeting minutes were considered as an exception (September 2026) and rejected: they carry financial detail and homeowner concerns meant for homeowners, not the open web, so they go in the Portal like everything else and are linked with `"portal": true`.

## Consequences

- A Document entry is a `url`, never a file path. Entries that sit behind the Portal login carry `"portal": true` so the page can say so before the homeowner clicks.
- Document links open in a new tab; the site cannot vouch for what is on the other side.
- A link can break without any change to this repo. The link check in the deploy workflow covers internal links only; external Document links are the board's to keep current.
- Google Drive links must be shared as "Anyone with the link can view". This is in `CONTENT-GUIDE.md` because it is the most likely way for a Document to appear broken.
