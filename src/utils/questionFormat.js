/**
 * One place that knows how a question is written down.
 *
 * A question is stored as plain text (so it stays editable in a textarea):
 *
 *   <statement line 1>
 *   <statement line 2 / bullet / numbered sub-step ...>
 *
 *   Sample Input:
 *   <lines>
 *
 *   Expected Output:
 *   <lines>
 *
 * parseQuestionBlock() reads that text back into { statement, sections } so
 * the Word / PDF / Jupyter generators can lay each part out properly.
 */
import { normalizeLine } from "./textUtils.js";

/* ------------------------------ inline bold ------------------------------ */

/** Bold is stored as **text** so it stays readable and editable. */
export function stripBold(text = "") {
  return String(text).replace(/\*\*/g, "");
}

/** "**a** **b**" -> "**a b**" and drop empty "****" pairs. */
export function mergeBold(text = "") {
  return String(text)
    .replace(/\*\*\s*\*\*/g, " ")
    .replace(/\*\*(\s+)\*\*/g, "$1")
    .replace(/ {2,}/g, " ");
}

/** Text -> [{ text, bold }] runs. A stray single "**" is ignored. */
export function splitBold(text = "") {
  const parts = String(text).split("**");
  const runs = [];

  parts.forEach((part, index) => {
    if (!part) return;
    // Odd number of markers: the last piece has no closing marker -> not bold.
    const closed = index < parts.length - 1 || parts.length % 2 === 1;
    runs.push({ text: part, bold: index % 2 === 1 && closed });
  });

  return runs.length ? runs : [{ text: "", bold: false }];
}

const TASK_VERBS =
  "accept|add|calculate|compare|create|define|demonstrate|derive|design|display|" +
  "find|implement|override|print|read|show|simulate|store|take|use|write|check|" +
  "convert|count|merge|remove|sort|given|accept";

const TASK_SENTENCE_START = new RegExp(`^(?:${TASK_VERBS})\\b`, "i");
const BULLET_START = /^(?:[•▪●‣]\s*|\*(?!\*)\s+)/;
const SUB_BULLET_START = /^(?:◦|○|o)\s+(?=\S)/;
const DASH_BULLET_START = /^-\s+(?=\S)/;
const NUMBERED_STEP = /^\(?\d{1,2}[.)]\s+\S/;
const LETTERED_STEP = /^\(?[a-z][.)]\s+\S/;
const LABEL_LINE =
  /^(?:problem\s+statement|criteria|constraints?|requirements?|formula|hint|note|example|task)\s*:/i;
const INLINE_STEP = /\s\d{1,2}[.)]\s+[A-Z]/;

/* ------------------------------ section headings ------------------------------ */

const BOTH_HEADING =
  /^sample\s+input\s*(?:\/|&|and|,)?\s*(?:expected|sample)\s+output\s*:?$/i;
const NAMED_HEADING =
  /^(sample\s+input(?:\s*\/\s*(?:call|action))?|expected\s+output|sample\s+output)\s*(?::\s*(.*))?$/i;
const BARE_HEADING = /^(input|output)\s*:\s*$/i;

function titleCase(label) {
  return label
    .toLowerCase()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function matchSectionHeading(line) {
  const text = stripBold(normalizeLine(line)).trim();
  if (!text) return null;

  if (BOTH_HEADING.test(text)) {
    return { kind: "both", label: "Sample Input / Expected Output", rest: "" };
  }

  const named = text.match(NAMED_HEADING);
  if (named) {
    const label = titleCase(named[1]);
    return {
      kind: /input/i.test(label) ? "input" : "output",
      label,
      rest: (named[2] || "").trim(),
    };
  }

  const bare = text.match(BARE_HEADING);
  if (bare) {
    const label = titleCase(bare[1]);
    return { kind: /input/i.test(label) ? "input" : "output", label, rest: "" };
  }

  return null;
}

/* --------------------------- statement line joining --------------------------- */

function normalizeBullet(line) {
  if (SUB_BULLET_START.test(line))
    return `◦ ${line.replace(SUB_BULLET_START, "")}`;
  if (BULLET_START.test(line)) return `• ${line.replace(BULLET_START, "")}`;
  if (DASH_BULLET_START.test(line))
    return `• ${line.replace(DASH_BULLET_START, "")}`;
  return line;
}

function startsNewLine(rawLine, rawPrevious) {
  const line = stripBold(rawLine).trim();
  const previous = stripBold(rawPrevious).trim();

  if (BULLET_START.test(line) || SUB_BULLET_START.test(line)) return true;
  if (DASH_BULLET_START.test(line)) return true;
  if (LABEL_LINE.test(line)) return true;

  if (
    (NUMBERED_STEP.test(line) || LETTERED_STEP.test(line)) &&
    !INLINE_STEP.test(line)
  ) {
    return true;
  }

  // A finished sentence followed by a new instruction ("Create ...", "Write ...").
  const previousEndsSentence =
    /[.?!:]["')\]]?$/.test(previous) && !/(?:^|\s)\d{1,2}\.$/.test(previous); // "options: 1." is a list number

  if (
    previousEndsSentence &&
    /^[A-Z]/.test(line) &&
    TASK_SENTENCE_START.test(line)
  ) {
    return true;
  }

  return false;
}

/**
 * Raw wrapped lines (blank string = paragraph break) -> logical statement lines.
 * Wrapped sentences are re-joined; bullets, numbered steps, labels and
 * paragraphs each keep their own line.
 */
export function joinStatementLines(rawLines) {
  const out = [];
  let forceBreak = true;

  for (const raw of rawLines) {
    const line = normalizeLine(raw);

    if (!line) {
      forceBreak = true;
      continue;
    }

    if (forceBreak || !out.length || startsNewLine(line, out[out.length - 1])) {
      out.push(normalizeBullet(line));
    } else {
      out[out.length - 1] = mergeBold(`${out[out.length - 1]} ${line}`);
    }

    forceBreak = false;
  }

  return out;
}

/* ------------------------------- block <-> text ------------------------------- */

function mergeEmptySections(sections) {
  const merged = [];

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const next = sections[index + 1];

    // "Sample Input" immediately followed by "Expected Output" (no rows between
    // them) means the table was flattened; keep the rows as one combined block.
    if (
      !section.lines.length &&
      next &&
      section.kind === "input" &&
      next.kind === "output"
    ) {
      merged.push({
        kind: "both",
        label: "Sample Input / Expected Output",
        lines: next.lines,
      });
      index += 1;
      continue;
    }

    if (section.lines.length) merged.push(section);
  }

  return merged;
}

/**
 * @param rawLines  lines of one question (first line = text after the number)
 * @param rejoin    true for freshly extracted wrapped lines, false for text that
 *                  was already formatted by formatQuestionBlock()
 */
export function buildQuestionBlock(rawLines, { rejoin = true } = {}) {
  const statementLines = [];
  const sections = [];
  let current = null;

  for (const raw of rawLines) {
    const trimmed = String(raw ?? "").trim();

    if (!trimmed) {
      if (!current) statementLines.push("");
      continue;
    }

    const heading = matchSectionHeading(trimmed);

    if (heading) {
      current = {
        kind: heading.kind,
        label: heading.label,
        lines: heading.rest ? [heading.rest] : [],
      };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(stripBold(trimmed));
    } else {
      statementLines.push(trimmed);
    }
  }

  const statement = rejoin
    ? joinStatementLines(statementLines)
    : statementLines.map((line) => line.trim()).filter(Boolean);

  return { statement, sections: mergeEmptySections(sections) };
}

export function formatQuestionBlock({ statement = [], sections = [] }) {
  const parts = [statement.join("\n")];

  for (const section of sections) {
    parts.push(`${section.label}:\n${section.lines.join("\n")}`);
  }

  return parts.filter((part) => part.trim()).join("\n\n");
}

/** Read a stored question string back into { statement[], sections[] }. */
export function parseQuestionBlock(text = "") {
  const lines = String(text).replace(/\r/g, "").split("\n");
  return buildQuestionBlock(lines, { rejoin: false });
}

/** Statement only, as one line – handy for comparisons and short titles. */
export function getQuestionStatement(text = "") {
  return stripBold(parseQuestionBlock(text).statement.join(" "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove "Q1.", "1)", "Exercise 3:" style prefixes from the start of a text. */
export function stripQuestionNumber(value = "") {
  return String(value)
    .replace(
      /^\s*(?:Exercise|Experiment|Practical)\s*(?:No\.?\s*)?\d+\s*[:.)-]?\s*/i,
      "",
    )
    .replace(
      /^\s*(?:Q(?:uestion)?|Que)\s*(?:No\.?\s*)?[-.:]?\s*\d+\s*[:.)-]?\s*/i,
      "",
    )
    .replace(/^\s*\d{1,4}\s*[.):-]\s+/, "")
    .trim();
}
