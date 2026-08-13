import { jsPDF } from "jspdf";

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

function markdownToPlainText(source) {
  return fixCommonEncoding(decodeHtml(sourceToText(source)))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

export async function generateNotebookPdf(
  notebook,
  {
    fileName = "notebook",
    title = "",
    showCellLabels = true,
    showExecutionCounts = true,
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

  let y = margin;

  const newPage = () => {
    pdf.addPage();
    y = margin;
  };

  const ensureSpace = (height = 20) => {
    if (y + height > bottomLimit) {
      newPage();
    }
  };

  const wrapLines = ({
    text,
    font = "helvetica",
    style = "normal",
    size = BODY_SIZE,
    maxWidth = contentWidth,
  }) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);

    const value = fixCommonEncoding(String(text || "")).replace(/\r/g, "");
    const sourceLines = value.split("\n");
    const result = [];

    sourceLines.forEach((sourceLine) => {
      // Preserve only real blank lines from the notebook.
      if (sourceLine === "") {
        result.push("");
        return;
      }

      const wrapped = pdf.splitTextToSize(sourceLine, maxWidth);
      result.push(...wrapped);
    });

    return result.length ? result : [""];
  };

  const measureText = ({
    text,
    font = "helvetica",
    style = "normal",
    size = BODY_SIZE,
    lineHeight = BODY_LINE_HEIGHT,
    maxWidth = contentWidth,
  }) => {
    const lines = wrapLines({
      text,
      font,
      style,
      size,
      maxWidth,
    });

    return {
      lines,
      height: Math.max(lineHeight, lines.length * lineHeight),
    };
  };

  const measureTextBox = (text) => {
    const measured = measureText({
      text,
      font: "courier",
      style: "normal",
      size: CODE_SIZE,
      lineHeight: CODE_LINE_HEIGHT,
      maxWidth: contentWidth - BOX_PADDING_X * 2,
    });

    return {
      lines: measured.lines,
      height: measured.lines.length * CODE_LINE_HEIGHT + BOX_PADDING_Y * 2,
    };
  };

  const addPlainText = ({
    text,
    font = "helvetica",
    style = "normal",
    size = BODY_SIZE,
    lineHeight = BODY_LINE_HEIGHT,
    maxWidth = contentWidth,
    align = "left",
  }) => {
    if (!String(text || "").trim()) return;

    const measured = measureText({
      text,
      font,
      style,
      size,
      lineHeight,
      maxWidth,
    });

    pdf.setFont(font, style);
    pdf.setFontSize(size);

    measured.lines.forEach((line) => {
      ensureSpace(lineHeight);

      if (align === "center") {
        pdf.text(String(line), pageWidth / 2, y, { align: "center" });
      } else {
        pdf.text(String(line), margin, y);
      }

      y += lineHeight;
    });
  };

  const drawLabel = (label, kind = "code") => {
    if (kind === "output") {
      pdf.setTextColor(25, 125, 70);
    } else {
      pdf.setTextColor(35, 90, 175);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.8);
    pdf.text(label, margin, y);

    pdf.setTextColor(0, 0, 0);
    y += LABEL_HEIGHT;
  };

  const drawBoxLines = (lines) => {
    const boxHeight = lines.length * CODE_LINE_HEIGHT + BOX_PADDING_Y * 2;

    pdf.setDrawColor(210, 214, 220);
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, "FD");

    pdf.setFont("courier", "normal");
    pdf.setFontSize(CODE_SIZE);

    let textY = y + BOX_PADDING_Y + CODE_LINE_HEIGHT - 2;

    lines.forEach((line) => {
      pdf.text(String(line), margin + BOX_PADDING_X, textY);
      textY += CODE_LINE_HEIGHT;
    });

    y += boxHeight;
  };

  const drawLabeledTextBox = ({ label, text, kind = "code" }) => {
    const value = String(text || "");
    if (!value.trim()) return;

    const measurement = measureTextBox(value);
    const completeHeight = LABEL_HEIGHT + measurement.height + SECTION_GAP;

    // Keep label + whole box together whenever it fits on one page.
    if (completeHeight <= freshPageHeight && y + completeHeight > bottomLimit) {
      newPage();
    }

    // If the box itself is taller than a page, split it cleanly.
    if (completeHeight > freshPageHeight) {
      let remaining = [...measurement.lines];
      let firstPart = true;

      while (remaining.length) {
        const minimumNeeded =
          LABEL_HEIGHT + BOX_PADDING_Y * 2 + CODE_LINE_HEIGHT;

        if (y + minimumNeeded > bottomLimit) {
          newPage();
        }

        drawLabel(firstPart ? label : `${label} (continued)`, kind);

        const availableForBox = bottomLimit - y;
        const maxLines = Math.max(
          1,
          Math.floor((availableForBox - BOX_PADDING_Y * 2) / CODE_LINE_HEIGHT),
        );

        const pageLines = remaining.splice(0, maxLines);
        drawBoxLines(pageLines);

        if (remaining.length) {
          newPage();
        } else {
          y += SECTION_GAP;
        }

        firstPart = false;
      }

      return;
    }

    // Never leave only a label at the bottom of a page.
    if (y + LABEL_HEIGHT + BOX_PADDING_Y * 2 + CODE_LINE_HEIGHT > bottomLimit) {
      newPage();
    }

    drawLabel(label, kind);
    drawBoxLines(measurement.lines);
    y += SECTION_GAP;
  };

  const getCodeLabel = (cell) =>
    showExecutionCounts && cell.execution_count !== null
      ? `In [${cell.execution_count}]:`
      : "Code";

  const getOutputLabel = (cell) =>
    showExecutionCounts && cell.execution_count !== null
      ? `Out [${cell.execution_count}]:`
      : "Output";

  const estimateQuestionGroupHeight = (questionIndex) => {
    const questionCell = notebook.cells[questionIndex];
    const questionText = markdownToPlainText(questionCell?.source);

    const questionMeasurement = measureText({
      text: questionText,
      font: "helvetica",
      style: "bold",
      size: QUESTION_SIZE,
      lineHeight: QUESTION_LINE_HEIGHT,
      maxWidth: contentWidth,
    });

    let height = questionMeasurement.height + 7;

    const nextCell = notebook.cells[questionIndex + 1];

    if (nextCell?.cell_type === "code") {
      const code = fixCommonEncoding(sourceToText(nextCell.source));

      if (code.trim()) {
        const codeMeasurement = measureTextBox(code);
        height += LABEL_HEIGHT + codeMeasurement.height + SECTION_GAP;

        const outputs = Array.isArray(nextCell.outputs) ? nextCell.outputs : [];

        outputs.forEach((output) => {
          const text = outputText(output);

          if (text.trim()) {
            const outputMeasurement = measureTextBox(text);
            height += LABEL_HEIGHT + outputMeasurement.height + SECTION_GAP;
          }
        });
      }
    }

    return height + QUESTION_GAP;
  };

  const intro = getIntroInfo(notebook);
  const heading = intro.heading || formatFallbackTitle(title);

  if (heading) {
    addPlainText({
      text: heading,
      style: "bold",
      size: 18,
      lineHeight: 21,
      align: "center",
    });

    y += 8;
  }

  // All existing or future details are displayed as ordinary text.
  // Example: Name, ID, Division, Demo-1 Lab, Batch, etc.
  intro.detailLines.forEach((line) => {
    addPlainText({
      text: line,
      size: 10.2,
      lineHeight: 14,
    });
  });

  if (intro.detailLines.length) {
    y += 10;
  }

  const startIndex =
    intro.firstQuestionCellIndex >= 0 ? intro.firstQuestionCellIndex : 0;

  for (let index = startIndex; index < notebook.cells.length; index += 1) {
    const cell = notebook.cells[index];

    if (!cell || !["markdown", "code", "raw"].includes(cell.cell_type)) {
      continue;
    }

    if (cell.cell_type === "markdown") {
      const text = markdownToPlainText(cell.source);
      if (!text.trim()) continue;

      const question = isQuestionText(text);

      if (question) {
        const groupHeight = estimateQuestionGroupHeight(index);

        // If this complete question can fit on a fresh page, keep it together.
        if (groupHeight <= freshPageHeight && y + groupHeight > bottomLimit) {
          newPage();
        } else {
          // At minimum, keep the question with the beginning of its answer.
          const questionHeight = measureText({
            text,
            font: "helvetica",
            style: "bold",
            size: QUESTION_SIZE,
            lineHeight: QUESTION_LINE_HEIGHT,
          }).height;

          ensureSpace(
            questionHeight +
              LABEL_HEIGHT +
              BOX_PADDING_Y * 2 +
              CODE_LINE_HEIGHT * 2,
          );
        }
      } else {
        ensureSpace(28);
      }

      addPlainText({
        text,
        style: question ? "bold" : "normal",
        size: question ? QUESTION_SIZE : BODY_SIZE,
        lineHeight: question ? QUESTION_LINE_HEIGHT : BODY_LINE_HEIGHT,
      });

      y += question ? 7 : 5;
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

    // Empty unanswered code cells are hidden completely.
    if (!code.trim()) {
      continue;
    }

    drawLabeledTextBox({
      label: getCodeLabel(cell),
      text: code,
      kind: "code",
    });

    const outputs = Array.isArray(cell.outputs) ? cell.outputs : [];

    for (const output of outputs) {
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

          if (!text.trim()) {
            drawLabel(getOutputLabel(cell), "output");
          }

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

          addPlainText({
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

    pdf.text(`Page ${page} of ${totalPages}`, pageWidth / 2, pageHeight - 18, {
      align: "center",
    });

    pdf.setTextColor(0, 0, 0);
  }

  pdf.save(`${safeFileName(fileName)}.pdf`);
}
