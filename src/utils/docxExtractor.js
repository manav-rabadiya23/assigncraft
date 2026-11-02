import mammoth from "mammoth";
import { inputHeaderLabel, outputHeaderLabel } from "./sampleHeaders.js";

/**
 * Word files lose two things when read as "raw text":
 *  - automatic list numbering (1., 2., 3. ...), and
 *  - the structure of "Sample Input | Expected Output" tables.
 * This reads the document as HTML instead and rebuilds both, so DOCX files
 * go through the same question parser as PDFs.
 */

/** Text of a node with <strong>/<b> runs written as **bold**. */
function inlineText(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return "";

  const tag = node.tagName.toLowerCase();
  if (tag === "br") return "\n";

  const inner = Array.from(node.childNodes).map(inlineText).join("");
  if ((tag === "strong" || tag === "b") && inner.trim()) {
    // Keep the spaces outside the markers: "** word **" would not be bold.
    const lead = inner.match(/^\s*/)[0];
    const trail = inner.match(/\s*$/)[0];
    return `${lead}**${inner.trim()}**${trail}`;
  }

  return inner;
}

const mergeBold = (text) => text.replace(/\*\*(\s*)\*\*/g, "$1");

const clean = (text) =>
  String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

function cellLines(cell) {
  const paragraphs = Array.from(cell.querySelectorAll("p"));
  const lines = paragraphs.length
    ? paragraphs.map((paragraph) => clean(paragraph.textContent))
    : clean(cell.textContent).split("\n").map(clean);

  return lines.filter(Boolean);
}

function tableToLines(table) {
  const rows = Array.from(table.querySelectorAll("tr")).map((row) =>
    Array.from(row.children).filter((cell) => /^t[dh]$/i.test(cell.tagName)),
  );

  const header = rows[0];
  const isSampleTable =
    header &&
    header.length === 2 &&
    inputHeaderLabel(header[0].textContent) &&
    outputHeaderLabel(header[1].textContent);

  if (isSampleTable) {
    const inputLabel = inputHeaderLabel(header[0].textContent);
    const outputLabel = outputHeaderLabel(header[1].textContent);

    const left = [];
    const right = [];
    rows.slice(1).forEach(([inputCell, outputCell]) => {
      if (inputCell) left.push(...cellLines(inputCell));
      if (outputCell) right.push(...cellLines(outputCell));
    });

    return [
      ...(left.length ? [`${inputLabel}:`, ...left] : []),
      ...(right.length ? [`${outputLabel}:`, ...right] : []),
    ];
  }

  // Any other table: one line per row, cells separated by " | ".
  return rows
    .map((cells) =>
      cells
        .map((cell) => cellLines(cell).join(" "))
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean);
}

/**
 * @param html          HTML produced by mammoth
 * @param parseHtml     (html) => Document   (defaults to the browser DOMParser)
 */
export function htmlToStructuredText(html, parseHtml) {
  const doc = parseHtml
    ? parseHtml(html)
    : new DOMParser().parseFromString(html, "text/html");

  const lines = [];
  let topLevelNumber = 0;

  const walk = (node, depth = 0) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();

      if (tag === "table") {
        lines.push("", ...tableToLines(child), "");
      } else if (tag === "ol" || tag === "ul") {
        Array.from(child.children).forEach((item, index) => {
          const own = Array.from(item.childNodes)
            .filter((n) => !(n.nodeType === 1 && /^(ol|ul)$/i.test(n.tagName)))
            .map(inlineText)
            .join("");
          const text = clean(mergeBold(own));

          if (text) {
            if (tag === "ol") {
              const marker =
                depth === 0
                  ? `${(topLevelNumber += 1)}.`
                  : `${String.fromCharCode(97 + (index % 26))}.`;
              lines.push(`${marker} ${text}`);
            } else {
              lines.push(`• ${text}`);
            }
          }

          Array.from(item.children)
            .filter((n) => /^(ol|ul)$/i.test(n.tagName))
            .forEach((nested) => walk({ children: [nested] }, depth + 1));
        });
      } else {
        // A heading is bold by style, not by emphasis.
        const text = clean(mergeBold(inlineText(child)));
        if (text) lines.push(text, "");
      }
    }
  };

  walk(doc.body);
  return lines.join("\n");
}

export async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    const text = htmlToStructuredText(html);
    if (text.trim()) return text;
  } catch (error) {
    console.warn(
      "Structured DOCX reading failed, using plain text instead.",
      error,
    );
  }

  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}
