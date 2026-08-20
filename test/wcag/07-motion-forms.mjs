/**
 * Test 7 — the rest.
 *
 *  - SC 2.3.3 / 2.2.2: prefers-reduced-motion must actually stop the
 *    animations, and nothing may move for more than five seconds on its own.
 *  - SC 1.3.4 Orientation: the page must work in landscape on a phone.
 *  - SC 1.3.5 Identify Input Purpose: inputs that collect known data need
 *    an autocomplete token. (This game collects none, so this should be
 *    vacuously clean — worth confirming rather than assuming.)
 *  - SC 3.3.2 Labels or Instructions: every form control needs a label.
 *  - SC 1.4.13 Content on Hover or Focus: title-attribute tooltips cannot
 *    be dismissed or hovered, so anything that carries information ONLY in
 *    a title is a problem.
 *  - SC 1.1.1 Non-text Content: images and canvases need a text
 *    alternative, or to be hidden from the tree.
 */
import { launch, seededPage, visit, ROUTES, heading } from "./harness.mjs";

const browser = await launch();

// --------------------------------------------------------- reduced motion
heading("SC 2.3.3 / 2.2.2 · prefers-reduced-motion");
{
  const page = await seededPage(browser, {
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  });
  let moving = [];
  for (const route of [
    "/",
    "/advisor",
    "/periode",
    "/report",
    "/summary",
    "/map",
  ]) {
    await visit(page, route, 1500);
    const anim = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        const dur =
          parseFloat(cs.animationDuration) *
          (cs.animationIterationCount === "infinite" ? 999 : 1);
        if (cs.animationName !== "none" && dur > 0.05)
          out.push({
            cls: (el.className || "").toString().slice(0, 34),
            name: cs.animationName,
            dur: cs.animationDuration,
            iter: cs.animationIterationCount,
          });
      }
      return out.slice(0, 8);
    });
    if (anim.length === 0) console.log(`  ${route.padEnd(12)} ingen animasjon`);
    else {
      console.log(`  ${route.padEnd(12)} ${anim.length} kjører fortsatt`);
      for (const a of anim) {
        console.log(`      .${a.cls}  ${a.name} ${a.dur} ×${a.iter}`);
        moving.push({ route, ...a });
      }
    }
  }
  console.log(moving.length ? `  → ${moving.length} funn` : "  → rent");
  await page.close();
}

// ------------------------------------------------------------ orientation
heading("SC 1.3.4 Orientation · telefon i landskap (844×390)");
{
  const page = await seededPage(browser, {
    viewport: { width: 844, height: 390 },
  });
  for (const route of [
    "/",
    "/norge",
    "/map",
    "/periode",
    "/phaseout",
    "/summary",
  ]) {
    await visit(page, route, 1800);
    const r = await page.evaluate(() => {
      const doc = document.documentElement;
      const main = document.querySelector("#app main");
      return {
        overflow: Math.round(doc.scrollWidth - doc.clientWidth),
        mainHeight: main ? main.clientHeight : 0,
        readable: (main?.innerText || "").trim().length,
      };
    });
    console.log(
      `  ${route.padEnd(12)} vannrett overflow ${r.overflow}px · ${r.readable} tegn synlig · ${
        r.overflow <= 0 && r.readable > 40 ? "ok" : "SE PÅ"
      }`,
    );
  }
  await page.close();
}

// -------------------------------------------------------- forms & tooltips
heading("SC 3.3.2 / 1.3.5 / 1.4.13 / 1.1.1");
{
  const page = await seededPage(browser, {
    viewport: { width: 1280, height: 900 },
  });
  const unlabelled = [];
  const titleOnly = [];
  const untitledImages = [];

  for (const route of ROUTES) {
    await visit(page, route, 1800);
    const r = await page.evaluate(() => {
      const vis = (el) =>
        el.offsetParent !== null || getComputedStyle(el).position === "fixed";

      const inputs = [
        ...document.querySelectorAll("input, select, textarea"),
      ].filter(vis);
      const noLabel = inputs
        .filter((el) => {
          const byLabel =
            el.labels && el.labels.length && el.labels[0].textContent.trim();
          const byAria =
            el.getAttribute("aria-label") ||
            (el.getAttribute("aria-labelledby") &&
              document.getElementById(el.getAttribute("aria-labelledby"))
                ?.textContent);
          return !byLabel && !byAria;
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}[${el.type || ""}].${(el.className || "").slice(0, 20)}`,
        );

      // Elements whose ONLY accessible information is a title attribute
      const onlyTitle = [...document.querySelectorAll("[title]")]
        .filter(vis)
        .filter(
          (el) =>
            !el.textContent.trim() &&
            !el.getAttribute("aria-label") &&
            !el.getAttribute("alt"),
        )
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 20)} title="${el.getAttribute("title").slice(0, 30)}"`,
        );

      const imgs = [...document.querySelectorAll("img, canvas, svg")]
        .filter(vis)
        .filter((el) => {
          if (el.getAttribute("aria-hidden") === "true") return false;
          if (el.tagName === "IMG") return !el.hasAttribute("alt");
          if (el.tagName === "SVG" || el.tagName === "svg")
            return (
              !el.querySelector("title") &&
              !el.getAttribute("aria-label") &&
              el.getAttribute("role") !== "presentation"
            );
          return !el.getAttribute("aria-label") && !el.textContent.trim();
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${(el.className.baseVal ?? el.className ?? "").toString().slice(0, 24)}`,
        );

      // autocomplete only matters for inputs that collect user data
      const needsAutocomplete = inputs.filter(
        (el) =>
          ["text", "email", "tel", "url"].includes(el.type) &&
          !el.hasAttribute("autocomplete") &&
          el.name,
      ).length;

      return {
        noLabel,
        onlyTitle,
        imgs,
        needsAutocomplete,
        total: inputs.length,
      };
    });

    const flags = [];
    if (r.noLabel.length) flags.push(`${r.noLabel.length} uten etikett`);
    if (r.onlyTitle.length) flags.push(`${r.onlyTitle.length} kun title`);
    if (r.imgs.length) flags.push(`${r.imgs.length} grafikk uten alt`);
    console.log(
      `  ${route.padEnd(14)} ${String(r.total).padStart(2)} skjemafelt · ${flags.length ? flags.join(", ") : "rent"}`,
    );
    for (const x of r.noLabel) {
      console.log(`      uten etikett: ${x}`);
      unlabelled.push({ route, x });
    }
    for (const x of r.onlyTitle.slice(0, 4)) {
      console.log(`      kun title: ${x}`);
      titleOnly.push({ route, x });
    }
    for (const x of r.imgs.slice(0, 4)) {
      console.log(`      uten alt: ${x}`);
      untitledImages.push({ route, x });
    }
  }

  heading("Oppsummering skjema/grafikk");
  console.log(`  Uten etikett: ${unlabelled.length}`);
  console.log(`  Informasjon kun i title: ${titleOnly.length}`);
  console.log(`  Grafikk uten alternativ: ${untitledImages.length}`);
  await page.close();
}

await browser.close();
