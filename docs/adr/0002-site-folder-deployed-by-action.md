# The site lives in `site/` and is deployed by an Action that compiles nothing

GitHub Pages' "deploy from a branch" can only publish the repository root or a folder named `/docs`. Publishing the root would put the repo's own documentation on the public website, and `/docs` is where that documentation lives. So the website is the `site/` folder, uploaded as-is by the standard GitHub Pages Action.

This does not contradict ADR-0001: the workflow copies files, it does not transform them. What is in `site/` is byte-for-byte what visitors receive, and `python3 -m http.server` inside `site/` is a faithful local preview.

The workflow exists for a second reason: it is the only place checks can run before publication. Board members commit Content straight to `main`; the workflow validates the JSON (syntax, required keys), checks internal links and lints the JavaScript, and publishes only if all pass. A stray comma leaves the previous version of the site live instead of taking a page down.

## Consequences

- Pages is configured with **Source: GitHub Actions**, not a branch.
- `site/CNAME` carries the custom domain and must stay inside `site/`.
- A failed check is silent to visitors; the committer gets GitHub's failure email. `CONTENT-GUIDE.md` tells editors what that email means.
