import { dump } from "./dump-pdf.mjs";
import { detectQuestions } from "../src/utils/questionParser.js";
import { PYTHON_PARSER_CONFIG } from "../src/python/parserConfig.js";
const files = process.argv.slice(2);
for (const f of files) {
  const text = await dump(f);
  const r = detectQuestions(text, PYTHON_PARSER_CONFIG);
  console.log(`\n===== ${f.split("/").pop()}  questions=${r.questions.length} format=${r.format} conf=${r.confidence}`);
  console.log("warnings:", r.warnings);
  if (process.env.SHOW) r.items.forEach((it, i) => console.log(`\n--- #${i + 1} (n=${it.number})\n${it.text}`));
}
