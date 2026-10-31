import { jsPDF } from "jspdf";
import { toPdfSafeText } from "../../utils/pdfText";

function sourceToText(source) {
  if (Array.isArray(source)) return source.join("");
  return String(source || "");
}

function decodeHtml(text = "") {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function fixCommonEncoding(text = "") {
  return String(text)
    .replace(/ð·/g, "•")
    .replace(/ï‚·/g, "•")
    .replace(/\uf0b7/g, "•")
    .replace(/\u00a0/g, " ");
}

/** Remove inline markdown / HTML but never touch snake_case names like send_message. */
function stripInline(text = "") {
  const escaped = [];

  return (
    String(text)
      // \_ \* \` ... are literal characters: protect them from the rules below.
      .replace(/\\([\\`*_[\]{}#])/g, (_, char) => {
        escaped.push(char);
        return `\uE000${escaped.length - 1}\uE001`;
      })
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(^|\W)__(.+?)__(?=\W|$)/g, "$1$2")
      .replace(/(^|[\s(])\*(?=\S)(.+?)(?<=\S)\*(?=$|[\s).,!?:;])/g, "$1$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\uE000(\d+)\uE001/g, (_, index) => escaped[Number(index)])
      .trim()
  );
}

function htmlToMarkdownText(text) {
  return decodeHtml(text)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(?:p|div|h[1-6]|ul|ol|li|table|tr)>/gi, "\n\n");
}

/**
 * Markdown cell -> blocks: heading, para, bullet, label, code, sample.
 * "**Sample Input:**" followed by a ``` block becomes one "sample" block.
 */
function parseMarkdownBlocks(source) {
  const raw = fixCommonEncoding(sourceToText(source)).replace(/\r/g, "");
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    const text = stripInline(paragraph.join(" "));
    if (text) blocks.push({ type: "para", text });
    paragraph = [];
  };

  // Split into fenced / unfenced parts first so code is never treated as HTML.
  const parts = [];
  let current = { fenced: false, lines: [] };

  raw.split("\n").forEach((line) => {
    if (/^\s*```/.test(line)) {
      parts.push(current);
      current = { fenced: !current.fenced, lines: [] };
      return;
    }
    current.lines.push(line);
  });
  parts.push(current);

  parts.forEach((part) => {
    if (part.fenced) {
      flushParagraph();
      const text = part.lines.join("\n").replace(/\s+$/g, "");
      if (text.trim()) blocks.push({ type: "code", text });
      return;
    }

    htmlToMarkdownText(part.lines.join("\n"))
      .split("\n")
      .forEach((rawLine) => {
        const line = rawLine.trimEnd();
        const trimmed = line.trim();

        if (!trimmed) {
          flushParagraph();
          return;
        }

        const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
          flushParagraph();
          blocks.push({
            type: "heading",
            level: heading[1].length,
            text: stripInline(heading[2]),
          });
          return;
        }

        const bullet = line.match(/^(\s*)(?:[-*+•]|◦)\s+(.*)$/);
        if (bullet) {
          flushParagraph();
          blocks.push({
            type: "bullet",
            depth: Math.min(
              3,
              Math.floor(bullet[1].replace(/\t/g, "    ").length / 4),
            ),
            text: stripInline(bullet[2]),
          });
          return;
        }

        const label = trimmed.match(/^\*\*(.+?):\*\*$|^\*\*(.+?)\*\*:$/);
        if (label) {
          flushParagraph();
          blocks.push({
            type: "label",
            text: stripInline(label[1] || label[2]),
          });
          return;
        }

        paragraph.push(trimmed);
      });

    flushParagraph();
  });

  // label + code => sample
  const merged = [];
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i].type === "label" && blocks[i + 1]?.type === "code") {
      merged.push({
        type: "sample",
        label: blocks[i].text,
        text: blocks[i + 1].text,
      });
      i += 1;
    } else if (blocks[i].type === "label") {
      merged.push({ type: "para", text: `${blocks[i].text}:` });
    } else {
      merged.push(blocks[i]);
    }
  }
  return merged;
}

function markdownToPlainText(source) {
  return parseMarkdownBlocks(source)
    .map((block) => {
      if (block.type === "bullet") return `• ${block.text}`;
      if (block.type === "sample") return `${block.label}:\n${block.text}`;
      return block.text;
    })
    .join("\n\n")
    .trim();
}

/* ------------------------ light Python syntax colouring ------------------------ */

const PY_KEYWORDS = new Set(
  "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(
    " ",
  ),
);
const PY_BUILTINS = new Set(
  "print input len range int float str list dict set tuple sum min max sorted reversed open type isinstance enumerate zip map filter abs round bool super append format join split strip lower upper".split(
    " ",
  ),
);
const COLORS = {
  keyword: [150, 45, 170],
  builtin: [30, 100, 180],
  string: [25, 125, 60],
  number: [195, 95, 0],
  comment: [115, 125, 135],
  text: [25, 25, 25],
};

const PY_TOKEN = new RegExp(
  [
    "(#.*$)", // 1 comment
    "([rRbBfFuU]{0,2}(?:\"\"\"|'''))", // 2 triple-quote start
    '([rRbBfFuU]{0,2}"(?:\\\\.|[^"\\\\])*"?)', // 3 double-quoted
    "([rRbBfFuU]{0,2}'(?:\\\\.|[^'\\\\])*'?)", // 4 single-quoted
    "(\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)", // 5 number
    "([A-Za-z_]\\w*)", // 6 word
    "(\\s+)", // 7 whitespace
    "(.)", // 8 anything else
  ].join("|"),
  "g",
);

function tokenizePython(line, state) {
  const tokens = [];
  let rest = line;

  if (state.triple) {
    const end = rest.indexOf(state.triple);
    if (end === -1) return [{ text: rest, color: COLORS.string }];
    tokens.push({ text: rest.slice(0, end + 3), color: COLORS.string });
    rest = rest.slice(end + 3);
    state.triple = null;
  }

  PY_TOKEN.lastIndex = 0;
  let match;

  while ((match = PY_TOKEN.exec(rest)) !== null) {
    const [text, comment, tripleStart, dq, sq, number, word] = match;

    if (comment) {
      tokens.push({ text, color: COLORS.comment });
    } else if (tripleStart) {
      const quote = tripleStart.slice(-3);
      const after = rest.slice(match.index + text.length);
      const end = after.indexOf(quote);

      if (end === -1) {
        tokens.push({ text: text + after, color: COLORS.string });
        state.triple = quote;
        break;
      }

      tokens.push({
        text: text + after.slice(0, end + 3),
        color: COLORS.string,
      });
      PY_TOKEN.lastIndex = match.index + text.length + end + 3;
    } else if (dq || sq) {
      tokens.push({ text, color: COLORS.string });
    } else if (number) {
      tokens.push({ text, color: COLORS.number });
    } else if (word) {
      const isCall = /^\s*\(/.test(rest.slice(match.index + text.length));
      const color = PY_KEYWORDS.has(text)
        ? COLORS.keyword
        : PY_BUILTINS.has(text) && isCall
          ? COLORS.builtin
          : COLORS.text;
      tokens.push({ text, color });
    } else {
      tokens.push({ text, color: COLORS.text });
    }
  }

  return tokens;
}

function outputText(output) {
  if (!output || typeof output !== "object") return "";

  if (output.output_type === "stream") {
    return fixCommonEncoding(sourceToText(output.text));
  }

  if (output.output_type === "error") {
    if (Array.isArray(output.traceback) && output.traceback.length) {
      return fixCommonEncoding(
        output.traceback
          .map((line) => String(line).replace(/\x1b\[[0-9;]*m/g, ""))
          .join("\n"),
      );
    }

    return fixCommonEncoding(
      [output.ename, output.evalue].filter(Boolean).join(": "),
    );
  }

  const data = output.data || {};

  if (data["text/plain"]) {
    return fixCommonEncoding(sourceToText(data["text/plain"]));
  }

  if (data["text/html"]) {
    return markdownToPlainText(data["text/html"]);
  }

  return "";
}

function outputImage(output) {
  const data = output?.data || {};

  if (data["image/png"]) {
    const value = sourceToText(data["image/png"]).replace(/\s/g, "");
    return value ? `data:image/png;base64,${value}` : null;
  }

  if (data["image/jpeg"]) {
    const value = sourceToText(data["image/jpeg"]).replace(/\s/g, "");
    return value ? `data:image/jpeg;base64,${value}` : null;
  }

  return null;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Unable to render a notebook image."));
    image.src = src;
  });
}

function getImageSize(image, maxWidth, maxHeight) {
  const width = image.naturalWidth || image.width || maxWidth;
  const height = image.naturalHeight || image.height || maxHeight;

  const widthScale = maxWidth / width;
  const heightScale = maxHeight / height;
  const scale = Math.min(widthScale, heightScale, 1);

  return {
    width: width * scale,
    height: height * scale,
  };
}

function safeFileName(name = "notebook") {
  return (
    String(name)
      .replace(/\.ipynb$/i, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "notebook"
  );
}

function isQuestionText(text = "") {
  const value = String(text).trim();

  return (
    /^\d{1,4}\s*[.)\-:]\s*/.test(value) ||
    /^(?:Q(?:uestion)?|Que)\s*(?:No\.?\s*)?[-.:]?\s*\d{1,4}\b/i.test(value)
  );
}

function isAssignmentHeading(text = "") {
  return /^(?:practical\s+)?assignment\s*[-:#]?\s*\d*\s*$/i.test(
    String(text).trim(),
  );
}

function formatFallbackTitle(title = "") {
  const clean = String(title || "")
    .replace(/\.ipynb$/i, "")
    .trim();

  if (!clean) return "";

  const assignmentMatch = clean.match(/assignment[\s_-]*(\d+)/i);

  if (assignmentMatch) {
    return `Assignment-${assignmentMatch[1]}`;
  }

  if (/^\d{1,3}$/.test(clean)) {
    return `Assignment-${clean}`;
  }

  return clean.replace(/[_]+/g, " ");
}

function getIntroInfo(notebook) {
  const lines = [];
  let firstQuestionCellIndex = -1;

  for (let index = 0; index < notebook.cells.length; index += 1) {
    const cell = notebook.cells[index];

    if (!cell || cell.cell_type !== "markdown") continue;

    const text = markdownToPlainText(cell.source);

    if (isQuestionText(text)) {
      firstQuestionCellIndex = index;
      break;
    }

    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => lines.push(line));
  }

  const headingIndex = lines.findIndex(isAssignmentHeading);
  const heading = headingIndex >= 0 ? lines[headingIndex] : "";

  return {
    heading,
    detailLines: lines.filter((_, index) => index !== headingIndex),
    firstQuestionCellIndex,
  };
}

/**
 * "BCA-SEM-5 DIV-3" (a free-text line) -> Course / Semester / Division rows,
 * so every detail ends up in the same table.
 */
function detailsFromFreeText(line) {
  let rest = ` ${line} `;
  const rows = [];

  const take = (pattern, label) => {
    const match = rest.match(pattern);
    if (!match) return;
    rows.push([label, match[1].trim()]);
    rest = rest.replace(match[0], " ");
  };

  take(/\bsem(?:ester)?\s*[-:.]?\s*(\d{1,2}|[IVX]{1,4})\b/i, "Semester");
  take(/\bdiv(?:ision)?\s*[-:.]?\s*([A-Za-z0-9]{1,3})\b/i, "Division");

  const remainder = rest.replace(/[\s,|/\-–:;]+/g, " ").trim();
  if (remainder) rows.unshift([rows.length ? "Course" : "Details", remainder]);

  return rows;
}

const DETAIL_ORDER = [
  /^name$/i,
  /^(id|student id|enrol)/i,
  /^course/i,
  /^sem/i,
  /^div/i,
  /^subject/i,
];

function sortDetailRows(rows) {
  const rank = (label) => {
    const index = DETAIL_ORDER.findIndex((pattern) => pattern.test(label));
    return index === -1 ? DETAIL_ORDER.length : index;
  };

  return rows
    .map((row, position) => ({ row, position }))
    .sort((a, b) => rank(a.row[0]) - rank(b.row[0]) || a.position - b.position)
    .map(({ row }) => row);
}

export async function generateNotebookPdf(
  notebook,
  {
    fileName = "notebook",
    title = "",
    showCellLabels = true,
    showExecutionCounts = true,
    includeSamples = true,
    highlightCode = true,
  } = {},
) {
  if (!notebook || !Array.isArray(notebook.cells)) {
    throw new Error("Invalid Jupyter Notebook.");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 42;
  const freshPageHeight = bottomLimit - margin;

  const QUESTION_SIZE = 10.5;
  const QUESTION_LINE_HEIGHT = 13.5;
  const BODY_SIZE = 10;
  const BODY_LINE_HEIGHT = 13;
  const CODE_SIZE = 9.1;
  const CODE_LINE_HEIGHT = 11.2;
  const BOX_PADDING_X = 8;
  const BOX_PADDING_Y = 7;
  const LABEL_HEIGHT = 12;
  const SECTION_GAP = 6;
  const QUESTION_GAP = 10;

  const KIND_STYLE = {
    code: { label: [35, 90, 175], fill: [249, 250, 251] },
    output: { label: [25, 125, 70], fill: [246, 251, 247] },
    sample: { label: [110, 70, 160], fill: [250, 248, 253] },
  };

  let y = margin;

  const newPage = () => {
    pdf.addPage();
    y = margin;
  };

  const ensureSpace = (height = 20) => {
    if (y + height > bottomLimit) newPage();
  };

  /* ---------- proportional text ---------- */

  const wrapText = ({
    text,
    font = "helvetica",
    style = "normal",
    size = BODY_SIZE,
    maxWidth = contentWidth,
  }) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);

    const result = [];
    toPdfSafeText(fixCommonEncoding(String(text || "")))
      .replace(/\r/g, "")
      .split("\n")
      .forEach((sourceLine) => {
        if (sourceLine === "") result.push("");
        else result.push(...pdf.splitTextToSize(sourceLine, maxWidth));
      });

    return result.length ? result : [""];
  };

  const addText = ({
    text,
    font = "helvetica",
    style = "normal",
    size = BODY_SIZE,
    lineHeight = BODY_LINE_HEIGHT,
    indent = 0,
    align = "left",
    bullet = false,
  }) => {
    if (!String(text || "").trim()) return;

    const lines = wrapText({
      text,
      font,
      style,
      size,
      maxWidth: contentWidth - indent,
    });

    pdf.setFont(font, style);
    pdf.setFontSize(size);

    lines.forEach((line, index) => {
      ensureSpace(lineHeight);

      if (align === "center") {
        pdf.text(line, pageWidth / 2, y, { align: "center" });
      } else {
        if (bullet && index === 0) pdf.text("•", margin + indent - 9, y);
        pdf.text(line, margin + indent, y);
      }

      y += lineHeight;
    });
  };

  /* ---------- monospaced boxes (code / output / samples) ---------- */

  pdf.setFont("courier", "normal");
  pdf.setFontSize(CODE_SIZE);
  const charWidth = pdf.getTextWidth("M");
  const maxChars = Math.max(
    20,
    Math.floor((contentWidth - BOX_PADDING_X * 2) / charWidth),
  );

  // Character-based wrapping keeps the code's indentation exactly as written.
  const wrapMono = (text) => {
    const result = [];

    toPdfSafeText(fixCommonEncoding(String(text || "")))
      .replace(/\r/g, "")
      .split("\n")
      .forEach((line) => {
        if (line.length <= maxChars) {
          result.push(line);
          return;
        }

        const indent = (line.match(/^\s*/) || [""])[0];
        const prefix = indent.length + 2 < maxChars / 2 ? `${indent}  ` : "";
        const room = maxChars - prefix.length;

        result.push(line.slice(0, maxChars));
        for (let pos = maxChars; pos < line.length; pos += room) {
          result.push(prefix + line.slice(pos, pos + room));
        }
      });

    return result.length ? result : [""];
  };

  const measureBox = (text) => {
    const lines = wrapMono(text);
    return {
      lines,
      height: lines.length * CODE_LINE_HEIGHT + BOX_PADDING_Y * 2,
    };
  };

  const drawLabel = (label, kind = "code") => {
    // Baseline sits 7pt below the current position so the label never touches
    // the box above it, and 5pt above the box it belongs to.
    y += 7;
    pdf.setTextColor(...KIND_STYLE[kind].label);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.8);
    pdf.text(toPdfSafeText(label), margin, y);
    pdf.setTextColor(0, 0, 0);
    y += LABEL_HEIGHT - 7;
  };

  const drawBoxLines = (lines, kind, colour, tokenState) => {
    const boxHeight = lines.length * CODE_LINE_HEIGHT + BOX_PADDING_Y * 2;

    pdf.setDrawColor(210, 214, 220);
    pdf.setFillColor(...KIND_STYLE[kind].fill);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, "FD");

    pdf.setFont("courier", "normal");
    pdf.setFontSize(CODE_SIZE);

    let textY = y + BOX_PADDING_Y + CODE_LINE_HEIGHT - 2;

    lines.forEach((line) => {
      if (colour) {
        let x = margin + BOX_PADDING_X;

        tokenizePython(line, tokenState).forEach((token) => {
          pdf.setTextColor(...token.color);
          pdf.text(token.text, x, textY);
          x += token.text.length * charWidth;
        });

        pdf.setTextColor(0, 0, 0);
      } else {
        pdf.text(line, margin + BOX_PADDING_X, textY);
      }

      textY += CODE_LINE_HEIGHT;
    });

    y += boxHeight;
  };

  const drawLabeledTextBox = ({ label, text, kind = "code" }) => {
    if (!String(text || "").trim()) return;

    const measurement = measureBox(text);
    const colour = highlightCode && kind === "code";
    const tokenState = { triple: null };
    const labelHeight = label ? LABEL_HEIGHT : 0;
    const completeHeight = labelHeight + measurement.height + SECTION_GAP;

    // Keep label + whole box together whenever it fits on one page.
    if (completeHeight <= freshPageHeight && y + completeHeight > bottomLimit) {
      newPage();
    }

    if (completeHeight > freshPageHeight) {
      // Taller than a page: split cleanly across pages.
      const remaining = [...measurement.lines];
      let firstPart = true;

      while (remaining.length) {
        if (
          y + LABEL_HEIGHT + BOX_PADDING_Y * 2 + CODE_LINE_HEIGHT >
          bottomLimit
        ) {
          newPage();
        }

        if (label) drawLabel(firstPart ? label : `${label} (continued)`, kind);

        const maxLines = Math.max(
          1,
          Math.floor((bottomLimit - y - BOX_PADDING_Y * 2) / CODE_LINE_HEIGHT),
        );

        drawBoxLines(remaining.splice(0, maxLines), kind, colour, tokenState);

        if (remaining.length) newPage();
        else y += SECTION_GAP;

        firstPart = false;
      }

      return;
    }

    // Never leave only a label at the bottom of a page.
    if (y + labelHeight + BOX_PADDING_Y * 2 + CODE_LINE_HEIGHT > bottomLimit) {
      newPage();
    }

    if (label) drawLabel(label, kind);
    drawBoxLines(measurement.lines, kind, colour, tokenState);
    y += SECTION_GAP;
  };

  const hasCount = (cell) =>
    showExecutionCounts &&
    cell.execution_count !== null &&
    cell.execution_count !== undefined;

  const getCodeLabel = (cell) =>
    hasCount(cell) ? `In [${cell.execution_count}]:` : "Code";

  const getOutputLabel = (cell) =>
    hasCount(cell) ? `Out [${cell.execution_count}]:` : "Output";

  /* ---------- markdown cells -> draw operations ---------- */

  const buildOps = (blocks, isQuestion) =>
    blocks
      .map((block, index) => {
        const lead = isQuestion && index === 0;

        const textOp = (props) => {
          const lines = wrapText({
            ...props,
            maxWidth: contentWidth - (props.indent || 0),
          });
          return {
            kind: "text",
            ...props,
            height: lines.length * props.lineHeight + (props.after || 0),
          };
        };

        if (block.type === "sample") {
          if (!includeSamples) return null;

          return {
            kind: "box",
            label: block.label,
            text: block.text,
            boxKind: "sample",
            height: LABEL_HEIGHT + measureBox(block.text).height + SECTION_GAP,
          };
        }

        if (block.type === "code") {
          return {
            kind: "box",
            label: "",
            text: block.text,
            boxKind: "code",
            height: measureBox(block.text).height + SECTION_GAP,
          };
        }

        if (block.type === "bullet") {
          return textOp({
            text: block.text,
            size: BODY_SIZE,
            lineHeight: BODY_LINE_HEIGHT,
            indent: 16 + block.depth * 14,
            bullet: true,
            after: 1,
          });
        }

        if (block.type === "heading") {
          const size = block.level <= 1 ? 15 : block.level === 2 ? 13 : 11.5;
          return textOp({
            text: block.text,
            style: "bold",
            size,
            lineHeight: size + 4,
            after: 4,
          });
        }

        return lead
          ? textOp({
              text: block.text,
              style: "bold",
              size: QUESTION_SIZE,
              lineHeight: QUESTION_LINE_HEIGHT,
              after: 4,
            })
          : textOp({
              text: block.text,
              size: BODY_SIZE,
              lineHeight: BODY_LINE_HEIGHT,
              after: 3,
            });
      })
      .filter(Boolean);

  const drawOps = (ops) => {
    ops.forEach((op) => {
      if (op.kind === "box") {
        drawLabeledTextBox({
          label: op.label,
          text: op.text,
          kind: op.boxKind,
        });
        return;
      }

      addText(op);
      y += op.after || 0;
    });
  };

  const estimateQuestionGroupHeight = (questionIndex, ops) => {
    let height = ops.reduce((sum, op) => sum + op.height, 0);
    const nextCell = notebook.cells[questionIndex + 1];

    if (nextCell?.cell_type === "code") {
      const code = fixCommonEncoding(sourceToText(nextCell.source));

      if (code.trim()) {
        height += LABEL_HEIGHT + measureBox(code).height + SECTION_GAP;

        (Array.isArray(nextCell.outputs) ? nextCell.outputs : []).forEach(
          (output) => {
            const text = outputText(output);
            if (text.trim()) {
              height += LABEL_HEIGHT + measureBox(text).height + SECTION_GAP;
            }
          },
        );
      }
    }

    return height + QUESTION_GAP;
  };

  /* ---------- title + student details ---------- */

  const intro = getIntroInfo(notebook);
  const heading = intro.heading || formatFallbackTitle(title);

  if (heading) {
    addText({
      text: heading,
      style: "bold",
      size: 18,
      lineHeight: 21,
      align: "center",
    });
    y += 8;
  }

  // "Name: ...", "ID: ..." lines become a bordered details table.
  const collectedRows = [];

  intro.detailLines.forEach((line) => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9 ./-]{0,28}?):\s*(.*)$/);

    if (match) {
      if (match[2].trim())
        collectedRows.push([match[1].trim(), match[2].trim()]);
    } else {
      collectedRows.push(...detailsFromFreeText(line));
    }
  });

  // One table for every detail, in a fixed order, without repeated labels.
  const seenLabels = new Set();
  const detailRows = sortDetailRows(collectedRows).filter(([label]) => {
    const key = label.toLowerCase();
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });

  if (detailRows.length) {
    const labelWidth = 120;
    pdf.setDrawColor(120, 120, 120);

    detailRows.forEach(([label, value]) => {
      const valueLines = wrapText({
        text: value,
        size: 10.5,
        maxWidth: contentWidth - labelWidth - 14,
      });
      const rowHeight = Math.max(22, valueLines.length * 14 + 10);

      ensureSpace(rowHeight);
      pdf.rect(margin, y, labelWidth, rowHeight);
      pdf.rect(margin + labelWidth, y, contentWidth - labelWidth, rowHeight);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.5);
      pdf.text(toPdfSafeText(label), margin + 7, y + 15);

      pdf.setFont("helvetica", "normal");
      valueLines.forEach((line, i) =>
        pdf.text(line, margin + labelWidth + 7, y + 15 + i * 14),
      );

      y += rowHeight;
    });

    y += 20;
  }

  const footerName =
    detailRows.find(([label]) => /^name$/i.test(label))?.[1] || "";
  const footerId =
    detailRows.find(([label]) => /^(id|student id|enrol)/i.test(label))?.[1] ||
    "";

  /* ---------- cells ---------- */

  const startIndex =
    intro.firstQuestionCellIndex >= 0 ? intro.firstQuestionCellIndex : 0;

  for (let index = startIndex; index < notebook.cells.length; index += 1) {
    const cell = notebook.cells[index];

    if (!cell || !["markdown", "code", "raw"].includes(cell.cell_type)) {
      continue;
    }

    if (cell.cell_type === "markdown") {
      const blocks = parseMarkdownBlocks(cell.source);
      if (!blocks.length) continue;

      const question = isQuestionText(markdownToPlainText(cell.source));
      const ops = buildOps(blocks, question);
      if (!ops.length) continue;

      if (question) {
        const groupHeight = estimateQuestionGroupHeight(index, ops);

        // Keep a whole question + answer together when it fits on one page.
        if (groupHeight <= freshPageHeight && y + groupHeight > bottomLimit) {
          newPage();
        } else {
          ensureSpace(
            Math.min(
              ops.reduce((sum, op) => sum + op.height, 0),
              160,
            ) +
              LABEL_HEIGHT +
              BOX_PADDING_Y * 2 +
              CODE_LINE_HEIGHT * 2,
          );
        }
      } else {
        ensureSpace(28);
      }

      if (question && y > margin + 1) y += 8;
      drawOps(ops);
      y += question ? 4 : 3;
      if (!question) y += 3;
      continue;
    }

    if (cell.cell_type === "raw") {
      const raw = fixCommonEncoding(sourceToText(cell.source));
      if (!raw.trim()) continue;

      drawLabeledTextBox({
        label: showCellLabels ? "Raw" : "Text",
        text: raw,
        kind: "code",
      });

      y += QUESTION_GAP;
      continue;
    }

    const code = fixCommonEncoding(sourceToText(cell.source));

    // Unanswered (empty) code cells are hidden completely.
    if (!code.trim()) continue;

    drawLabeledTextBox({
      label: getCodeLabel(cell),
      text: code,
      kind: "code",
    });

    for (const output of Array.isArray(cell.outputs) ? cell.outputs : []) {
      const text = outputText(output);
      const imageSrc = outputImage(output);

      if (!text.trim() && !imageSrc) continue;

      if (text.trim()) {
        drawLabeledTextBox({
          label: getOutputLabel(cell),
          text,
          kind: "output",
        });
      }

      if (imageSrc) {
        try {
          const image = await loadImage(imageSrc);
          const dimensions = getImageSize(
            image,
            contentWidth,
            Math.min(360, pageHeight * 0.44),
          );
          const imageBlockHeight =
            LABEL_HEIGHT + dimensions.height + SECTION_GAP;

          if (
            imageBlockHeight <= freshPageHeight &&
            y + imageBlockHeight > bottomLimit
          ) {
            newPage();
          }

          if (!text.trim()) drawLabel(getOutputLabel(cell), "output");

          ensureSpace(dimensions.height);

          const format = imageSrc.startsWith("data:image/jpeg")
            ? "JPEG"
            : "PNG";

          pdf.setDrawColor(210, 214, 220);
          pdf.rect(margin, y, dimensions.width, dimensions.height);
          pdf.addImage(
            imageSrc,
            format,
            margin,
            y,
            dimensions.width,
            dimensions.height,
          );

          y += dimensions.height + SECTION_GAP;
        } catch (error) {
          console.warn(error);
          addText({
            text: "[Image output could not be rendered]",
            style: "italic",
            size: 9,
            lineHeight: 12,
          });
        }
      }
    }

    y += QUESTION_GAP;
  }

  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setTextColor(85, 85, 85);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    if (footerName || footerId) {
      pdf.text(
        toPdfSafeText([footerName, footerId].filter(Boolean).join("  |  ")),
        margin,
        pageHeight - 18,
      );
    }

    pdf.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 18,
      {
        align: "right",
      },
    );
    pdf.setTextColor(0, 0, 0);
  }

  pdf.save(`${safeFileName(fileName)}.pdf`);
}
