// Dev helper: dumps PDF text exactly like src/utils/pdfExtractor.js builds it (no OCR).
import fs from "node:fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { layoutPages, markBoldItems } from "../src/utils/pdfLayout.js";

export async function dump(path) {
  const data = new Uint8Array(fs.readFileSync(path));
  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const items = (await page.getTextContent()).items;
    await page.getOperatorList();
    pages.push(markBoldItems(items, (n) => (page.commonObjs.has(n) ? page.commonObjs.get(n) : null)));
  }
  return layoutPages(pages).map((l) => l.join("\n")).join("\n---PAGE_BREAK---\n");
}
import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && process.argv[2]) {
  console.log(await dump(process.argv[2]));
}
