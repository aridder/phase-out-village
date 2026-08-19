import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Downloads a URL to a file.
 *
 * This replaced `download-cli`, which pulled in `decompress` (a critical
 * advisory, arbitrary file write via a crafted archive), `meow` and
 * `trim-newlines` — three findings in `npm audit` for a dependency whose
 * entire job here was "GET a URL, write the body to a file". Node has had
 * `fetch` built in since 18, so the dependency bought us nothing.
 *
 * Unlike a shell redirect it creates the target directory and fails loudly:
 * `download -f - <url> > tmp/data.json` wrote an HTML error page into
 * tmp/data.json on a bad response and the failure only surfaced later, as a
 * confusing parse error in the generator that read it.
 *
 * Usage: npx tsx build/download.ts <url> <target>
 */
async function main() {
  const [url, target] = process.argv.slice(2);
  if (!url || !target) {
    console.error("Bruk: tsx build/download.ts <url> <målfil>");
    process.exit(2);
  }

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    console.error(`${url}\n  → HTTP ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const body = await response.text();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body);
  console.error(`${target}: ${body.length} tegn fra ${url}`);
}

await main();
