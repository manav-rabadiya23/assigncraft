import fs from "node:fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
const f = process.argv[2]; const pn = Number(process.argv[3]||1);
const pdf = await pdfjsLib.getDocument({data:new Uint8Array(fs.readFileSync(f)),useSystemFonts:true}).promise;
const page = await pdf.getPage(pn);
const tc = await page.getTextContent();
for (const it of tc.items) if (it.str.trim()) console.log(it.transform[4].toFixed(0).padStart(4), it.transform[5].toFixed(0).padStart(4), JSON.stringify(it.str));
