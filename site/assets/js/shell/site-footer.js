/*
 * <site-footer>
 *
 * The site's footer, defined once: who the association is, the board's email,
 * the same destinations as the header's nav, the two Portal links, and the
 * neighborhood's social pages.
 * Rendered into the light DOM so the page's Tailwind utilities apply.
 */

import { element } from "./dom.js";
import { boardEmail, loadContent } from "../lib/content.js";

const FOOTER_LINK = "flex min-h-12 items-center text-steel-300 no-underline hover:text-white hover:underline";

const COLUMN_HEADING = "m-0 mb-1 font-body text-sm font-medium uppercase tracking-[0.12em] text-white";

// The social pages, in the order they are listed. Each address comes from site.json.
const SOCIAL = [
  { key: "facebookUrl", label: "Facebook group" },
  { key: "nextdoorUrl", label: "Nextdoor" }
];

const DESTINATIONS = [
  { label: "News", href: "news.html" },
  { label: "Community Map", href: "map.html" },
  { label: "Documents", href: "documents.html" },
  { label: "Meetings", href: "meetings.html" }
];

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.shellReady === "true") return;
    this.dataset.shellReady = "true";
    this.classList.add("block");

    const emailLink = element("a", { class: "mt-3 inline-flex min-h-12 items-center text-steel-300 underline underline-offset-2 hover:text-white" });

    const identity = element("div", {}, [
      element("div", { class: "font-heading text-2xl font-semibold", text: "Glenridge Homeowners Association" }),
      element("div", { class: "mt-1 text-steel-300", text: "Clearcreek Township, Ohio" }),
      emailLink
    ]);

    const nav = element("nav", { "aria-label": "Footer", class: "grid content-start gap-1" }, [
      element("h2", { class: COLUMN_HEADING, text: "Site" }),
      ...DESTINATIONS.map((page) => element("a", { href: page.href, class: FOOTER_LINK, text: page.label }))
    ]);

    const payLink = externalLink("Pay dues in the Portal");
    const requestLink = externalLink("Submit a request in the Portal");
    const portal = element("div", { class: "grid content-start gap-1" }, [
      element("h2", { class: COLUMN_HEADING, text: "Portal" }),
      payLink,
      requestLink
    ]);

    // The Social column stays hidden until site.json gives at least one address.
    const socialLinks = SOCIAL.map((page) => externalLink(page.label));
    const social = element("div", { class: "grid content-start gap-1", hidden: true }, [
      element("h2", { class: COLUMN_HEADING, text: "Social" }),
      ...socialLinks
    ]);

    const columns = element("div", { class: "mx-auto grid max-w-[1280px] gap-8 px-6 py-10 sm:grid-cols-2 md:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]" }, [
      identity,
      nav,
      portal,
      social
    ]);

    const fineprint = element("div", { class: "border-t border-white/15" }, [
      element("div", { class: "mx-auto flex max-w-[1280px] flex-wrap justify-between gap-3 px-6 py-4 text-base text-steel-300 md:px-10" }, [
        element("span", { text: "© 2026 Glenridge Homeowners Association" }),
        element("span", { text: "Map data © OpenStreetMap contributors" })
      ])
    ]);

    this.append(element("footer", { class: "bg-ink font-body text-white" }, [columns, fineprint]));

    boardEmail().then((address) => {
      emailLink.href = "mailto:" + address;
      emailLink.textContent = address;
    });

    loadContent("site").then(
      (site) => {
        fillExternalLink(payLink, site && site.payUrl);
        fillExternalLink(requestLink, site && site.requestUrl);
        SOCIAL.forEach((page, index) => {
          if (fillExternalLink(socialLinks[index], site && site[page.key])) social.hidden = false;
        });
      },
      () => {
        // site.json is unreadable: the Portal and social links stay hidden and the
        // rest of the footer, including the fallback email above, still renders.
      }
    );
  }
}

// A link that leaves the site starts hidden and appears once its address is
// known. It says in words, not only with an icon, that it opens a new tab.
function externalLink(label) {
  return element("a", { class: FOOTER_LINK, target: "_blank", rel: "noopener", hidden: true }, [
    label,
    element("span", { class: "sr-only", text: " (opens in a new tab)" })
  ]);
}

/** Give a hidden external link its address and show it. Returns whether there was one. */
function fillExternalLink(link, url) {
  if (typeof url !== "string" || !url.trim()) return false;
  link.href = url.trim();
  link.hidden = false;
  return true;
}

if (!customElements.get("site-footer")) customElements.define("site-footer", SiteFooter);
