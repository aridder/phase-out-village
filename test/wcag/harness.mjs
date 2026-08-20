import { chromium } from "playwright";
import fs from "node:fs";
import { createRequire } from "node:module";

export const BASE = process.env.WCAG_BASE || "http://127.0.0.1:5199";
/**
 * axe-core and Playwright are peer tools rather than dependencies: they are
 * only needed to run this suite, and pinning them in package.json would put
 * a ~300 MB browser download in every contributor's `npm ci`.
 *
 *   npm i --no-save playwright axe-core
 *
 * CHROME_PATH points at an existing Chromium if one is already installed.
 */
export const AXE = fs.readFileSync(
  createRequire(import.meta.url).resolve("axe-core/axe.min.js"),
  "utf8",
);
export const CHROME = process.env.CHROME_PATH || undefined;

/** Every route the app serves. */
export const ROUTES = [
  "/",
  "/norge",
  "/kostnad",
  "/tutorial",
  "/map",
  "/map/troll",
  "/periode",
  "/phaseout",
  "/transition",
  "/advisor",
  "/plan",
  "/emissions",
  "/production",
  "/data",
  "/data/oil",
  "/data/troll",
  "/report",
  "/summary",
];

/** A part-played game, so /report and /summary have real content. */
export const MID_GAME = {
  phaseOutSchedule: {
    Brage: "2026",
    Ula: "2026",
    Statfjord: "2028",
    Draugen: "2030",
    Snøhvit: "2030",
  },
  year: "2033",
  lastDecision: { round: 2, fields: ["Draugen", "Snøhvit"] },
};

/** A finished game, so /summary renders the reckoning instead of redirecting. */
export const END_GAME = {
  phaseOutSchedule: {
    Brage: "2026",
    Ula: "2026",
    Statfjord: "2028",
    Draugen: "2030",
    Snøhvit: "2030",
    Oseberg: "2034",
    Gullfaks: "2034",
    Heidrun: "2036",
    Norne: "2038",
  },
  year: "2040",
  lastDecision: { round: 4, fields: ["Norne"] },
};

export async function launch(opts = {}) {
  return chromium.launch(
    CHROME ? { executablePath: CHROME, ...opts } : { ...opts },
  );
}

/**
 * Opens a page with the game state seeded, so every route renders its real
 * content instead of an empty-plan placeholder.
 */
export async function seededPage(
  browser,
  { viewport, dark, state, ...rest } = {},
) {
  const page = await browser.newPage({
    viewport: viewport ?? { width: 1280, height: 900 },
    colorScheme: dark ? "dark" : "light",
    ...rest,
  });
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((state) => {
    for (const [k, v] of Object.entries(state))
      sessionStorage.setItem(k, JSON.stringify(v));
  }, state ?? MID_GAME);
  return page;
}

/** Navigates to a hash route and waits for it to settle. */
export async function visit(page, route, settle = 1800) {
  await page.evaluate((h) => {
    window.location.hash = "#" + h;
  }, route);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(settle);
}

/** Runs axe with an explicit rule set and returns the violations. */
export async function runAxe(page, tags) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (t) => {
    const res = await window.axe.run(document, {
      runOnly: { type: "tag", values: t },
      resultTypes: ["violations"],
    });
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      tags: v.tags.filter((x) => x.startsWith("wcag")),
      nodes: v.nodes.slice(0, 4).map((n) => ({
        target: n.target.join(" "),
        summary: (n.failureSummary || "").split("\n").filter(Boolean).join(" "),
      })),
      count: v.nodes.length,
    }));
  }, tags);
}

export function heading(text) {
  console.log("\n" + "═".repeat(72) + "\n" + text + "\n" + "═".repeat(72));
}
