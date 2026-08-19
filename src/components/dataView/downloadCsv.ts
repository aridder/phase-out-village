/**
 * CSV export for the data pages.
 *
 * This replaced SheetJS (`xlsx`). Two reasons, in order of weight:
 *
 *  1. `xlsx@0.18.5` carries two high-severity advisories with no fix on npm,
 *     and it is the last released version there. Both are in the PARSER —
 *     prototype pollution and a ReDoS when reading a hostile workbook — and
 *     this app never parses anything, so the real exposure was nil. But an
 *     unfixable high finding in `npm audit` is a standing cost for everyone
 *     who forks the repo, and it was buying us one feature on one page.
 *  2. It put ~430 kB into the main bundle for that one feature.
 *
 * The format is the Norwegian Excel convention rather than RFC 4180: a
 * semicolon separator and a decimal comma, because a comma-separated file
 * with decimal points lands in a single column when a Norwegian Excel opens
 * it by double-click, and that is how most of the people who want these
 * numbers will open it. Everything else (Google Sheets, LibreOffice, pandas,
 * R) reads it given the separator, and the header says which it is.
 */

/** One row is one record; the keys become the header line. */
export type CsvRow = Record<string, string | number | undefined>;

const SEPARATOR = ";";

/**
 * Excel decides a file is UTF-8 from the byte order mark and nothing else.
 * Without it, Ekofisk and Gjøa come out mojibake on Windows.
 */
const BOM = "﻿";

/**
 * Serialises rows to CSV text.
 *
 * The header is the union of every row's keys in first-seen order, so a row
 * that is missing a field leaves an empty cell rather than shifting the rest
 * of the line one column left.
 */
export function toCsv(rows: CsvRow[]): string {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  const lines = [columns.map(cell).join(SEPARATOR)];
  for (const row of rows) {
    lines.push(columns.map((column) => cell(row[column])).join(SEPARATOR));
  }
  // Trailing newline: without it some tools treat the last line as truncated
  return lines.join("\r\n") + "\r\n";
}

/** One cell: numbers get a decimal comma, text gets quoted when it has to. */
function cell(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    // No thousand separators — Excel needs a bare number to treat the cell as
    // numeric, and toLocaleString would add non-breaking spaces
    return String(value).replace(".", ",");
  }

  const text = String(value);
  if (!/[";\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Serialises the rows and hands the file to the browser.
 *
 * The object URL is revoked on the next tick rather than immediately —
 * revoking it in the same statement as the click raced the download in
 * Safari and produced an empty file.
 */
export function downloadCsv(filename: string, rows: CsvRow[]): void {
  const blob = new Blob([BOM + toCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
