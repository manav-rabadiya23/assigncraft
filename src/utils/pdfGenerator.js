import { jsPDF } from "jspdf";
import { createAssignmentBaseName } from "./fileName";
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

function drawQuestionTable(doc, question, index, y, details, options, state) {
  doc.setFont("times", "bold");
  doc.setFontSize(11);

  doc.text(`Question ${index + 1}`, MARGIN, y);

  y += 4;

  const labelWidth = 25;

  const questionLines = doc.splitTextToSize(
    question,
    CONTENT_WIDTH - labelWidth - 4,
  );

  const questionHeight = Math.max(12, questionLines.length * 5 + 5);

  const codeHeight = options.includeCode ? 34 : 0;

  const outputHeight = options.includeOutput ? 26 : 0;

  const customSections = (options.customAnswerSections || []).filter(
    (section) => section.enabled,
  );

  const customSectionHeight = 26;

  const totalHeight =
    questionHeight +
    codeHeight +
    outputHeight +
    customSections.length * customSectionHeight;

  y = ensureSpace(doc, y, totalHeight + 10, details, options, state);

  doc.setFont("times", "normal");
  doc.setFontSize(10);

  // Question
  doc.rect(MARGIN, y, labelWidth, questionHeight);

  doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, questionHeight);

  doc.setFont("times", "bold");

  doc.text(`Q-${index + 1}`, MARGIN + 2, y + 6);

  doc.setFont("times", "normal");

  doc.text(questionLines, MARGIN + labelWidth + 2, y + 6);

  y += questionHeight;

  // Code
  if (options.includeCode) {
    doc.rect(MARGIN, y, labelWidth, codeHeight);

    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, codeHeight);

    doc.setFont("times", "bold");

    doc.text("Code", MARGIN + 2, y + 6);

    y += codeHeight;
  }

  // Output
  if (options.includeOutput) {
    doc.rect(MARGIN, y, labelWidth, outputHeight);

    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, outputHeight);

    doc.setFont("times", "bold");

    doc.text("Output", MARGIN + 2, y + 6);

    y += outputHeight;
  }

  // Custom answer sections
  customSections.forEach((section) => {
    doc.rect(MARGIN, y, labelWidth, customSectionHeight);

    doc.rect(
      MARGIN + labelWidth,
      y,
      CONTENT_WIDTH - labelWidth,
      customSectionHeight,
    );

    doc.setFont("times", "bold");

    const labelLines = doc.splitTextToSize(section.label, labelWidth - 4);

    doc.text(labelLines, MARGIN + 2, y + 6);

    y += customSectionHeight;
  });

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
