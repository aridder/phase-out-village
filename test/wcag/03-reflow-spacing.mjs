/**
 * Test 3 — SC 1.4.10 Reflow, SC 1.4.4 Resize Text, SC 1.4.12 Text Spacing.
 *
 * Three related failures that only appear when the page is squeezed or the
 * text is enlarged, and that no automated rule set covers:
 *
 *  - 1.4.10: at 320 CSS px there must be no horizontal scrolling of the
 *    page. (Individual wide things — a table, a chart — may scroll inside
 *    their own container; that is allowed and is checked separately.)
 *  - 1.4.4: text must survive 200% zoom without loss of content.
 *  - 1.4.12: with line-height 1.5×, paragraph spacing 2×, letter-spacing
 *    0.12em and word-spacing 0.16em applied, nothing may be clipped.
 */
import { launch, seededPage, visit, ROUTES, heading } from "./harness.mjs";

const SPACING_CSS = `
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p, li, h1, h2, h3, h4 { margin-bottom: 2em !important; }
`;

/** Reports horizontal overflow of the document, and who is causing it. */
const overflowProbe = () => {
  const doc = document.documentElement;
  const scroller = document.querySelector("#app main") || doc;
  const pageOverflow = Math.round(doc.scrollWidth - doc.clientWidth);
  const mainOverflow = Math.round(scroller.scrollWidth - scroller.clientWidth);

  // Who sticks out past the viewport?
  const culprits = [];
  const limit = doc.clientWidth + 1;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > limit || r.left < -1) {
      // Only report the outermost offender in each subtree
      if (culprits.some((c) => c.node.contains(el))) continue;
      culprits.push({
        node: el,
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 40),
        right: Math.round(r.right),
        // An element may stick out of the viewport but be inside an
        // ancestor that scrolls horizontally, which 1.4.10 allows
        scrolls: (() => {
          let p = el;
          while (p && p !== document.body) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === "auto" || ox === "scroll") return true;
            p = p.parentElement;
          }
          return false;
        })(),
      });
    }
  }
  return {
    pageOverflow,
    mainOverflow,
    culprits: culprits.slice(0, 5).map(({ node, ...rest }) => rest),
  };
};

/** Anything whose content is taller/wider than its clipped box. */
const clipProbe = () =>
  [...document.querySelectorAll("body *")]
    .filter((el) => {
      // .visually-hidden clips to 1px by design — that IS the technique for
      // text meant only for screen readers, not a text-spacing failure
      if (el.classList.contains("visually-hidden")) return false;
      const cs = getComputedStyle(el);
      if (cs.overflow !== "hidden" && cs.overflowY !== "hidden") return false;
      if (el.clientHeight === 0) return false;
      return el.scrollHeight - el.clientHeight > 4;
    })
    .slice(0, 6)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 40),
      over: el.scrollHeight - el.clientHeight,
      text: (el.textContent || "").trim().slice(0, 40),
    }));

const browser = await launch();
let problems = 0;

// ---------------------------------------------------------------- 1.4.10
heading("SC 1.4.10 Reflow · 320 px bred");
{
  const page = await seededPage(browser, {
    viewport: { width: 320, height: 640 },
  });
  for (const route of ROUTES) {
    await visit(page, route, 2000);
    const r = await page.evaluate(overflowProbe);
    const real = r.culprits.filter((c) => !c.scrolls);
    if (r.pageOverflow <= 0 && real.length === 0) {
      console.log(`  ${route.padEnd(14)} rent`);
    } else {
      problems++;
      console.log(
        `  ${route.padEnd(14)} side ruller ${r.pageOverflow}px vannrett`,
      );
      for (const c of r.culprits)
        console.log(
          `      <${c.tag} class="${c.cls}"> høyrekant ${c.right}px${c.scrolls ? "  (ruller selv – tillatt)" : ""}`,
        );
    }
  }
  await page.close();
}

// ----------------------------------------------------------------- 1.4.4
heading("SC 1.4.4 Resize Text · 200 % (640 px effektiv bredde)");
{
  // 200% zoom on a 1280px window is equivalent to a 640px viewport at 2x
  const page = await seededPage(browser, {
    viewport: { width: 640, height: 512 },
    deviceScaleFactor: 2,
  });
  for (const route of ROUTES) {
    await visit(page, route, 2000);
    const r = await page.evaluate(overflowProbe);
    const clipped = await page.evaluate(clipProbe);
    const real = r.culprits.filter((c) => !c.scrolls);
    if (r.pageOverflow <= 0 && real.length === 0 && clipped.length === 0) {
      console.log(`  ${route.padEnd(14)} rent`);
    } else {
      problems++;
      console.log(`  ${route.padEnd(14)} overflow ${r.pageOverflow}px`);
      for (const c of real)
        console.log(`      utenfor: <${c.tag} class="${c.cls}">`);
      for (const c of clipped)
        console.log(
          `      klippet ${c.over}px: <${c.tag} class="${c.cls}"> "${c.text}"`,
        );
    }
  }
  await page.close();
}

// ---------------------------------------------------------------- 1.4.12
heading("SC 1.4.12 Text Spacing · linjehøyde 1,5 / tegnavstand 0,12em");
{
  const page = await seededPage(browser, {
    viewport: { width: 1280, height: 900 },
  });
  for (const route of ROUTES) {
    await visit(page, route, 2000);
    await page.addStyleTag({ content: SPACING_CSS });
    await page.waitForTimeout(400);
    const clipped = await page.evaluate(clipProbe);
    const r = await page.evaluate(overflowProbe);
    const real = r.culprits.filter((c) => !c.scrolls);
    if (clipped.length === 0 && real.length === 0) {
      console.log(`  ${route.padEnd(14)} rent`);
    } else {
      problems++;
      console.log(`  ${route.padEnd(14)} ${clipped.length} klippet`);
      for (const c of clipped)
        console.log(
          `      ${c.over}px skjult: <${c.tag} class="${c.cls}"> "${c.text}"`,
        );
      for (const c of real)
        console.log(`      utenfor: <${c.tag} class="${c.cls}">`);
    }
  }
  await page.close();
}

heading("Oppsummering 1.4.4 / 1.4.10 / 1.4.12");
console.log(problems === 0 ? "Ingen brudd." : `${problems} ruter med funn`);
await browser.close();
