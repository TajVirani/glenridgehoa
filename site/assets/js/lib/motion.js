/*
 * Motion: Jumps and Disclosures.
 *
 * This is the only module that scrolls the page or animates height. It asks
 * about reduced motion once, in one place, so no caller can forget: under
 * `prefers-reduced-motion: reduce` every Jump and every Disclosure is instant.
 */

const DURATION = 260; // ms, inside the site's 200-300 ms range
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const wiredRoots = new WeakSet();
const runningDisclosures = new WeakMap();
let runningScroll = 0;

/** True when the visitor has asked for reduced motion; the one check both Jumps and Disclosures use. */
export function prefersReducedMotion() {
  return reduceQuery.matches;
}

/**
 * Jump to an element: move focus there immediately, then animate the scroll so
 * the target clears the header (its `scroll-mt-*`). Instant under reduced motion.
 */
export function jumpTo(target, options) {
  const element = resolve(target);
  if (!element) return;

  if (!options || options.focus !== false) {
    if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
  }

  const clearance = parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0;
  const top = Math.max(0, Math.round(window.scrollY + element.getBoundingClientRect().top - clearance));

  cancelAnimationFrame(runningScroll);
  if (prefersReducedMotion()) {
    window.scrollTo(0, top);
    return;
  }
  animateScroll(top);
}

/**
 * Turn every same-page link inside `root` into an animated Jump. Safe to call
 * more than once: a root is only wired up the first time.
 */
export function enableJumpLinks(root) {
  const host = root || document;
  if (wiredRoots.has(host)) return;
  wiredRoots.add(host);

  host.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const start = event.target;
    if (!start || typeof start.closest !== "function") return;
    const link = start.closest('a[href^="#"]');
    if (!link || link.getAttribute("href") === "#") return;
    const element = resolve(link.getAttribute("href"));
    if (!element) return;
    event.preventDefault();
    jumpTo(element);
  });
}

/** Open or close a Disclosure by animating its height, keeping the control's `aria-expanded` in sync. */
export function setDisclosure(control, panel, open) {
  if (!control || !panel) return;
  control.setAttribute("aria-expanded", open ? "true" : "false");

  const running = runningDisclosures.get(panel);
  if (running) {
    runningDisclosures.delete(panel);
    running.cancel();
  }

  if (prefersReducedMotion()) {
    panel.hidden = !open;
    settle(panel);
    return;
  }

  if (open) {
    panel.hidden = false;
    const height = panel.scrollHeight;
    panel.style.overflow = "hidden";
    animatePanel(panel, "0px", height + "px", () => settle(panel));
  } else {
    const height = panel.scrollHeight;
    panel.style.overflow = "hidden";
    animatePanel(panel, height + "px", "0px", () => {
      panel.hidden = true;
      settle(panel);
    });
  }
}

/** Flip a Disclosure, reading its current state from the control's `aria-expanded`. Returns the new state. */
export function toggleDisclosure(control, panel) {
  const open = control.getAttribute("aria-expanded") !== "true";
  setDisclosure(control, panel, open);
  return open;
}

function animatePanel(panel, from, to, done) {
  const animation = panel.animate(
    [{ height: from, opacity: from === "0px" ? 0 : 1 }, { height: to, opacity: to === "0px" ? 0 : 1 }],
    { duration: DURATION, easing: EASING }
  );
  runningDisclosures.set(panel, animation);
  animation.finished.then(
    () => {
      runningDisclosures.delete(panel);
      done();
    },
    () => {
      // Cancelled because the Disclosure was flipped again; the new call owns the panel.
    }
  );
}

function settle(panel) {
  panel.style.overflow = "";
  panel.style.height = "";
}

function animateScroll(to) {
  const from = window.scrollY;
  const distance = to - from;
  if (distance === 0) return;
  const started = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - started) / DURATION);
    // ease-in-out, matching the Disclosure curve closely enough to feel like one site
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    window.scrollTo(0, Math.round(from + distance * eased));
    if (progress < 1) runningScroll = requestAnimationFrame(step);
  };
  runningScroll = requestAnimationFrame(step);
}

function resolve(target) {
  if (!target) return null;
  if (typeof target !== "string") return target;
  const id = target.charAt(0) === "#" ? target.slice(1) : target;
  return document.getElementById(id);
}
