/**
 * Test 6 — SC 1.4.11 Non-text Contrast (AA, 3:1).
 *
 * axe checks text contrast thoroughly and non-text contrast barely at all.
 * The parts of this app that carry meaning without text are exactly the
 * parts that matter most here: the map bubbles, the bar fills, the period
 * accent colours, the form borders and the focus rings.
 *
 * Colours are read from the running page rather than from the stylesheet,
 * so what is measured is what is painted, including the dark theme's
 * overrides and any colour-mix() the browser resolved.
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
      const pick = (sel, what) =>
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
            fill: cs.backgroundColor,
            border: cs.borderTopColor,
            borderWidth: parseFloat(cs.borderTopWidth) || 0,
            bg,
          };
        });

      return [
        ...pick(".measure-bar .fill", "søylefyll (perioderapport)"),
        ...pick(".measure-bar .track", "søylespor"),
        ...pick(".compare-fill, .compare-track", "sammenligningssøyle"),
        ...pick("input[type=checkbox]", "avkryssingsboks"),
        ...pick("select", "nedtrekksliste"),
        ...pick("input[type=text], input[type=search]", "tekstfelt"),
        ...pick("button:not(.primary)", "sekundærknapp"),
        ...pick("button.primary", "primærknapp"),
        ...pick(".status-segment .fill", "fremdriftssegment"),
        ...pick(".brief-progress .dot", "fremdriftsprikk"),
        ...pick(".decided-fields li", "feltchip"),
        ...pick(".intensity-strip *[style*='background']", "intensitetsstripe"),
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
        results.push({ dark, route, what: s.what, kind, ratio: r });
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

heading("Verste tilfelle per element (krav 3:1)");
const fails = [];
for (const [key, r] of [...grouped].sort((a, b) => a[1].ratio - b[1].ratio)) {
  const [theme, what, kind] = key.split("|");
  const ok = r.ratio >= 3;
  if (!ok) fails.push(r);
  console.log(
    `  ${ok ? "ok  " : "FEIL"} ${r.ratio.toFixed(2).padStart(5)}:1  ${theme.padEnd(5)} ${what} (${kind})  ${r.route}`,
  );
}

heading("Oppsummering 1.4.11");
console.log(fails.length === 0 ? "Ingen brudd." : `${fails.length} under 3:1`);
await browser.close();
