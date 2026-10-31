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
import { parseQuestionBlock, splitBold } from "./questionFormat";
import {
  getSelectedDetailRows,
  getSelectedFooterParts,
  getSelectedHeaderParts,
} from "./documentFields";

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
      spacing: {
        before: 80,
        after: 80,
      },
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
          new TextRun({
            text: " ",
            size: 24,
            font: "Times New Roman",
          }),
        ],
      }),
    );
  }

  return new TableCell({
    width: {
      size: width,
      type: WidthType.PERCENTAGE,
    },
    margins: {
      top: 100,
      bottom: 100,
      left: 120,
      right: 120,
    },
    children: paragraphs,
  });
}

const BODY_FONT = "Times New Roman";
const CODE_FONT = "Courier New";

/** Indent for "• item", "◦ sub-item" and "1. step" lines of a statement. */
function getListIndent(line) {
  if (/^◦\s/.test(line)) return { left: 720, hanging: 240 };
  if (/^•\s/.test(line)) return { left: 360, hanging: 240 };
  if (/^\(?\d{1,2}[.)]\s/.test(line) || /^\(?[a-z][.)]\s/.test(line)) {
    return { left: 360, hanging: 300 };
  }
  return null;
}

/**
 * One question -> the paragraphs inside its cell:
 * statement lines, then (optionally) Sample Input / Expected Output blocks
 * with bold labels and monospaced values.
 */
function createQuestionParagraphs(question, options) {
  const { statement, sections } = parseQuestionBlock(question);
  const paragraphs = [];

  statement.forEach((line, index) => {
    const indent = getListIndent(line);

    paragraphs.push(
      new Paragraph({
        spacing: { before: index === 0 ? 80 : 40, after: 40 },
        indent: indent
          ? { left: indent.left, hanging: indent.hanging }
          : undefined,
        children: splitBold(line).map(
          (run) =>
            new TextRun({
              text: run.text,
              bold: run.bold,
              size: 24,
              font: BODY_FONT,
            }),
        ),
      }),
    );
  });

  if (options.includeSamples !== false) {
    sections.forEach((section) => {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 30 },
          keepNext: true,
          children: [
            new TextRun({
              text: `${section.label}:`,
              bold: true,
              size: 22,
              font: BODY_FONT,
            }),
          ],
        }),
      );

      section.lines.forEach((line) => {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 0, after: 0 },
            indent: { left: 240 },
            children: [new TextRun({ text: line, size: 21, font: CODE_FONT })],
          }),
        );
      });
    });
  }

  return paragraphs.length
    ? paragraphs
    : [new Paragraph({ children: [new TextRun({ text: "", size: 24 })] })];
}

function createRichCell({ paragraphs, width = 80 }) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: paragraphs,
  });
}

/** The details table, or nothing when no table row is selected (an empty table is invalid). */
function createDetailsBlock(details, options) {
  return getSelectedDetailRows(details, options).length
    ? [createDetailsTable(details, options)]
    : [];
}

function createDetailsTable(details, options) {
  const rows = getSelectedDetailRows(details, options);

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: [2808, 6552],
    borders: createTableBorders(),
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            createCell({
              text: label,
              width: 30,
              bold: true,
            }),
            createCell({
              text: value,
              width: 70,
            }),
          ],
        }),
    ),
  });
}

function createQuestionTable(question, index, options) {
  const rows = [
    new TableRow({
      children: [
        createCell({
          text: `Q-${index + 1}`,
          width: 20,
          bold: true,
        }),
        createRichCell({
          paragraphs: createQuestionParagraphs(question, options),
          width: 80,
        }),
      ],
    }),
  ];

  if (options.includeCode) {
    rows.push(
      new TableRow({
        children: [
          createCell({
            text: "Code",
            width: 20,
            bold: true,
          }),
          createCell({
            width: 80,
            blankLines: 8,
          }),
        ],
      }),
    );
  }

  if (options.includeOutput) {
    rows.push(
      new TableRow({
        children: [
          createCell({
            text: "Output",
            width: 20,
            bold: true,
          }),
          createCell({
            width: 80,
            blankLines: 6,
          }),
        ],
      }),
    );
  }

  (options.customAnswerSections || [])
    .filter((section) => section.enabled)
    .forEach((section) => {
      rows.push(
        new TableRow({
          children: [
            createCell({
              text: section.label,
              width: 20,
              bold: true,
            }),
            createCell({
              width: 80,
              blankLines: 6,
            }),
          ],
        }),
      );
    });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    columnWidths: [1872, 7488],
    borders: createTableBorders(),
    rows,
  });
}

function createHeader(details, options) {
  if (options.headerMode === "none") {
    return undefined;
  }

  const values = getSelectedHeaderParts(details, options);

  if (!values.length) {
    return undefined;
  }

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 80,
        },
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

function createFooter(details, options) {
  const values = getSelectedFooterParts(details, options);

  const showDetails = options.footerMode !== "none" && values.length > 0;

  const showPageNumbers = Boolean(options.showPageNumbers);

  if (!showDetails && !showPageNumbers) {
    return undefined;
  }

  const children = [];

  if (showDetails) {
    children.push(
      new TextRun({
        text: values.join(" | "),
        size: 18,
        font: "Times New Roman",
      }),
    );
  }

  if (showPageNumbers) {
    if (children.length) {
      children.push(
        new TextRun({
          text: "  |  ",
          size: 18,
          font: "Times New Roman",
        }),
      );
    }

    children.push(
      new TextRun({
        text: "Page ",
        size: 18,
        font: "Times New Roman",
      }),
      new TextRun({
        children: [PageNumber.CURRENT],
        size: 18,
        font: "Times New Roman",
      }),
    );
  }

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children,
      }),
    ],
  });
}

export async function generateWordAssignment({ details, questions, options }) {
  const validQuestions = questions
    .map((question) => question.trim())
    .filter(Boolean);

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 120,
      },
      children: [
        new TextRun({
          text: `ASSIGNMENT ${details.assignmentNumber || ""}`,
          bold: true,
          size: 34,
          font: "Times New Roman",
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 300,
      },
      children: [
        new TextRun({
          text: details.subject || "",
          bold: true,
          size: 26,
          font: "Times New Roman",
        }),
      ],
    }),

    ...createDetailsBlock(details, options),

    new Paragraph({
      spacing: {
        after: 180,
      },
      children: [
        new TextRun({
          text: " ",
        }),
      ],
    }),
  ];

  validQuestions.forEach((question, index) => {
    children.push(
      new Paragraph({
        spacing: {
          before: 180,
          after: 100,
        },
        children: [
          new TextRun({
            text: `Question ${index + 1}`,
            bold: true,
            size: 26,
            font: "Times New Roman",
          }),
        ],
      }),

      createQuestionTable(question, index, options),

      new Paragraph({
        spacing: {
          after: 220,
        },
        children: [
          new TextRun({
            text: " ",
          }),
        ],
      }),
    );
  });

  const header = createHeader(details, options);

  const footer = createFooter(details, options);

  const useFirstPageHeader = options.headerMode === "first" && Boolean(header);

  const useEveryPageHeader = options.headerMode === "every" && Boolean(header);

  const useFirstPageFooter = options.footerMode === "first" && Boolean(footer);

  const useEveryPageFooter = options.footerMode === "every" && Boolean(footer);

  /*
   * Page number without footer details:
   * keep it available on every page.
   */
  const pageNumberOnly =
    options.showPageNumbers && !useFirstPageFooter && !useEveryPageFooter;

  const assignmentDocument = new Document({
    sections: [
      {
        properties: {
          titlePage: Boolean(useFirstPageHeader || useFirstPageFooter),

          page: {
            margin: {
              top: useEveryPageHeader || useFirstPageHeader ? 900 : 720,

              right: 720,

              bottom:
                useEveryPageFooter || useFirstPageFooter || pageNumberOnly
                  ? 900
                  : 720,

              left: 720,
            },
          },
        },

        headers: useEveryPageHeader
          ? {
              default: header,
            }
          : useFirstPageHeader
            ? {
                first: header,
              }
            : undefined,

        footers: useEveryPageFooter
          ? {
              default: footer,
            }
          : useFirstPageFooter
            ? {
                first: footer,
              }
            : pageNumberOnly
              ? {
                  default: footer,
                }
              : undefined,

        children,
      },
    ],
  });

  const blob = await Packer.toBlob(assignmentDocument);

  saveAs(blob, `${createAssignmentBaseName(details)}.docx`);
}
