/**
 * Test 6 — SC 1.4.11 Non-text Contrast (AA, 3:1).
 *
 * axe checks text contrast thoroughly and non-text contrast barely at all.
 * Colours are read from the running page rather than from the stylesheet,
 * so what is measured is what is painted, including the dark theme's
 * overrides and any colour-mix() the browser resolved.
 *
 * 1.4.11 does not say "every shape must reach 3:1". It says the visual
 * information REQUIRED TO IDENTIFY a component or understand a graphic
 * must. So the samples below are split in two:
 *
 *  - `required`: the named property is the only thing that identifies the
 *    thing. It is set per PROPERTY, not per element: an empty text field
 *    is identified by its border, not by the white inside it, and a circle
 *    in a beeswarm plot by its outline, not by the shade encoding its
 *    intensity. These must reach 3:1 and decide whether this test passes.
 *  - everything else: the element carries a text label or a number beside
 *    it, so the label is what identifies it. Reported with its measurement
 *    so a reviewer can disagree, but not counted as a failure.
 *
 * Known blind spot: only `background-color` is read. The benchmark bar on
 * the period report is separated from its track by a diagonal
 * `background-image` hatch, which shows here as 1.00:1 and is not a real
 * reading. Anything in the second list may be measuring less than the eye
 * sees.
 */
import { launch, seededPage, visit, heading } from "./harness.mjs";

/** Relative luminance per WCAG 2.x. */
function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function parse(css) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return { rgb: parts.slice(0, 3), alpha: parts[3] ?? 1 };
}

/** Flattens a translucent colour onto its background. */
function over(fg, alpha, bg) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}

const browser = await launch();
const results = [];

for (const dark of [false, true]) {
  heading(`SC 1.4.11 Non-text Contrast · ${dark ? "mørkt" : "lyst"} tema`);
  const page = await seededPage(browser, { dark });

  // Collect painted colours for the meaningful non-text parts
  for (const route of [
    "/norge",
    "/map",
    "/periode",
    "/phaseout",
    "/report",
    "/summary",
  ]) {
    await visit(page, route, 2200);
    const samples = await page.evaluate(() => {
      const pick = (sel, what, required) =>
        [...document.querySelectorAll(sel)].slice(0, 3).map((el) => {
          const cs = getComputedStyle(el);
          // Walk up for an opaque background to compare against.
          // Start at the PARENT: starting at the element itself found its
          // own fill and compared it to itself, which is 1.00:1 every time.
          let bg = "rgb(255, 255, 255)";
          let p = el.parentElement;
          while (p) {
            const c = getComputedStyle(p).backgroundColor;
            if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) {
              bg = c;
              break;
            }
            p = p.parentElement;
          }
          return {
            what,
            sel,
            required,
            fill: cs.backgroundColor,
            border: cs.borderTopColor,
            borderWidth: parseFloat(cs.borderTopWidth) || 0,
            bg,
          };
        });

      return [
        // An empty field IS its border. The white inside carries nothing.
        ...pick("select", "nedtrekksliste", "kant"),
        ...pick("input[type=text], input[type=search]", "tekstfelt", "kant"),
        // The outline gives the circle its shape; the shade is the value,
        // which the axis position and the table under the chart also carry.
        ...pick(
          ".intensity-strip .strip-dot",
          "sirkel i intensitetsstripa",
          "kant",
        ),

        // These all sit next to their own label or number
        ...pick(".brief-progress .dot", "fremdriftsprikk", null),
        ...pick(".measure-bar .fill", "søylefyll (perioderapport)", null),
        ...pick(".measure-bar .track", "søylespor", null),
        ...pick(".compare-fill, .compare-track", "sammenligningssøyle", null),
        ...pick("input[type=checkbox]", "avkryssingsboks", null),
        ...pick("button:not(.primary)", "sekundærknapp", null),
        ...pick("button.primary", "primærknapp", null),
        ...pick(".status-segment .fill", "fremdriftssegment", null),
        ...pick(".decided-fields li", "feltchip", null),
      ];
    });

    for (const s of samples) {
      const bg = parse(s.bg);
      if (!bg) continue;
      const fill = parse(s.fill);
      const border = parse(s.border);

      const checks = [];
      if (fill && fill.alpha > 0.05) {
        const flat = over(fill.rgb, fill.alpha, bg.rgb);
        checks.push(["fyll", ratio(flat, bg.rgb)]);
      }
      if (border && border.alpha > 0.05 && s.borderWidth > 0) {
        const flat = over(border.rgb, border.alpha, bg.rgb);
        checks.push(["kant", ratio(flat, bg.rgb)]);
      }
      for (const [kind, r] of checks) {
        results.push({
          dark,
          route,
          what: s.what,
          kind,
          ratio: r,
          // "kant"/"fyll" names WHICH property has to carry the identity
          required: s.required === kind,
        });
      }
    }
  }
  await page.close();
}

// Report the worst case per element type per theme
const grouped = new Map();
for (const r of results) {
  const key = `${r.dark ? "mørk" : "lys"}|${r.what}|${r.kind}`;
  const prev = grouped.get(key);
  if (!prev || r.ratio < prev.ratio) grouped.set(key, r);
}

const sorted = [...grouped].sort((a, b) => a[1].ratio - b[1].ratio);
const line = (key, r, mark) => {
  const [theme, what, kind] = key.split("|");
  console.log(
    `  ${mark} ${r.ratio.toFixed(2).padStart(5)}:1  ${theme.padEnd(5)} ${what} (${kind})  ${r.route}`,
  );
};

heading("Der formen er det eneste kjennetegnet — må klare 3:1");
const fails = [];
for (const [key, r] of sorted) {
  if (!r.required) continue;
  const ok = r.ratio >= 3;
  if (!ok) fails.push(r);
  line(key, r, ok ? "ok  " : "FEIL");
}

heading("Til orientering — disse har en etikett eller et tall ved siden av");
console.log("  Ikke talt som brudd. Se filhodet for hvorfor.\n");
for (const [key, r] of sorted) {
  if (r.required) continue;
  line(key, r, r.ratio >= 3 ? "    " : "  · ");
}

heading("Oppsummering 1.4.11");
console.log(fails.length === 0 ? "Ingen brudd." : `${fails.length} under 3:1`);
if (fails.length) process.exitCode = 1;
await browser.close();
