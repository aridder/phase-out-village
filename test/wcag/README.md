# WCAG 2.2 AA test suite

Seven scripts that drive a real browser against a running dev server and
check the game against WCAG 2.2 level A and AA.

```sh
npm i --no-save playwright axe-core   # once; downloads a Chromium
npx playwright install chromium

npm run dev -- --port 5199            # in one terminal
npm run test:wcag                     # in another
```

They are not part of `npm test`: they need a running server and a browser,
and the whole suite takes a couple of minutes. Playwright and axe-core are
deliberately not in `package.json` — pinning them would put a ~300 MB
browser download in every contributor's `npm ci` for a suite most people
run rarely.

Two environment variables: `WCAG_BASE` (default `http://127.0.0.1:5199`)
and `CHROME_PATH`, if you already have a Chromium and would rather not have
Playwright fetch its own.

## Why seven scripts and not just axe

axe-core is excellent and finds nothing here. That is not the same as
passing: an automated rule set can only settle roughly a third of the
success criteria, and the ones it cannot settle are the ones that broke on
this codebase. Each script covers what the previous one cannot see.

| Script                     | Covers                                                            | What it caught here                                                                                           |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `01-axe.mjs`               | Everything axe can decide, tagged to WCAG 2.2 A+AA only           | Hot-pink estimate figures at 2.5:1; chart-legend buttons 15 px tall; 31 undersized links on `/data`           |
| `02-target-size.mjs`       | SC 2.5.8, including the spacing and equivalent exceptions         | The zoom controls at 22×22; confirms the exceptions after the fixes                                           |
| `03-reflow-spacing.mjs`    | SC 1.4.4, 1.4.10, 1.4.12                                          | 21 px of horizontal scroll on every game route at 320 px, from a grid column that could not shrink            |
| `04-keyboard.mjs`          | SC 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11, 2.4.13                     | Focused rows in the field selector hidden behind the sticky action bar                                        |
| `05-structure.mjs`         | SC 1.3.1, 2.4.2, 2.4.6, 3.1.1, 4.1.2, 4.1.3                       | One shared page title for all 18 routes; four routes with no `h1`; two skipped heading levels                 |
| `06-non-text-contrast.mjs` | SC 1.4.11, measured on painted colours rather than the stylesheet | Text-field borders at 1.3:1, using the divider hairline instead of a control boundary                         |
| `07-motion-forms.mjs`      | SC 1.1.1, 1.3.4, 1.3.5, 1.4.13, 2.2.2, 2.3.3, 3.3.2               | `prefers-reduced-motion` had no effect at all: the rule sat in a cascade layer, and the page CSS is unlayered |

## Reading the output

Every script prints one line per route and a summary. "rent" means no
finding. Anything else names the element and the measurement.

Two things the scripts deliberately do not flag, both documented in the
code where the decision was made:

- **The intensity strip's circles** (`/norge`) are sized by production, so
  the smallest is 7 px. They are decoration with `aria-hidden`, and the
  `<details>` table under the chart carries the same 32 rows — the
  "equivalent control on the same page" exception in 2.5.8.
- **The map canvas** is `aria-hidden`. The description above it and the
  field list beside it carry the content; the canvas has nothing to add.

## Judgement calls left open

`06-non-text-contrast.mjs` reports the fill of buttons, chips and bar
tracks against the page. Those are below 3:1 and are **not** treated as
failures: each carries a visible text label, so the label rather than the
boundary is "the visual information required to identify the component".
That reading follows the Understanding document for 1.4.11. A reviewer who
disagrees would want darker fills throughout; the numbers are in the output
either way.
