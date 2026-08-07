import { jsPDF } from "jspdf";
import { createAssignmentBaseName } from "./fileName";
import { getSelectedDetailRows, getSelectedHeaderParts } from "./documentFields";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function addHeader(doc, details, options) {
  if (!options.showHeaderEveryPage) return 14;

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  const text = getSelectedHeaderParts(details, options).join(" | ");
  const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(wrapped, PAGE_WIDTH / 2, 9, { align: "center" });
  const lineY = 11 + wrapped.length * 3.5;
  doc.line(MARGIN, lineY, PAGE_WIDTH - MARGIN, lineY);
  return lineY + 5;
}

function addFooter(doc, options, pageNumber) {
  if (!options.showPageNumbers) return;
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.text(`Page ${pageNumber}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 7, { align: "center" });
}

function ensureSpace(doc, y, required, details, options, state) {
  const bottomLimit = options.showPageNumbers ? PAGE_HEIGHT - 14 : PAGE_HEIGHT - 10;

  if (y + required <= bottomLimit) return y;

  addFooter(doc, options, state.pageNumber);
  doc.addPage();
  state.pageNumber += 1;
  return addHeader(doc, details, options);
}

function drawDetailsTable(doc, details, options, y) {
  const rows = getSelectedDetailRows(details, options);

  const labelWidth = 52;
  const rowHeight = 8;

  doc.setFontSize(10);

  rows.forEach(([label, value]) => {
    doc.rect(MARGIN, y, labelWidth, rowHeight);
    doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, rowHeight);
    doc.setFont("times", "bold");
    doc.text(label, MARGIN + 2, y + 5.2);
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
  const questionLines = doc.splitTextToSize(question, CONTENT_WIDTH - labelWidth - 4);
  const questionHeight = Math.max(12, questionLines.length * 5 + 5);
  const codeHeight = 34;
  const outputHeight = 26;
  const totalHeight = questionHeight + codeHeight + outputHeight;

  y = ensureSpace(doc, y, totalHeight + 10, details, options, state);

  doc.setFontSize(10);
  doc.rect(MARGIN, y, labelWidth, questionHeight);
  doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, questionHeight);
  doc.setFont("times", "bold");
  doc.text(`Q-${index + 1}`, MARGIN + 2, y + 6);
  doc.setFont("times", "normal");
  doc.text(questionLines, MARGIN + labelWidth + 2, y + 6);
  y += questionHeight;

  doc.rect(MARGIN, y, labelWidth, codeHeight);
  doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, codeHeight);
  doc.setFont("times", "bold");
  doc.text("Code", MARGIN + 2, y + 6);
  y += codeHeight;

  doc.rect(MARGIN, y, labelWidth, outputHeight);
  doc.rect(MARGIN + labelWidth, y, CONTENT_WIDTH - labelWidth, outputHeight);
  doc.text("Output", MARGIN + 2, y + 6);
  y += outputHeight + 8;

  return y;
}

export function createAssignmentPdf({ details, questions, options }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const state = { pageNumber: 1 };
  let y = addHeader(doc, details, options);

  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.text(`ASSIGNMENT ${details.assignmentNumber}`, PAGE_WIDTH / 2, y + 4, {
    align: "center",
  });
  y += 11;

  doc.setFontSize(13);
  doc.text(details.subject || "", PAGE_WIDTH / 2, y, { align: "center" });
  y += 8;

  y = drawDetailsTable(doc, details, options, y);
  y += 10;

  questions
    .map((question) => question.trim())
    .filter(Boolean)
    .forEach((question, index) => {
      y = drawQuestionTable(doc, question, index, y, details, options, state);
    });

  addFooter(doc, options, state.pageNumber);
  return doc;
}

export function downloadAssignmentPdf(payload) {
  const doc = createAssignmentPdf(payload);
  doc.save(`${createAssignmentBaseName(payload.details)}.pdf`);
}

export function printAssignmentPdf(payload) {
  const doc = createAssignmentPdf(payload);
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank", "noopener,noreferrer");
}
