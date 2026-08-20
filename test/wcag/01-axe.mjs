/**
 * Test 1 — axe-core against the full WCAG 2.2 A + AA rule set.
 *
 * The earlier runs used axe's default rule set, which is broader than WCAG
 * in some places and narrower in others. This one names the tags, so a
 * clean run is a statement about WCAG specifically. Every route is checked
 * in both themes and at both a desktop and a phone width, because several
 * rules (contrast, target size, reflow) depend on both.
 */
import {
  launch,
  seededPage,
  visit,
  runAxe,
  ROUTES,
  END_GAME,
  heading,
} from "./harness.mjs";

const TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
];

const browser = await launch();
let total = 0;
const byRule = new Map();

for (const dark of [false, true]) {
  for (const viewport of [
    { width: 1280, height: 900, name: "desktop" },
    { width: 390, height: 844, name: "mobil" },
  ]) {
    heading(
      `axe · WCAG 2.2 A+AA · ${dark ? "mørkt" : "lyst"} tema · ${viewport.name} ${viewport.width}px`,
    );
    const page = await seededPage(browser, { dark, viewport });
    for (const route of ROUTES) {
      await visit(page, route, 2400);
      const violations = await runAxe(page, TAGS);
      total += violations.reduce((s, v) => s + v.count, 0);
      if (violations.length === 0) {
        console.log(`  ${route.padEnd(14)} rent`);
      } else {
        console.log(`  ${route.padEnd(14)} ${violations.length} regelbrudd`);
        for (const v of violations) {
          byRule.set(v.id, (byRule.get(v.id) || 0) + v.count);
          console.log(
            `      [${v.impact}] ${v.id} ×${v.count}  (${v.tags.join(", ")})`,
          );
          for (const n of v.nodes) console.log(`        ${n.target}`);
          console.log(`        → ${v.nodes[0]?.summary.slice(0, 160)}`);
        }
      }
    }
    await page.close();

    // /summary and /report redirect away unless the game is finished, so the
    // two pages the whole story builds to were never actually measured
    const finished = await seededPage(browser, {
      dark,
      viewport,
      state: END_GAME,
    });
    for (const route of ["/report", "/summary"]) {
      await visit(finished, route, 2400);
      const violations = await runAxe(finished, TAGS);
      total += violations.reduce((s, v) => s + v.count, 0);
      const where = await finished.evaluate(() => location.hash);
      if (violations.length === 0) {
        console.log(`  ${route.padEnd(14)} rent  (ferdigspilt, ${where})`);
      } else {
        console.log(
          `  ${route.padEnd(14)} ${violations.length} regelbrudd (ferdigspilt)`,
        );
        for (const v of violations) {
          byRule.set(v.id, (byRule.get(v.id) || 0) + v.count);
          console.log(
            `      [${v.impact}] ${v.id} ×${v.count}  (${v.tags.join(", ")})`,
          );
          for (const n of v.nodes) console.log(`        ${n.target}`);
          console.log(`        → ${v.nodes[0]?.summary.slice(0, 160)}`);
        }
      }
    }
    await finished.close();
  }
}

heading("Oppsummering");
console.log(`Ruter testet: ${ROUTES.length} × 2 temaer × 2 bredder`);
console.log(`Regelbrudd i alt: ${total}`);
for (const [id, n] of byRule) console.log(`  ${id}: ${n}`);
await browser.close();
