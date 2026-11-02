/**
 * Detects the questions inside text taken from a PDF / DOCX / pasted text.
 *
 * Improvements over the first version:
 *  - Question numbers are validated as a running sequence (1, 2, 3 ...), so
 *    numbered sub-steps ("1. Create a base class ...") and menu options
 *    ("1. Add contact ... 5. Exit") inside a question are NOT split off as
 *    separate questions.
 *  - Duplicate numbering (two "2." in a row) and bare markers ("9." with the
 *    text on the next line) are handled.
 *  - Sample Input / Expected Output parts are separated from the statement
 *    and written in a clean, consistent layout.
 *  - Lines like "Name: Krupa" inside a sample output are no longer thrown away
 *    as if they were student-detail headers.
 *  - Course-specific noise is not hard-coded here any more: pass a `config`
 *    (see src/python/parserConfig.js for the Python course profile).
 */
import { normalizeLine } from "./textUtils.js";
import {
  buildQuestionBlock,
  formatQuestionBlock,
  matchSectionHeading,
  stripBold,
} from "./questionFormat.js";

export { normalizeLine };

export const DEFAULT_PARSER_CONFIG = {
  /** Headings (exact text, case-insensitive) that are never part of a question. */
  ignoredHeadings: [],
  /** Extra regular expressions for lines that should be dropped. */
  ignoredPatterns: [],
};

const PAGE_BREAK = "---PAGE_BREAK---";

/* ------------------------------- line filtering ------------------------------- */

const PAGE_NOISE_PATTERNS = [
  /^page\s+\d+(?:\s+of\s+\d+)?\s*$/i,
  /^\d+\s*\/\s*\d+\s*$/,
];

export function shouldIgnoreLine(line, config = DEFAULT_PARSER_CONFIG) {
  const clean = stripBold(normalizeLine(line)).trim();
  const lower = clean.toLowerCase();

  if (!clean || clean === PAGE_BREAK) return true;

  if (PAGE_NOISE_PATTERNS.some((pattern) => pattern.test(clean))) return true;

  if (
    (config.ignoredHeadings || []).some(
      (heading) => heading.toLowerCase() === lower,
    )
  ) {
    return true;
  }

  return (config.ignoredPatterns || []).some((pattern) => pattern.test(clean));
}

/* --------------------------------- markers --------------------------------- */

function romanToNumber(value) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  const roman = value.toUpperCase();
  let total = 0;
  let previous = 0;

  for (let index = roman.length - 1; index >= 0; index -= 1) {
    const current = map[roman[index]] || 0;
    total += current < previous ? -current : current;
    previous = Math.max(previous, current);
  }

  return total || null;
}

/**
 * Questions are often printed in bold ("**1.** **Write a program ...**").
 * Run a marker parser on the line without its opening bold marker and give the
 * bold back to the question text when the bold continues past the number.
 */
function withBold(parse) {
  return (line) => {
    const text = normalizeLine(line);
    if (!text.startsWith("**")) return parse(text);

    const marker = parse(text.replace(/^\*\*\s*/, ""));
    if (!marker) return null;

    if (/^\*\*/.test(marker.content)) {
      marker.content = marker.content.replace(/^\*\*\s*/, "");
    } else if (marker.content) {
      marker.content = `**${marker.content}`;
    }

    return marker;
  };
}

function parseExplicitMarkerPlain(line) {
  const clean = normalizeLine(line);

  const activity = clean.match(
    /^(exercise|experiment|practical)\s*(?:no\.?\s*)?(\d+)\s*[.)\-:]?\s*(.*)$/i,
  );

  if (activity) {
    const raw = activity[1].toLowerCase();
    const label = raw.charAt(0).toUpperCase() + raw.slice(1);
    const number = Number(activity[2]);
    const title = activity[3]?.trim() || "";

    return {
      type: raw,
      number,
      content: title ? `${label} ${number}: ${title}` : `${label} ${number}`,
    };
  }

  const question = clean.match(
    /^(?:q(?:uestion)?|que)\s*(?:no\.?\s*)?[-.:]?\s*(\d+)\s*[.)\-:]?\s*(.*)$/i,
  );

  if (question) {
    return {
      type: "question",
      number: Number(question[1]),
      content: question[2]?.trim() || "",
    };
  }

  return null;
}

function parseNumberedMarkerPlain(line) {
  const clean = normalizeLine(line);

  // "1. text", "1) text", "10.Text", bare "9."  – but never "3.14" or "60-74".
  const match = clean.match(/^(\d{1,3})\s*(?:\)|\.(?!\d)|[:-]\s)\s*(.*)$/);
  if (!match) return null;

  return {
    type: "numbered",
    number: Number(match[1]),
    content: match[2].trim(),
  };
}

// (1)  [1]  (1.)  – numbers wrapped in brackets.
function parseBracketMarkerPlain(line) {
  const clean = normalizeLine(line);
  const match = clean.match(/^[([](\d{1,3})[)\]]\s*[.:-]?\s*(.*)$/);
  return match
    ? { type: "bracket", number: Number(match[1]), content: match[2].trim() }
    : null;
}

// a)  (b)  C.  – single letters counting a, b, c ...
function parseLetterMarkerPlain(line) {
  const clean = normalizeLine(line);
  const match = clean.match(/^\(?([A-Za-z])(?:\)|\.)(?:\s+(.*))?$/);
  if (!match) return null;

  return {
    type: "letter",
    number: match[1].toLowerCase().charCodeAt(0) - 96,
    content: (match[2] || "").trim(),
  };
}

function parseRomanMarkerPlain(line) {
  const clean = normalizeLine(line);
  const match = clean.match(/^([IVXLCDM]{1,7})\s*[.)\-:]\s+(.+)$/i);
  if (!match) return null;

  const number = romanToNumber(match[1]);
  return number ? { type: "roman", number, content: match[2].trim() } : null;
}

const parseExplicitMarker = withBold(parseExplicitMarkerPlain);
const parseNumberedMarker = withBold(parseNumberedMarkerPlain);
const parseRomanMarker = withBold(parseRomanMarkerPlain);
const parseBracketMarker = withBold(parseBracketMarkerPlain);
const parseLetterMarker = withBold(parseLetterMarkerPlain);

/* ------------------------- choosing the real questions ------------------------- */

/**
 * Marks numbered lines that are items of a list inside a question: a run of
 * adjacent numbered lines whose introduction ends with ":" or says "the
 * following / these / below" (for example "...with these options:").
 */
function markListItems(lines, candidates) {
  const introducesList = (line) => {
    const text = stripBold(line).trim();
    if (/:$/.test(text)) return true;
    return /\b(following|these|below)\b/i.test(text) && !/[.?!]$/.test(text);
  };

  const previousLine = (index) => {
    let before = index - 1;
    while (before >= 0 && !lines[before]) before -= 1;
    return before >= 0 ? lines[before] : "";
  };

  let inList = false;
  let lastNumber = 0;
  let lastLine = -10;

  candidates.forEach((candidate) => {
    const startsList = introducesList(previousLine(candidate.lineIndex));
    const continuesList =
      inList &&
      candidate.lineIndex - lastLine <= 2 &&
      candidate.number === lastNumber + 1;

    if (startsList || continuesList) {
      candidate.subItem = true;
      inList = true;
      lastNumber = candidate.number;
      lastLine = candidate.lineIndex;
    } else {
      inList = false;
    }
  });
}

/**
 * Pick the longest run of markers that counts upwards (n, n+1, n+2 ...).
 * Sub-lists inside a question restart from 1 and therefore never join the run.
 * Small skips (a lost marker) are tolerated at a lower score.
 */
function selectQuestionChain(candidates) {
  const count = candidates.length;
  if (!count) return [];

  // A marker that looks like a list item inside a question counts for much less
  // than a real question marker, so a menu ("1. Add 2. Delete 3. Exit") can
  // never beat the real numbering when both give the same run length.
  const unit = (index) => (candidates[index].subItem ? 0.4 : 1);

  const score = candidates.map((_, index) => unit(index));
  const previous = new Array(count).fill(-1);

  for (let i = 0; i < count; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const step = candidates[i].number - candidates[j].number;
      const weight =
        (step === 1 ? 1 : step === 2 || step === 3 ? 0.7 : 0) * unit(i);
      if (!weight) continue;

      // ">=" prefers the nearest earlier marker when scores tie.
      if (score[j] + weight >= score[i]) {
        score[i] = score[j] + weight;
        previous[i] = j;
      }
    }
  }

  let end = 0;
  for (let i = 1; i < count; i += 1) {
    if (
      score[i] > score[end] ||
      (score[i] === score[end] &&
        candidates[i].number >= candidates[end].number)
    ) {
      end = i;
    }
  }

  const chain = [];
  for (let i = end; i !== -1; i = previous[i]) chain.unshift(i);
  return chain;
}

function describeSequence(numbers) {
  const warnings = [];
  let jumps = 0;

  for (let i = 1; i < numbers.length; i += 1) {
    const step = numbers[i] - numbers[i - 1];
    if (step === 0) {
      warnings.push(`Question number ${numbers[i]} appears twice in the file.`);
    } else if (step > 1) {
      jumps += 1;
      warnings.push(
        `Question numbers jump from ${numbers[i - 1]} to ${numbers[i]}; a question may be missing.`,
      );
    }
  }

  return { warnings, jumps };
}

/* ------------------------------ building results ------------------------------ */

function buildItems(blocks) {
  return blocks
    .map((block) => ({
      number: block.number,
      statement: block.statement,
      sections: block.sections,
      text: formatQuestionBlock(block),
    }))
    .filter((item) => stripBold(item.statement.join(" ")).trim().length >= 3);
}

function findRepeatedQuestions(items) {
  const seen = new Map();
  const warnings = [];

  items.forEach((item, index) => {
    const key = stripBold(item.statement.join(" "))
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (seen.has(key)) {
      warnings.push(
        `Question ${index + 1} has the same text as question ${seen.get(key) + 1}.`,
      );
    } else {
      seen.set(key, index);
    }
  });

  return warnings;
}

function result(items, extra) {
  return {
    questions: items.map((item) => item.text),
    items,
    warnings: [...(extra.warnings || []), ...findRepeatedQuestions(items)],
    usedFallback: extra.usedFallback,
    format: extra.format,
    confidence: extra.confidence,
  };
}

function collectBlock(lines, startIndex, endIndex, firstContent, config) {
  const raw = [firstContent];

  for (let i = startIndex + 1; i < endIndex; i += 1) {
    const line = lines[i];

    if (line === "") {
      raw.push(""); // paragraph break kept for layout
    } else if (!shouldIgnoreLine(line, config)) {
      raw.push(line);
    }
  }

  return buildQuestionBlock(raw);
}

/* --------------------------------- main API --------------------------------- */

export function detectQuestions(text, config = DEFAULT_PARSER_CONFIG) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map(normalizeLine);

  // Auto-detect the numbering style of THIS file: try each style in order and
  // use the first one that forms a real run (1, 2, 3 ...). If none does, fall
  // back to the first style that matched anything at all.
  const parsers = [
    ["explicit", parseExplicitMarker],
    ["numbered", parseNumberedMarker],
    ["bracket", parseBracketMarker],
    ["roman", parseRomanMarker],
    ["letter", parseLetterMarker],
  ];

  let picked = null;
  let firstMatch = null;

  for (const [name, fn] of parsers) {
    const found = [];
    lines.forEach((line, index) => {
      if (!line || line === PAGE_BREAK) return;
      const marker = fn(line);
      if (marker) found.push({ ...marker, lineIndex: index });
    });

    if (!found.length) continue;

    markListItems(lines, found);
    const entry = { name, fn, found };
    firstMatch = firstMatch || entry;

    if (selectQuestionChain(found).length >= 2) {
      picked = entry;
      break;
    }
  }

  picked = picked || firstMatch;

  const parser = picked?.fn || null;
  const candidates = picked?.found || [];
  const format = picked
    ? picked.name === "explicit"
      ? candidates[0].type
      : picked.name
    : "unknown";

  if (parser) {
    const chain = selectQuestionChain(candidates);
    const starts = chain.map((index) => candidates[index]);

    // A repeated number (two "2." in a row) is a new question only when the
    // neighbouring question is complete, i.e. already shows Sample Input/Output.
    // Otherwise it is just a numbered sub-step inside the current question.
    const inChain = new Set(chain);
    const hasSampleBetween = (from, to) =>
      lines.slice(from + 1, to).some((line) => matchSectionHeading(line));

    candidates.forEach((candidate, index) => {
      if (inChain.has(index)) return;

      const ordered = [...starts].sort((a, b) => a.lineIndex - b.lineIndex);
      const prev = [...ordered]
        .reverse()
        .find((start) => start.lineIndex < candidate.lineIndex);
      const next = ordered.find(
        (start) => start.lineIndex > candidate.lineIndex,
      );

      const duplicatesPrev =
        prev &&
        prev.number === candidate.number &&
        hasSampleBetween(prev.lineIndex, candidate.lineIndex);

      const duplicatesNext =
        prev &&
        next &&
        next.number === candidate.number &&
        prev.number === candidate.number - 1 &&
        hasSampleBetween(prev.lineIndex, candidate.lineIndex) &&
        hasSampleBetween(candidate.lineIndex, next.lineIndex);

      if (duplicatesPrev || duplicatesNext) starts.push(candidate);
    });

    starts.sort((a, b) => a.lineIndex - b.lineIndex);

    const blocks = starts.map((start, position) => {
      const end = starts[position + 1]?.lineIndex ?? lines.length;
      const block = collectBlock(
        lines,
        start.lineIndex,
        end,
        start.content,
        config,
      );
      return { number: start.number, ...block };
    });

    const items = buildItems(blocks);
    const sequence = describeSequence(items.map((item) => item.number));
    const confidence =
      sequence.jumps === 0
        ? ["exercise", "experiment", "practical", "question"].includes(format)
          ? 98
          : 94
        : Math.max(70, 88 - sequence.jumps * 4);

    return result(items, {
      warnings: sequence.warnings,
      usedFallback: false,
      format,
      confidence,
    });
  }

  /* ---- no numbering at all: bullets, then "looks like a task" lines ---- */

  const usable = lines.filter(
    (line) => line && !shouldIgnoreLine(line, config),
  );
  const bullets = usable.filter((line) => /^[•●▪◦*-]\s+/.test(line));

  if (bullets.length >= 2) {
    const items = buildItems(
      bullets.map((line) => ({
        number: null,
        ...buildQuestionBlock([line.replace(/^[•●▪◦*-]\s+/, "")]),
      })),
    );
    return result(items, {
      usedFallback: true,
      format: "bullet",
      confidence: 78,
    });
  }

  const taskStart =
    /^(?:write|create|develop|demonstrate|explain|define|describe|calculate|accept|initialize|design|implement|find|display|show|access|compare|differentiate|derive|convert|check|print|read|enter|what|why|how|which|when|where|who|state|list|give|draw|discuss|prepare|illustrate|solve|prove|identify|mention|classify|construct|perform|use|store|given)\b/i;
  const groups = [];

  for (const line of usable) {
    if (matchSectionHeading(line) && groups.length) {
      groups[groups.length - 1].push(line);
    } else if (taskStart.test(line) || /\?\s*$/.test(line)) {
      groups.push([line]);
    } else if (groups.length) {
      groups[groups.length - 1].push(line);
    }
  }

  const items = buildItems(
    groups.map((group) => ({ number: null, ...buildQuestionBlock(group) })),
  );

  return result(items, {
    usedFallback: true,
    format: "smart fallback",
    confidence: items.length ? 65 : 0,
  });
}
