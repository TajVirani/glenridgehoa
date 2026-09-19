/*
 * <site-header current="home|news|map|documents|meetings">
 *
 * The site's header, defined once: skip link, brand, the five primary links
 * with the current page marked, and the two Portal buttons. Below `lg` the
 * nav becomes a Disclosure menu. Rendered into the light DOM so the page's
 * Tailwind utilities apply.
 */

import { element, icon } from "./dom.js";
import { loadContent } from "../lib/content.js";
import { enableJumpLinks, setDisclosure, toggleDisclosure } from "../lib/motion.js";

const PAGES = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "news", label: "News", href: "news.html" },
  { key: "map", label: "Community Map", href: "map.html" },
  { key: "documents", label: "Documents", href: "documents.html" },
  { key: "meetings", label: "Meetings", href: "meetings.html" }
];

const MENU_ICON = ["M4 6h16", "M4 12h16", "M4 18h16"];

const DESKTOP_LINK =
  "inline-flex min-h-12 items-center text-white no-underline underline-offset-[10px] " +
  "hover:text-steel-300 hover:underline " +
  "aria-[current=page]:underline aria-[current=page]:decoration-steel-400 aria-[current=page]:decoration-2";

const MENU_LINK =
  "flex min-h-12 items-center border-b border-white/10 py-3 text-white no-underline hover:text-steel-300 hover:underline";

const SOLID_BUTTON =
  "inline-flex min-h-12 items-center bg-white px-5 font-heading text-lg font-semibold text-steel-900 no-underline hover:bg-steel-200";

const OUTLINE_BUTTON =
  "inline-flex min-h-12 items-center border-2 border-white px-5 font-heading text-lg font-semibold text-white no-underline hover:bg-white/10";

class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this.dataset.shellReady === "true") return;
    this.dataset.shellReady = "true";
    this.classList.add("block");

    const current = this.getAttribute("current") || "";

    // The skip link is the first focusable element on every page, and its Jump
    // is animated like any other in-page navigation.
    const skipLink = element("a", {
      href: "#main",
      class:
        "sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:inline-flex " +
        "focus:min-h-12 focus:items-center focus:bg-white focus:px-4 focus:font-heading focus:text-lg " +
        "focus:font-semibold focus:text-steel-900",
      text: "Skip to content"
    });

    const brand = element(
      "a",
      {
        href: "index.html",
        class: "mr-auto flex items-center gap-3.5 text-white no-underline",
        "aria-label": "Glenridge Homeowners Association home"
      },
      [
        element("span", {
          class: "grid h-11 w-11 place-items-center bg-steel-500 font-heading text-xl font-semibold tracking-wide text-steel-900",
          text: "GR",
          "aria-hidden": "true"
        }),
        element("span", { class: "flex flex-col leading-none" }, [
          element("span", { class: "font-heading text-2xl font-semibold", text: "GLENRIDGE" }),
          element("span", {
            class: "mt-1 font-body text-[0.6875rem] font-medium tracking-[0.14em] text-steel-300",
            text: "HOMEOWNERS ASSOCIATION"
          })
        ])
      ]
    );

    const desktopNav = element(
      "nav",
      { "aria-label": "Primary", class: "hidden items-center gap-7 lg:flex" },
      PAGES.map((page) =>
        element("a", {
          href: page.href,
          class: DESKTOP_LINK,
          "aria-current": page.key === current ? "page" : null,
          text: page.label
        })
      )
    );

    const desktopRequest = portalButton("Submit a Request", OUTLINE_BUTTON);
    const desktopPay = portalButton("Pay Dues", SOLID_BUTTON);
    const desktopPortal = element("div", { class: "ml-3 hidden gap-2.5 lg:flex" }, [desktopRequest, desktopPay]);

    const menuButton = element(
      "button",
      {
        type: "button",
        class:
          "inline-flex min-h-12 cursor-pointer items-center gap-2 border-2 border-white bg-transparent px-4 " +
          "font-heading text-lg font-semibold text-white hover:bg-white/10 lg:hidden",
        "aria-expanded": "false",
        "aria-controls": "site-menu"
      },
      [icon(MENU_ICON, 22), "Menu"]
    );

    const menuRequest = portalButton("Submit a Request", OUTLINE_BUTTON);
    const menuPay = portalButton("Pay Dues", SOLID_BUTTON);

    const menu = element(
      "nav",
      {
        id: "site-menu",
        "aria-label": "Menu",
        hidden: true,
        class: "flex flex-col border-t border-white/20 px-6 py-4 text-xl lg:hidden"
      },
      PAGES.map((page) =>
        element("a", {
          href: page.href,
          class: MENU_LINK,
          "aria-current": page.key === current ? "page" : null,
          text: page.label
        })
      ).concat([element("div", { class: "flex flex-wrap gap-2.5 pt-4" }, [menuRequest, menuPay])])
    );

    menuButton.addEventListener("click", () => {
      toggleDisclosure(menuButton, menu);
    });
    // Leaving the phone layout hides the menu panel; reset the control with it.
    window.matchMedia("(min-width: 64rem)").addEventListener("change", (event) => {
      if (event.matches && menuButton.getAttribute("aria-expanded") === "true") {
        setDisclosure(menuButton, menu, false);
      }
    });

    const bar = element("div", { class: "mx-auto flex max-w-[1280px] items-center gap-6 px-6 py-4 md:px-10" }, [
      brand,
      desktopNav,
      desktopPortal,
      menuButton
    ]);

    const header = element("header", { class: "bg-steel-900 font-body text-lg text-white" }, [bar, menu]);

    this.append(skipLink, header);
    enableJumpLinks(document);

    loadContent("site").then(
      (site) => {
        fillPortalButton(desktopPay, site && site.payUrl);
        fillPortalButton(menuPay, site && site.payUrl);
        fillPortalButton(desktopRequest, site && site.requestUrl);
        fillPortalButton(menuRequest, site && site.requestUrl);
      },
      () => {
        // site.json is unreadable: the Portal buttons stay hidden rather than
        // offering a link that goes nowhere. The rest of the page is unaffected.
      }
    );
  }
}

// A Portal button starts hidden and appears once its address is known. It says
// in words, not only with an icon, that it leaves the site for the Portal.
function portalButton(label, classes) {
  return element("a", { class: classes, target: "_blank", rel: "noopener", hidden: true }, [
    label,
    element("span", { class: "sr-only", text: " (Portal, opens in a new tab)" })
  ]);
}

function fillPortalButton(button, url) {
  if (typeof url !== "string" || !url.trim()) return;
  button.href = url.trim();
  button.hidden = false;
}

if (!customElements.get("site-header")) customElements.define("site-header", SiteHeader);
