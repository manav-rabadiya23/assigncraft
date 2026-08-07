import { saveAs } from "file-saver";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { createAssignmentBaseName } from "./fileName";
import { getSelectedDetailRows, getSelectedHeaderParts } from "./documentFields";

function createBorder() {
  return {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "808080",
  };
}

function createTableBorders() {
  const border = createBorder();
  return {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };
}

function createCell({ text = "", width = 80, bold = false, blankLines = 0 }) {
  const paragraphs = [
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text,
          bold,
          size: 24,
          font: "Times New Roman",
        }),
      ],
    }),
  ];

  for (let index = 0; index < blankLines; index += 1) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: " ", size: 24, font: "Times New Roman" }),
        ],
      }),
    );
  }

  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: paragraphs,
  });
}

function createDetailsTable(details, options) {
  const detailRows = getSelectedDetailRows(details, options);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: detailRows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            createCell({ text: label, width: 30, bold: true }),
            createCell({ text: value, width: 70 }),
          ],
        }),
    ),
  });
}

function createQuestionTable(question, index) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        children: [
          createCell({ text: `Q-${index + 1}`, width: 20, bold: true }),
          createCell({ text: question, width: 80 }),
        ],
      }),
      new TableRow({
        children: [
          createCell({ text: "Code", width: 20, bold: true }),
          createCell({ text: "", width: 80, blankLines: 8 }),
        ],
      }),
      new TableRow({
        children: [
          createCell({ text: "Output", width: 20, bold: true }),
          createCell({ text: "", width: 80, blankLines: 6 }),
        ],
      }),
    ],
  });
}

function createRepeatingHeader(details, options) {
  if (!options.showHeaderEveryPage) return undefined;

  const values = getSelectedHeaderParts(details, options);

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: values.join(" | "),
            size: 18,
            font: "Times New Roman",
          }),
        ],
      }),
    ],
  });
}

function createFooter(options) {
  if (!options.showPageNumbers) return undefined;

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Page ", size: 18, font: "Times New Roman" }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            font: "Times New Roman",
          }),
        ],
      }),
    ],
  });
}

export async function generateWordAssignment({ details, questions, options }) {
  const validQuestions = questions.map((question) => question.trim()).filter(Boolean);

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `ASSIGNMENT ${details.assignmentNumber}`,
          bold: true,
          size: 34,
          font: "Times New Roman",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: details.subject,
          bold: true,
          size: 26,
          font: "Times New Roman",
        }),
      ],
    }),
    createDetailsTable(details, options),
    new Paragraph({
      spacing: { after: 180 },
      children: [new TextRun({ text: " " })],
    }),
  ];

  validQuestions.forEach((question, index) => {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 100 },
        children: [
          new TextRun({
            text: `Question ${index + 1}`,
            bold: true,
            size: 26,
            font: "Times New Roman",
          }),
        ],
      }),
      createQuestionTable(question, index),
      new Paragraph({
        spacing: { after: 220 },
        children: [new TextRun({ text: " " })],
      }),
    );
  });

  const header = createRepeatingHeader(details, options);
  const footer = createFooter(options);

  const assignmentDocument = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: options.showHeaderEveryPage ? 900 : 720,
              right: 720,
              bottom: options.showPageNumbers ? 900 : 720,
              left: 720,
            },
          },
        },
        headers: header ? { default: header } : undefined,
        footers: footer ? { default: footer } : undefined,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(assignmentDocument);
  saveAs(blob, `${createAssignmentBaseName(details)}.docx`);
}
