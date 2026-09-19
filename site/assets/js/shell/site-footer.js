/*
 * <site-footer>
 *
 * The site's footer, defined once: who the association is, the board's email,
 * the same five destinations as the header's nav, and the two Portal links.
 * Rendered into the light DOM so the page's Tailwind utilities apply.
 */

import { element } from "./dom.js";
import { boardEmail, loadContent } from "../lib/content.js";

const FOOTER_LINK = "flex min-h-12 items-center text-steel-300 no-underline hover:text-white hover:underline";

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
      element("div", { class: "font-heading text-2xl font-semibold", text: "Glen Ridge Homeowners Association" }),
      element("div", { class: "mt-1 text-steel-300", text: "Clearcreek Township, Ohio" }),
      emailLink
    ]);

    const nav = element(
      "nav",
      { "aria-label": "Footer", class: "grid content-start gap-1" },
      DESTINATIONS.map((page) => element("a", { href: page.href, class: FOOTER_LINK, text: page.label }))
    );

    const payLink = portalLink("Pay dues in the Portal");
    const requestLink = portalLink("Submit a request in the Portal");
    const portal = element("div", { class: "grid content-start gap-1" }, [payLink, requestLink]);

    const columns = element("div", { class: "mx-auto grid max-w-[1280px] gap-8 px-6 py-10 md:grid-cols-3 md:px-10" }, [
      identity,
      nav,
      portal
    ]);

    const fineprint = element("div", { class: "border-t border-white/15" }, [
      element("div", { class: "mx-auto flex max-w-[1280px] flex-wrap justify-between gap-3 px-6 py-4 text-base text-steel-300 md:px-10" }, [
        element("span", { text: "© 2026 Glen Ridge Homeowners Association" }),
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
        fillPortalLink(payLink, site && site.payUrl);
        fillPortalLink(requestLink, site && site.requestUrl);
      },
      () => {
        // site.json is unreadable: the Portal links stay hidden and the rest of
        // the footer, including the fallback email above, still renders.
      }
    );
  }
}

// A Portal link starts hidden and appears once its address is known. It says in
// words, not only with an icon, that it leaves the site for the Portal.
function portalLink(label) {
  return element("a", { class: FOOTER_LINK, target: "_blank", rel: "noopener", hidden: true }, [
    label,
    element("span", { class: "sr-only", text: " (opens in a new tab)" })
  ]);
}

function fillPortalLink(link, url) {
  if (typeof url !== "string" || !url.trim()) return;
  link.href = url.trim();
  link.hidden = false;
}

if (!customElements.get("site-footer")) customElements.define("site-footer", SiteFooter);
