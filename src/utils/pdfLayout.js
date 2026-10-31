/**
 * Pure layout logic for turning pdf.js text items into clean lines.
 * No browser / pdf.js imports here, so it can be unit-tested in Node.
 *
 * What it fixes compared with simply joining text items:
 *  - Two-column "Sample Input | Expected Output" tables are split by their
 *    x-position, so the input and output of a question no longer get glued
 *    together on one line.
 *  - Kerning glitches such as "Sampl" + "e Input" are re-joined correctly.
 *  - Repeated page headers/footers are removed.
 *  - Paragraph gaps are kept (as blank lines) so multi-paragraph questions
 *    can be laid out properly later.
 */
import { normalizeLine } from "./textUtils.js";

const plain = (text = "") => String(text).replace(/\*\*/g, "");

const SAME_ROW_TOLERANCE = 3; // pt
const RUN_GAP = 12; // pt – items closer than this belong to the same text run
const TIGHT_GAP = 1.2; // pt – items closer than this need no space between them
const PARAGRAPH_GAP_RATIO = 1.35;

// Compared with all spaces removed, so kerning glitches ("Sampl e Input") still match.
const squash = (text) => plain(text).replace(/\s+/g, "").toLowerCase();
const SAMPLE_INPUT_HEADER = /^sampleinput(?:\/(?:call|action))?$/;
const SAMPLE_OUTPUT_HEADER = /^(?:expected|sample)output$/;

/* --------------------------------- bold --------------------------------- */

export function isBoldFont(font) {
  return Boolean(
    font &&
    (font.bold || /bold|black|heavy|semibold|demi/i.test(font.name || "")),
  );
}

/** Tag every pdf.js text item with `bold`, using the font it is drawn with. */
export function markBoldItems(items, getFont) {
  return items.map((item) => {
    let font = null;
    try {
      font = getFont(item.fontName);
    } catch {
      font = null;
    }
    return { ...item, bold: isBoldFont(font) };
  });
}

/* ----------------------------- rows & runs ----------------------------- */

/** Wrap bold pieces of a run in **...** (spaces stay outside the markers). */
function renderPieces(pieces) {
  let out = "";

  pieces.forEach(({ text, bold, space }) => {
    const value = normalizeLine(text);
    if (!value) return;

    out += space && out ? " " : "";
    out += bold ? `**${value}**` : value;
  });

  return mergeAdjacentBold(out);
}

function mergeAdjacentBold(text) {
  return text.replace(/\*\*(\s*)\*\*/g, "$1");
}

function toRuns(items) {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const runs = [];

  for (const item of sorted) {
    const last = runs[runs.length - 1];
    const gap = last ? item.x - last.end : Infinity;
    const piece = { text: item.text, bold: Boolean(item.bold), space: false };

    if (last && gap < RUN_GAP) {
      piece.space = gap >= TIGHT_GAP;
      last.pieces.push(piece);
      last.end = Math.max(last.end, item.x + item.w);
    } else {
      runs.push({ x: item.x, end: item.x + item.w, pieces: [piece] });
    }
  }

  return runs
    .map((run) => ({ x: run.x, end: run.end, text: renderPieces(run.pieces) }))
    .filter((run) => run.text);
}

/** pdf.js `textContent.items` of one page -> visual rows (top to bottom). */
export function extractRows(items) {
  const entries = items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => ({
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
      w: item.width ?? 0,
      text: item.str,
      bold: Boolean(item.bold),
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const groups = [];
  for (const entry of entries) {
    const group = groups[groups.length - 1];
    if (group && Math.abs(group.y - entry.y) <= SAME_ROW_TOLERANCE) {
      group.items.push(entry);
    } else {
      groups.push({ y: entry.y, items: [entry] });
    }
  }

  return groups
    .map((group) => ({ y: group.y, runs: toRuns(group.items) }))
    .filter((row) => row.runs.length);
}

export function rowText(row) {
  return mergeAdjacentBold(row.runs.map((run) => run.text).join(" "));
}

/* ------------------------- repeated header/footer ------------------------- */

const noiseKey = (text) =>
  plain(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

function isPageNumberRow(text) {
  return /^(?:page\s*)?\d{1,3}(?:\s*(?:of|\/)\s*\d{1,3})?$/i.test(
    plain(text).trim(),
  );
}

export function removeRepeatedNoiseRows(pages, edge = 4) {
  if (pages.length < 2) {
    return pages.map((rows) =>
      rows.filter((row, index) => {
        const isEdge = index < edge || index >= rows.length - edge;
        return !(isEdge && isPageNumberRow(rowText(row)));
      }),
    );
  }

  const counts = new Map();
  for (const rows of pages) {
    const keys = new Set();
    rows.forEach((row, index) => {
      if (index < edge || index >= rows.length - edge) {
        const key = noiseKey(rowText(row));
        if (key) keys.add(key);
      }
    });
    keys.forEach((key) => counts.set(key, (counts.get(key) || 0) + 1));
  }

  const threshold = Math.max(2, Math.ceil(pages.length * 0.6));

  return pages.map((rows) =>
    rows.filter((row, index) => {
      const isEdge = index < edge || index >= rows.length - edge;
      if (!isEdge) return true;

      // "Sample Input | Expected Output" rows repeat on every page but are content.
      if (findTableHeader(row)) return true;

      const text = rowText(row);
      if (isPageNumberRow(text)) return false;

      const key = noiseKey(text);
      return !(counts.get(key) >= threshold && text.length <= 160);
    }),
  );
}

/* ------------------------------ sample tables ------------------------------ */

function findTableHeader(row) {
  const input = row.runs.find((run) =>
    SAMPLE_INPUT_HEADER.test(squash(run.text)),
  );
  if (!input) return null;

  const output = row.runs.find(
    (run) =>
      run.x > input.x + 40 && SAMPLE_OUTPUT_HEADER.test(squash(run.text)),
  );
  if (!output) return null;

  return {
    leftX: input.x,
    rightX: output.x,
    inputLabel: canonicalLabel(squash(input.text)),
    outputLabel: squash(output.text).startsWith("sample")
      ? "Sample Output"
      : "Expected Output",
  };
}

/** Join wrapped cell lines when a bracket/paren opened on the previous line. */
function joinWrappedCells(lines) {
  const out = [];
  const depth = (text) =>
    (text.match(/[[({]/g) || []).length - (text.match(/[\])}]/g) || []).length;

  // "Status:" + "PASSED", "Uppercase: PYTHON" + "PROGRAMMING": a lone ALL-CAPS word
  // under a longer line is almost always its wrapped tail.
  const isWrappedTail = (previous, line) =>
    /^[A-Z][A-Z0-9_]{2,}$/.test(line) && /\s/.test(previous);

  for (const line of lines) {
    const last = out.length - 1;
    if (last >= 0 && (depth(out[last]) > 0 || isWrappedTail(out[last], line))) {
      // A number broken across two lines ("100" / "00)") is glued back together.
      const glue = /\d$/.test(out[last]) && /^\d/.test(line) ? "" : " ";
      out[last] = `${out[last]}${glue}${line}`;
    } else {
      out.push(line);
    }
  }
  return out;
}

function canonicalLabel(squashed) {
  const suffix = squashed.match(/\/(call|action)$/);
  return suffix
    ? `Sample Input / ${suffix[1].charAt(0).toUpperCase()}${suffix[1].slice(1)}`
    : "Sample Input";
}

/* --------------------------- rows -> text lines --------------------------- */

/**
 * Walks the rows of every page in order. A sample table that starts at the
 * bottom of one page and continues on the next (header on page N, rows on
 * page N+1) is kept together instead of losing its header.
 */
function rowsToPageLines(pagesOfRows) {
  let table = null;
  let previousGap = null;
  let previousY = null;
  let lastQuestionNumber = null;
  let lines = [];

  const questionNumberOf = (rawText) => {
    const text = plain(rawText).trim();
    const match = text.match(/^(\d{1,3})\s*[.)](?!\d)/);
    return match ? Number(match[1]) : null;
  };
  const isNextQuestion = (text) => {
    const number = questionNumberOf(text);
    return (
      number !== null &&
      lastQuestionNumber !== null &&
      (number === lastQuestionNumber + 1 || number === lastQuestionNumber)
    );
  };

  const flushTable = () => {
    if (!table) return;

    const left = joinWrappedCells(table.left);
    const right = joinWrappedCells(table.right);

    if (left.length) lines.push(`${table.inputLabel}:`, ...left);
    if (right.length) lines.push(`${table.outputLabel}:`, ...right);
    table = null;
  };

  const result = pagesOfRows.map((rows) => {
    lines = [];
    previousGap = null;
    previousY = null;

    rows.forEach((row, rowIndex) => {
      const header = findTableHeader(row);

      if (header) {
        flushTable();
        table = { ...header, left: [], right: [] };
        previousY = row.y;
        return;
      }

      if (table) {
        const startsLeftOfTable =
          row.runs[0].x < table.leftX - 4 || isNextQuestion(row.runs[0].text);
        // On a fresh page, only rows that line up with the table columns continue it.
        const alignsWithTable =
          rowIndex > 0 ||
          row.runs.every(
            (run) =>
              Math.abs(run.x - table.leftX) < 8 ||
              Math.abs(run.x - table.rightX) < 8,
          );

        if (!startsLeftOfTable && alignsWithTable) {
          for (const run of row.runs) {
            (run.x >= table.rightX - 8 ? table.right : table.left).push(
              plain(run.text),
            );
          }
          previousY = row.y;
          return;
        }

        flushTable();
      }

      // Paragraph spacing: a gap clearly larger than the previous line pitch.
      if (previousY !== null) {
        const gap = previousY - row.y;
        if (
          previousGap &&
          gap > previousGap * PARAGRAPH_GAP_RATIO &&
          lines.length
        ) {
          lines.push("");
        }
        previousGap = gap;
      }
      previousY = row.y;

      const text = rowText(row);
      const number = questionNumberOf(text);
      if (
        number !== null &&
        (lastQuestionNumber === null ||
          number === lastQuestionNumber + 1 ||
          number === lastQuestionNumber)
      ) {
        lastQuestionNumber = number;
      }

      lines.push(text);
    });

    return lines;
  });

  flushTable(); // a table still open after the last page goes with the last page
  return result;
}

/** Full pipeline: per-page pdf.js items -> per-page clean lines. */
export function layoutPages(pagesOfItems) {
  const pagesOfRows = pagesOfItems.map(extractRows);
  const cleaned = removeRepeatedNoiseRows(pagesOfRows);
  return rowsToPageLines(cleaned);
}
