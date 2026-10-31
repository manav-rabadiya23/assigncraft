import { jsPDF } from "jspdf";
import { createAssignmentBaseName } from "./fileName";
import { parseQuestionBlock, splitBold } from "./questionFormat";
import { toPdfSafeText } from "./pdfText";
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

function getHeaderHeight(doc, details, options) {
  if (options.headerMode === "none") {
    return 0;
  }

  const text = getHeaderText(details, options);

  if (!text) {
    return 0;
  }

  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

  return Math.max(14, 11 + lines.length * 3.5);
}

function drawHeader(doc, details, options, pageNumber) {
  if (!shouldShow(options.headerMode, pageNumber)) {
    return;
  }

  const text = getHeaderText(details, options);

  if (!text) {
    return;
  }

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);

  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);

  doc.text(lines, PAGE_WIDTH / 2, 8, {
    align: "center",
  });

  const lineY = 10 + lines.length * 3.5;

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

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);

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

  const labelWidth = 52;
  const valueWidth = CONTENT_WIDTH - labelWidth;

  const rowHeight = 8;

  rows.forEach(([label, value]) => {
    doc.setFont("times", "bold");
    doc.setFontSize(10);

    doc.rect(MARGIN, y, labelWidth, rowHeight);

    doc.rect(MARGIN + labelWidth, y, valueWidth, rowHeight);

    doc.text(String(label || ""), MARGIN + 2, y + 5.2);

    doc.setFont("times", "normal");

    doc.text(String(value || ""), MARGIN + labelWidth + 2, y + 5.2);

    y += rowHeight;
  });

  return y;
}

const LINE_HEIGHT = { times: 4.8, courier: 4.2 };

/**
 * Word-wraps text that mixes regular and **bold** pieces.
 * Returns lines; each line is a list of { text, bold } segments.
 */
function wrapRich(doc, text, maxWidth, size) {
  const words = [];

  splitBold(toPdfSafeText(text)).forEach((run) => {
    run.text
      .split(/(\s+)/)
      .filter(Boolean)
      .forEach((token) => words.push({ text: token, bold: run.bold }));
  });

  const measure = (token) => {
    doc.setFont("times", token.bold ? "bold" : "normal");
    doc.setFontSize(size);
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

/** Wrapped, styled lines for one question cell (statement + optional samples). */
function buildQuestionLines(doc, question, options, maxWidth) {
  const { statement, sections } = parseQuestionBlock(question);
  const lines = [];

  const push = (
    text,
    { font = "times", style = "normal", size = 10, indent = 0, gap = 0 },
  ) => {
    doc.setFont(font, style);
    doc.setFontSize(size);

    const wrapped = doc.splitTextToSize(toPdfSafeText(text), maxWidth - indent);
    wrapped.forEach((piece, index) =>
      lines.push({
        text: piece,
        font,
        style,
        size,
        indent: index === 0 ? indent : indent + (/^[•-]\s/.test(text) ? 3 : 0),
        gap: index === 0 ? gap : 0,
      }),
    );
  };

  statement.forEach((line, index) => {
    const isSubBullet = /^◦\s/.test(line);
    const isListLine = /^(?:[•◦]|\(?\d{1,2}[.)]|\(?[a-z][.)])\s/.test(line);
    const indent = isSubBullet ? 8 : isListLine ? 4 : 0;

    wrapRich(doc, line, maxWidth - indent, 10).forEach((segments, pieceIndex) =>
      lines.push({
        segments,
        text: segments.map((segment) => segment.text).join(""),
        font: "times",
        style: "normal",
        size: 10,
        indent:
          pieceIndex === 0 ? indent : indent + (/^[•-]\s/.test(line) ? 3 : 0),
        gap: pieceIndex === 0 ? (index === 0 ? 0 : 0.8) : 0,
      }),
    );
  });

  if (options.includeSamples !== false) {
    sections.forEach((section) => {
      push(`${section.label}:`, { style: "bold", size: 9.5, gap: 2.5 });
      section.lines.forEach((line) =>
        push(line, { font: "courier", size: 8.8, indent: 3 }),
      );
    });
  }

  return lines.length
    ? lines
    : [
        {
          text: "",
          font: "times",
          style: "normal",
          size: 10,
          indent: 0,
          gap: 0,
        },
      ];
}

function lineHeightOf(line) {
  return line.gap + (LINE_HEIGHT[line.font] || 4.8);
}

function drawQuestionTable(doc, question, index, y, details, options, state) {
  const labelWidth = 25;
  const textWidth = CONTENT_WIDTH - labelWidth - 6;

  doc.setFont("times", "bold");
  doc.setFontSize(11);
  y = ensureSpace(doc, y, 30, details, options, state);
  doc.text(`Question ${index + 1}`, MARGIN, y);
  y += 4;

  const questionLines = buildQuestionLines(doc, question, options, textWidth);

  // The question cell may need more than one page: draw it in page-sized slices.
  let cursor = 0;
  let firstSlice = true;

  while (cursor < questionLines.length) {
    y = ensureSpace(doc, y, 26, details, options, state);
    const available = getBottomLimit(options) - y - 4;

    let used = 5;
    let end = cursor;
    while (
      end < questionLines.length &&
      used + lineHeightOf(questionLines[end]) <= available
    ) {
      used += lineHeightOf(questionLines[end]);
      end += 1;
    }
    if (end === cursor) end = cursor + 1; // always make progress

    const sliceHeight = Math.max(12, used + 2);

    doc.rect(MARGIN, y, labelWidth, sliceHeight);
    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, sliceHeight);

    if (firstSlice) {
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.text(`Q-${index + 1}`, MARGIN + 2, y + 6);
    }

    let textY = y + 5.6;
    for (let i = cursor; i < end; i += 1) {
      const line = questionLines[i];
      textY += line.gap;
      doc.setFontSize(line.size);

      if (line.segments) {
        let x = MARGIN + labelWidth + 3 + line.indent;
        line.segments.forEach((segment) => {
          doc.setFont(line.font, segment.bold ? "bold" : "normal");
          doc.text(segment.text, x, textY);
          x += doc.getTextWidth(segment.text);
        });
      } else {
        doc.setFont(line.font, line.style);
        doc.text(line.text, MARGIN + labelWidth + 3 + line.indent, textY);
      }

      textY += LINE_HEIGHT[line.font] || 4.8;
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

    doc.rect(MARGIN, y, labelWidth, height);
    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, height);

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(label, labelWidth - 4), MARGIN + 2, y + 6);

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

  // Assignment title
  doc.setFont("times", "bold");

  doc.setFontSize(17);

  doc.text(
    `ASSIGNMENT ${details.assignmentNumber || ""}`,
    PAGE_WIDTH / 2,
    y + 4,
    {
      align: "center",
    },
  );

  y += 11;

  // Subject
  doc.setFontSize(13);

  doc.text(details.subject || "", PAGE_WIDTH / 2, y, {
    align: "center",
  });

  y += 8;

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
