import { jsPDF } from "jspdf";
import { createAssignmentBaseName } from "./fileName";
import { parseQuestionBlock, splitBold } from "./questionFormat";
import { toPdfSafeText } from "./pdfText";
import {
  PT_TO_MM,
  getLineSpacing,
  getPartStyle,
  hexToRgb,
  lineHeightMm,
  pdfFontFor,
} from "./textStyles";
import {
  getSelectedDetailRows,
  getSelectedFooterParts,
  getSelectedHeaderParts,
} from "./documentFields";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function shouldShow(mode, pageNumber) {
  if (mode === "every") return true;
  if (mode === "first") return pageNumber === 1;
  return false;
}

function getHeaderText(details, options) {
  return getSelectedHeaderParts(details, options).join(" | ");
}

function getFooterText(details, options) {
  return getSelectedFooterParts(details, options).join(" | ");
}

/** Font family / style / size / colour of a text style on the PDF. */
function applyStyle(doc, style, { bold = false, size } = {}) {
  const { family, fontStyle } = pdfFontFor(style, bold);
  doc.setFont(family, fontStyle);
  doc.setFontSize(size ?? style.size);
  doc.setTextColor(...hexToRgb(style.color));
}

function drawUnderline(doc, x, baseline, width, style) {
  doc.setDrawColor(...hexToRgb(style.color));
  doc.setLineWidth(0.2);
  doc.line(x, baseline + 0.7, x + width, baseline + 0.7);
  doc.setDrawColor(0, 0, 0);
}

const ALIGN_X = {
  left: (x0) => x0,
  center: (x0, width) => x0 + width / 2,
  right: (x0, width) => x0 + width,
  justify: (x0) => x0,
};

function getHeaderHeight(doc, details, options) {
  if (options.headerMode === "none") {
    return 0;
  }

  const text = getHeaderText(details, options);

  if (!text) {
    return 0;
  }

  const style = getPartStyle(options, "headerFooter");
  applyStyle(doc, style);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

  return Math.max(14, 8 + lines.length * lineHeightMm(style.size));
}

function drawHeader(doc, details, options, pageNumber) {
  if (!shouldShow(options.headerMode, pageNumber)) {
    return;
  }

  const text = getHeaderText(details, options);

  if (!text) {
    return;
  }

  const style = getPartStyle(options, "headerFooter");
  applyStyle(doc, style);

  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

  doc.text(lines, PAGE_WIDTH / 2, 8, {
    align: "center",
  });

  const lineY = 6 + lines.length * lineHeightMm(style.size);

  doc.setDrawColor(0, 0, 0);
  doc.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY);
}

function drawFooter(doc, details, options, pageNumber) {
  const footerText = getFooterText(details, options);

  const showFooterDetails =
    shouldShow(options.footerMode, pageNumber) && Boolean(footerText);

  const showPageNumber = Boolean(options.showPageNumbers);

  if (!showFooterDetails && !showPageNumber) {
    return;
  }

  const parts = [];

  if (showFooterDetails) {
    parts.push(footerText);
  }

  if (showPageNumber) {
    parts.push(`Page ${pageNumber}`);
  }

  applyStyle(doc, getPartStyle(options, "headerFooter"));

  doc.text(parts.join("  |  "), PAGE_WIDTH / 2, PAGE_HEIGHT - 7, {
    align: "center",
  });
}

function getTopStart(doc, details, options, pageNumber) {
  const headerHeight = shouldShow(options.headerMode, pageNumber)
    ? getHeaderHeight(doc, details, options)
    : 0;

  return headerHeight > 0 ? Math.max(22, headerHeight) : 14;
}

function getBottomLimit(options) {
  const footerEnabled =
    options.footerMode !== "none" || options.showPageNumbers;

  return footerEnabled ? PAGE_HEIGHT - 20 : PAGE_HEIGHT - 10;
}

function ensureSpace(doc, y, requiredHeight, details, options, state) {
  const bottomLimit = getBottomLimit(options);

  if (y + requiredHeight <= bottomLimit) {
    return y;
  }

  doc.addPage();

  state.pageNumber += 1;

  return getTopStart(doc, details, options, state.pageNumber);
}

function drawDetailsTable(doc, details, options, y) {
  const rows = getSelectedDetailRows(details, options);

  if (!rows.length) {
    return y;
  }

  const style = getPartStyle(options, "details");
  const labelWidth = 52;
  const valueWidth = CONTENT_WIDTH - labelWidth;

  const rowHeight = Math.max(8, lineHeightMm(style.size) + 3.2);
  const baseline = rowHeight / 2 + style.size * PT_TO_MM * 0.33;

  rows.forEach(([label, value]) => {
    doc.setDrawColor(0, 0, 0);
    doc.rect(MARGIN, y, labelWidth, rowHeight);
    doc.rect(MARGIN + labelWidth, y, valueWidth, rowHeight);

    applyStyle(doc, style, { bold: true });
    doc.text(toPdfSafeText(String(label || "")), MARGIN + 2, y + baseline);

    applyStyle(doc, style);
    doc.text(
      toPdfSafeText(String(value || "")),
      MARGIN + labelWidth + 2,
      y + baseline,
    );

    y += rowHeight;
  });

  return y;
}

/**
 * Word-wraps text that mixes regular and **bold** pieces.
 * Returns lines; each line is a list of { text, bold } segments.
 */
function wrapRich(doc, text, maxWidth, style) {
  const words = [];

  splitBold(toPdfSafeText(text)).forEach((run) => {
    run.text
      .split(/(\s+)/)
      .filter(Boolean)
      .forEach((token) => words.push({ text: token, bold: run.bold }));
  });

  const measure = (token) => {
    applyStyle(doc, style, { bold: token.bold });
    return doc.getTextWidth(token.text);
  };

  const lines = [];
  let line = [];
  let width = 0;

  const pushLine = () => {
    while (line.length && !line[line.length - 1].text.trim()) line.pop(); // trailing spaces
    if (line.length) lines.push(line);
    line = [];
    width = 0;
  };

  words.forEach((token) => {
    const isSpace = !token.text.trim();
    const tokenWidth = measure(token);

    if (!isSpace && width + tokenWidth > maxWidth && line.length) pushLine();
    if (isSpace && !line.length) return; // no leading spaces on a wrapped line

    const last = line[line.length - 1];
    if (last && last.bold === token.bold) last.text += token.text;
    else line.push({ text: token.text, bold: token.bold });

    width += tokenWidth;
  });

  pushLine();
  return lines.length ? lines : [[{ text: "", bold: false }]];
}

/** All lines of one question cell, each with its own style and line height. */
function buildQuestionLines(doc, question, options, maxWidth) {
  const { statement, sections } = parseQuestionBlock(question);
  const lines = [];

  const questionStyle = getPartStyle(options, "question");
  const labelStyle = getPartStyle(options, "sampleLabel");
  const sampleStyle = getPartStyle(options, "sample");
  const spacing = getLineSpacing(options);

  const pushPlain = (text, style, { indent = 0, gap = 0 } = {}) => {
    applyStyle(doc, style);

    doc
      .splitTextToSize(toPdfSafeText(text), maxWidth - indent)
      .forEach((piece, index) =>
        lines.push({
          text: piece,
          style,
          indent:
            index === 0 ? indent : indent + (/^[•-]\s/.test(text) ? 3 : 0),
          gap: index === 0 ? gap : 0,
          lh: lineHeightMm(style.size, spacing),
        }),
      );
  };

  statement.forEach((line, index) => {
    const isSubBullet = /^◦\s/.test(line);
    const isListLine = /^(?:[•◦]|\(?\d{1,2}[.)]|\(?[a-z][.)])\s/.test(line);
    const indent = isSubBullet ? 8 : isListLine ? 4 : 0;

    const wrapped = wrapRich(doc, line, maxWidth - indent, questionStyle);

    wrapped.forEach((segments, pieceIndex) =>
      lines.push({
        segments,
        text: segments.map((segment) => segment.text).join(""),
        style: questionStyle,
        indent:
          pieceIndex === 0 ? indent : indent + (/^[•-]\s/.test(line) ? 3 : 0),
        gap: pieceIndex === 0 ? (index === 0 ? 0 : 0.8) : 0,
        lh: lineHeightMm(questionStyle.size, spacing),
        last: pieceIndex === wrapped.length - 1,
      }),
    );
  });

  if (options.includeSamples !== false) {
    sections.forEach((section) => {
      pushPlain(
        `${section.label}:`,
        { ...labelStyle, bold: labelStyle.bold },
        { gap: 2.5 },
      );
      section.lines.forEach((line) =>
        pushPlain(line, sampleStyle, { indent: 3 }),
      );
    });
  }

  return lines.length
    ? lines
    : [
        {
          text: "",
          style: questionStyle,
          indent: 0,
          gap: 0,
          lh: lineHeightMm(questionStyle.size, spacing),
        },
      ];
}

function lineHeightOf(line) {
  return line.gap + line.lh;
}

/** Draws one wrapped line with the chosen alignment (left/center/right/justify). */
function drawQuestionLine(doc, line, x0, baseline, maxWidth) {
  const style = line.style;

  if (!line.segments) {
    applyStyle(doc, style);
    doc.text(line.text, x0, baseline);
    if (style.underline && line.text.trim()) {
      drawUnderline(doc, x0, baseline, doc.getTextWidth(line.text), style);
    }
    return;
  }

  const measured = line.segments.map((segment) => {
    applyStyle(doc, style, { bold: segment.bold });
    return { ...segment, width: doc.getTextWidth(segment.text) };
  });
  const total = measured.reduce((sum, segment) => sum + segment.width, 0);

  const spaces = line.segments.reduce(
    (count, segment) => count + (segment.text.match(/ /g) || []).length,
    0,
  );
  const extra =
    style.align === "justify" && !line.last && spaces > 0
      ? Math.min((maxWidth - total) / spaces, 3)
      : 0;

  const width = total + extra * spaces;
  let x =
    style.align === "center"
      ? x0 + (maxWidth - width) / 2
      : style.align === "right"
        ? x0 + maxWidth - width
        : x0;
  const startX = x;

  measured.forEach((segment) => {
    applyStyle(doc, style, { bold: segment.bold });

    if (extra) {
      segment.text.split(/( )/).forEach((token) => {
        if (!token) return;
        doc.text(token, x, baseline);
        x += doc.getTextWidth(token) + (token === " " ? extra : 0);
      });
    } else {
      doc.text(segment.text, x, baseline);
      x += segment.width;
    }
  });

  if (style.underline && total > 0) {
    drawUnderline(doc, startX, baseline, width, style);
  }
}

function drawQuestionTable(doc, question, index, y, details, options, state) {
  const labelWidth = 25;
  const textWidth = CONTENT_WIDTH - labelWidth - 6;
  const labelStyle = getPartStyle(options, "labels");
  const headingStyle = { ...labelStyle, size: labelStyle.size + 1 };
  const pad = 2.2;
  const labelBaseline = pad + labelStyle.size * PT_TO_MM * 0.85;

  applyStyle(doc, headingStyle);
  y = ensureSpace(doc, y, 30, details, options, state);
  doc.text(`Question ${index + 1}`, MARGIN, y);
  if (headingStyle.underline) {
    drawUnderline(
      doc,
      MARGIN,
      y,
      doc.getTextWidth(`Question ${index + 1}`),
      headingStyle,
    );
  }
  y += 2.5 + headingStyle.size * PT_TO_MM * 0.2;

  const questionLines = buildQuestionLines(doc, question, options, textWidth);

  // The question cell may need more than one page: draw it in page-sized slices.
  let cursor = 0;
  let firstSlice = true;

  while (cursor < questionLines.length) {
    y = ensureSpace(doc, y, 26, details, options, state);
    const available = getBottomLimit(options) - y - 4;

    let used = pad * 2;
    let end = cursor;
    while (
      end < questionLines.length &&
      used + lineHeightOf(questionLines[end]) <= available
    ) {
      used += lineHeightOf(questionLines[end]);
      end += 1;
    }
    if (end === cursor) {
      used += lineHeightOf(questionLines[end]);
      end += 1; // always make progress
    }

    const sliceHeight = Math.max(12, used);

    doc.setDrawColor(0, 0, 0);
    doc.rect(MARGIN, y, labelWidth, sliceHeight);
    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, sliceHeight);

    if (firstSlice) {
      applyStyle(doc, labelStyle);
      doc.text(`Q-${index + 1}`, MARGIN + 2, y + labelBaseline);
    }

    let cursorY = y + pad;
    for (let i = cursor; i < end; i += 1) {
      const line = questionLines[i];
      cursorY += line.gap;
      const baseline = cursorY + line.style.size * PT_TO_MM * 0.85;

      drawQuestionLine(
        doc,
        line,
        MARGIN + labelWidth + 3 + line.indent,
        baseline,
        textWidth - line.indent,
      );

      cursorY += line.lh;
    }

    y += sliceHeight;
    cursor = end;
    firstSlice = false;

    if (cursor < questionLines.length) {
      doc.addPage();
      state.pageNumber += 1;
      y = getTopStart(doc, details, options, state.pageNumber);
    }
  }

  const answerRow = (label, height) => {
    y = ensureSpace(doc, y, height, details, options, state);

    doc.setDrawColor(0, 0, 0);
    doc.rect(MARGIN, y, labelWidth, height);
    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, height);

    applyStyle(doc, labelStyle);
    doc.text(
      doc.splitTextToSize(label, labelWidth - 4),
      MARGIN + 2,
      y + labelBaseline,
    );

    y += height;
  };

  if (options.includeCode) answerRow("Code", 34);
  if (options.includeOutput) answerRow("Output", 26);

  (options.customAnswerSections || [])
    .filter((section) => section.enabled)
    .forEach((section) => answerRow(section.label, 26));

  return y + 8;
}

export function createAssignmentPdf({ details, questions, options }) {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  const state = {
    pageNumber: 1,
  };

  let y = getTopStart(doc, details, options, 1);

  // Assignment title + subject
  const titleStyle = getPartStyle(options, "title");
  const subjectStyle = {
    ...titleStyle,
    size: Math.max(10, titleStyle.size - 4),
  };
  const titleX = ALIGN_X[titleStyle.align](MARGIN, CONTENT_WIDTH);
  const titleAlign = titleStyle.align === "justify" ? "left" : titleStyle.align;

  const drawTitleLine = (text, style, baseline) => {
    applyStyle(doc, style);
    doc.text(text, titleX, baseline, { align: titleAlign });

    if (style.underline && text.trim()) {
      const width = doc.getTextWidth(text);
      const startX =
        titleAlign === "center"
          ? titleX - width / 2
          : titleAlign === "right"
            ? titleX - width
            : titleX;
      drawUnderline(doc, startX, baseline, width, style);
    }
  };

  drawTitleLine(
    `ASSIGNMENT ${details.assignmentNumber || ""}`,
    titleStyle,
    y + 4,
  );

  y += lineHeightMm(titleStyle.size) + 3.5;

  drawTitleLine(toPdfSafeText(details.subject || ""), subjectStyle, y);

  y += lineHeightMm(subjectStyle.size) + 2.5;

  // Details
  y = drawDetailsTable(doc, details, options, y);

  if (getSelectedDetailRows(details, options).length) {
    y += 10;
  }

  // Questions
  const validQuestions = questions
    .map((question) => question.trim())
    .filter(Boolean);

  validQuestions.forEach((question, index) => {
    y = drawQuestionTable(doc, question, index, y, details, options, state);
  });

  // Draw header/footer after all pages
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    drawHeader(doc, details, options, page);

    drawFooter(doc, details, options, page);
  }

  return doc;
}

export function downloadAssignmentPdf(payload) {
  const doc = createAssignmentPdf(payload);

  doc.save(`${createAssignmentBaseName(payload.details)}.pdf`);
}

export function printAssignmentPdf(payload) {
  const doc = createAssignmentPdf(payload);

  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);

    throw new Error(
      "The browser blocked the print window. Please allow pop-ups for this site.",
    );
  }

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Assignment</title>
        <style>
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #ffffff;
          }

          iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
          }
        </style>
      </head>

      <body>
        <iframe
          id="pdf-frame"
          src="${blobUrl}"
          title="Assignment PDF"
        ></iframe>

        <script>
          const frame =
            document.getElementById("pdf-frame");

          frame.addEventListener("load", () => {
            setTimeout(() => {
              frame.focus();
              frame.contentWindow.print();
            }, 800);
          });
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
}
