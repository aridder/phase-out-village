/**
 * Test 5 — document structure and the things a screen reader reads first.
 *
 * SC 1.3.1 Info and Relationships, 2.4.2 Page Titled, 2.4.6 Headings and
 * Labels, 3.1.1 Language of Page, 4.1.2 Name Role Value, 4.1.3 Status
 * Messages, plus the landmark structure axe checks only partially.
 *
 * 2.4.2 is the interesting one here: this is a hash-routed single page, so
 * unless something updates document.title on navigation every route
 * announces the same title, and a screen-reader user tabbing between them
 * is told nothing changed.
 */
import {
  launch,
  seededPage,
  visit,
  ROUTES,
  END_GAME,
  heading,
} from "./harness.mjs";

const browser = await launch();
const page = await seededPage(browser, {
  viewport: { width: 1280, height: 900 },
});

heading("Dokumentnivå (3.1.1, 2.4.2)");
const docLevel = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  dir: document.documentElement.dir,
  title: document.title,
}));
console.log(
  `  <html lang="${docLevel.lang}">  ${docLevel.lang ? "ok" : "MANGLER"}`,
);
console.log(`  <title>${docLevel.title}</title>`);

heading("Per rute");
const titles = new Set();
const rows = [];

for (const route of ROUTES) {
  await visit(page, route, 2000);
  const r = await page.evaluate(() => {
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(
        (h) =>
          h.offsetParent !== null || h.className.includes("visually-hidden"),
      )
      .map((h) => ({
        level: +h.tagName[1],
        text: h.textContent.trim().slice(0, 40),
      }));

    // Heading levels must not skip on the way down
    const skips = [];
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1)
        skips.push(
          `h${headings[i - 1].level} → h${headings[i].level} ved "${headings[i].text}"`,
        );
    }

    const landmarks = {
      header: document.querySelectorAll("header, [role=banner]").length,
      nav: document.querySelectorAll("nav, [role=navigation]").length,
      main: document.querySelectorAll("main, [role=main]").length,
      footer: document.querySelectorAll("footer, [role=contentinfo]").length,
    };

    // Controls with no accessible name at all
    const unnamed = [
      ...document.querySelectorAll("button, a[href], input, select"),
    ]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => {
        const name =
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          (el.labels && el.labels[0]?.textContent) ||
          el.textContent ||
          el.getAttribute("alt") ||
          [...el.querySelectorAll("img[alt], svg title")]
            .map((c) => c.getAttribute("alt") ?? c.textContent)
            .join(" ") ||
          "";
        return !name.trim();
      })
      .map(
        (el) =>
          el.tagName.toLowerCase() +
          "." +
          (el.className || "").toString().slice(0, 24),
      );

    const live = [
      ...document.querySelectorAll("[aria-live], [role=status], [role=alert]"),
    ].map(
      (el) =>
        `${el.getAttribute("role") || ""}${el.getAttribute("aria-live") ? "/" + el.getAttribute("aria-live") : ""}`,
    );

    return {
      title: document.title,
      h1: headings.filter((h) => h.level === 1).map((h) => h.text),
      count: headings.length,
      skips,
      landmarks,
      unnamed,
      live,
    };
  });

  titles.add(r.title);
  rows.push({ route, ...r });

  const flags = [];
  if (r.h1.length === 0) flags.push("ingen h1");
  if (r.h1.length > 1) flags.push(`${r.h1.length} h1`);
  if (r.skips.length) flags.push(`hopp: ${r.skips.join("; ")}`);
  if (r.landmarks.main !== 1) flags.push(`main=${r.landmarks.main}`);
  if (r.unnamed.length) flags.push(`uten navn: ${r.unnamed.join(", ")}`);

  console.log(
    `  ${route.padEnd(14)} ${String(r.count).padStart(2)} overskrifter · h1="${r.h1[0] || "-"}" · ${
      flags.length ? flags.join(" · ") : "rent"
    }`,
  );
}

heading("Ferdigspilt (/report og /summary viser da sitt eget innhold)");
{
  const done = await seededPage(browser, { state: END_GAME });
  for (const route of ["/report", "/summary"]) {
    await visit(done, route, 2200);
    const r = await done.evaluate(() => {
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
        (h) => ({
          level: +h.tagName[1],
          text: h.textContent.trim().slice(0, 40),
        }),
      );
      const skips = [];
      for (let i = 1; i < hs.length; i++)
        if (hs[i].level > hs[i - 1].level + 1)
          skips.push(
            `h${hs[i - 1].level} → h${hs[i].level} ved "${hs[i].text}"`,
          );
      return {
        title: document.title,
        h1: hs.filter((h) => h.level === 1).map((h) => h.text),
        n: hs.length,
        skips,
        hash: location.hash,
      };
    });
    titles.add(r.title);
    console.log(
      `  ${route.padEnd(10)} ${r.hash.padEnd(10)} ${r.n} overskrifter · h1="${r.h1[0] || "-"}" · ${r.skips.length ? r.skips.join("; ") : "rent"}`,
    );
    console.log(`             tittel: "${r.title}"`);
  }
  await done.close();
}

heading("SC 2.4.2 Page Titled");
console.log(`  Ulike sidetitler over ${ROUTES.length} ruter: ${titles.size}`);
for (const t of titles) console.log(`    "${t}"`);
if (titles.size === 1)
  console.log(
    "  → Alle rutene deler én tittel. En skjermleserbruker får ingen beskjed\n" +
      "    om hvilken side hun er kommet til. Dette er et brudd på 2.4.2.",
  );

heading("SC 4.1.3 Status Messages");
const withLive = rows.filter((r) => r.live.length);
console.log(`  Ruter med live-region: ${withLive.length}/${ROUTES.length}`);
for (const r of withLive) console.log(`    ${r.route}: ${r.live.join(", ")}`);

await page.close();
await browser.close();
