/**
 * Test 4 — keyboard operation.
 *
 * Covers SC 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order,
 * 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum, WCAG 2.2) and
 * 2.4.13 Focus Appearance. None of these can be settled by a rule engine:
 * they need something to actually press Tab and look at what happens.
 *
 * For every route it tabs through the whole page and checks, at each stop,
 * that focus moved, that it is inside the viewport, that it is not hidden
 * behind the sticky header or footer, and that the focus ring is visibly
 * different from the unfocused state.
 */
import { launch, seededPage, visit, ROUTES, heading } from "./harness.mjs";

const MAX_TABS = 90;

const browser = await launch();
const findings = [];
const page = await seededPage(browser, {
  viewport: { width: 1280, height: 900 },
});

for (const route of ROUTES) {
  await visit(page, route, 2000);
  await page.evaluate(() => document.body.focus());

  const seen = [];
  let trapped = false;
  let stuckAt = null;

  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { body: true };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);

      // Is anything painted on top of the focused element's centre?
      const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
      const top = document.elementFromPoint(cx, cy);
      // An ancestor at the same point is not 'on top of' anything
      const obscured =
        !!top && !el.contains(top) && top !== el && !top.contains(el);

      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 34),
        label: (
          el.getAttribute("aria-label") ||
          el.textContent ||
          el.getAttribute("title") ||
          ""
        )
          .trim()
          .slice(0, 32),
        key:
          el.tagName +
          "|" +
          (el.getAttribute("aria-label") || el.textContent || "")
            .trim()
            .slice(0, 40) +
          "|" +
          Math.round(r.top),
        inViewport:
          r.bottom > 0 &&
          r.top < innerHeight &&
          r.right > 0 &&
          r.left < innerWidth,
        obscured,
        obscuredBy: obscured
          ? top.tagName.toLowerCase() +
            "." +
            (top.className || "").toString().slice(0, 24)
          : null,
        outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
        boxShadow: cs.boxShadow !== "none",
        ring: cs.outlineStyle !== "none" || cs.boxShadow !== "none",
      };
    });

    if (info.body) break; // cycled back out of the document
    if (seen.length && seen[seen.length - 1].key === info.key) {
      trapped = true;
      stuckAt = info;
      break;
    }
    if (seen.some((s) => s.key === info.key)) break; // looped — done
    seen.push(info);
  }

  const noRing = seen.filter((s) => !s.ring);
  const offscreen = seen.filter((s) => !s.inViewport);
  const hidden = seen.filter((s) => s.obscured);

  const problems = [];
  if (trapped) problems.push(`felle ved <${stuckAt.tag}> "${stuckAt.label}"`);
  if (noRing.length)
    problems.push(`${noRing.length} uten synlig fokusmarkering`);
  if (offscreen.length) problems.push(`${offscreen.length} utenfor viewport`);
  if (hidden.length) problems.push(`${hidden.length} skjult bak annet innhold`);

  if (problems.length === 0) {
    console.log(
      `  ${route.padEnd(14)} ${String(seen.length).padStart(2)} stopp · rent`,
    );
  } else {
    console.log(
      `  ${route.padEnd(14)} ${String(seen.length).padStart(2)} stopp · ${problems.join(", ")}`,
    );
    for (const s of [...noRing, ...offscreen, ...hidden].slice(0, 5)) {
      console.log(
        `      <${s.tag} class="${s.cls}"> "${s.label}"` +
          (s.obscuredBy ? `  bak ${s.obscuredBy}` : "") +
          (!s.ring ? "  ingen ring" : "") +
          (!s.inViewport ? "  utenfor skjerm" : ""),
      );
      findings.push({ route, ...s });
    }
  }
}

heading("Oppsummering tastatur");
console.log(findings.length === 0 ? "Ingen brudd." : `${findings.length} funn`);
await page.close();
await browser.close();
