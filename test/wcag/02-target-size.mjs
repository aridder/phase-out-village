/**
 * Test 2 — WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA.
 *
 * Every pointer target must be at least 24×24 CSS px, unless it is inline
 * in a sentence, is the equivalent of another target that passes, or has
 * enough spacing around it that a 24 px circle centred on it touches no
 * other target. axe does not check this rule at all, so it is measured
 * here: bounding box first, then the spacing exception for anything
 * undersized.
 */
import { launch, seededPage, visit, ROUTES, heading } from "./harness.mjs";

const MIN = 24;

const browser = await launch();
const failures = [];

for (const viewport of [
  { width: 1280, height: 900, name: "desktop" },
  { width: 390, height: 844, name: "mobil" },
]) {
  heading(`SC 2.5.8 Target Size (24×24 px) · ${viewport.name}`);
  const page = await seededPage(browser, { viewport });

  for (const route of ROUTES) {
    await visit(page, route, 2000);
    const bad = await page.evaluate((min) => {
      const selector =
        'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
      const targets = [...document.querySelectorAll(selector)].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return (
          r.width > 0 &&
          r.height > 0 &&
          cs.visibility !== "hidden" &&
          cs.display !== "none" &&
          !el.closest("[hidden]")
        );
      });

      const boxes = targets.map((el) => ({
        el,
        r: el.getBoundingClientRect(),
      }));

      const out = [];
      for (const { el, r } of boxes) {
        if (r.width >= min && r.height >= min) continue;

        // Exception: inline in a block of text
        const parentText = el.parentElement?.textContent?.trim() || "";
        const inline =
          getComputedStyle(el).display === "inline" &&
          parentText.length > (el.textContent || "").trim().length + 12;
        if (inline) continue;

        // Exception: spacing — a 24px circle on this target's centre must
        // not overlap the circle of any other target
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let crowded = false;
        for (const other of boxes) {
          if (other.el === el) continue;
          if (el.contains(other.el) || other.el.contains(el)) continue;
          const ox = other.r.left + other.r.width / 2;
          const oy = other.r.top + other.r.height / 2;
          if (Math.hypot(cx - ox, cy - oy) < min) {
            crowded = true;
            break;
          }
        }
        if (!crowded) continue;

        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 40),
          text: (el.textContent || "").trim().slice(0, 30),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
      return out;
    }, MIN);

    if (bad.length === 0) {
      console.log(`  ${route.padEnd(14)} rent`);
    } else {
      console.log(`  ${route.padEnd(14)} ${bad.length} for små mål`);
      for (const b of bad.slice(0, 6)) {
        console.log(
          `      ${b.w}×${b.h}  <${b.tag} class="${b.cls}">  "${b.text}"`,
        );
        failures.push({ route, viewport: viewport.name, ...b });
      }
    }
  }
  await page.close();
}

heading("Oppsummering 2.5.8");
console.log(
  failures.length === 0 ? "Ingen brudd." : `${failures.length} brudd`,
);
await browser.close();
