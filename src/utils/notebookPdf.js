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

function markdownToPlainText(source) {
  return decodeHtml(sourceToText(source))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function outputText(output) {
  if (!output || typeof output !== "object") return "";

  if (output.output_type === "stream") {
    return sourceToText(output.text);
  }

  if (output.output_type === "error") {
    if (Array.isArray(output.traceback) && output.traceback.length) {
      return output.traceback
        .map((line) => String(line).replace(/\x1b\[[0-9;]*m/g, ""))
        .join("\n");
    }

    return [output.ename, output.evalue].filter(Boolean).join(": ");
  }

  const data = output.data || {};

  if (data["text/plain"]) {
    return sourceToText(data["text/plain"]);
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
    image.onerror = () => reject(new Error("Unable to render a notebook image."));
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
  return String(name)
    .replace(/\.ipynb$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .trim() || "notebook";
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

  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 42;

  let y = margin;

  const ensureSpace = (height = 20) => {
    if (y + height > bottomLimit) {
      pdf.addPage();
      y = margin;
    }
  };

  const addWrappedText = ({
    text,
    font = "helvetica",
    style = "normal",
    size = 10.5,
    lineHeight = 14,
    indent = 0,
    maxWidth = contentWidth,
  }) => {
    const value = String(text || "");
    if (!value.trim()) return;

    pdf.setFont(font, style);
    pdf.setFontSize(size);

    const paragraphs = value.replace(/\r/g, "").split("\n");

    paragraphs.forEach((paragraph, paragraphIndex) => {
      const lines = paragraph
        ? pdf.splitTextToSize(paragraph, maxWidth - indent)
        : [""];

      lines.forEach((line) => {
        ensureSpace(lineHeight);
        pdf.text(String(line), margin + indent, y);
        y += lineHeight;
      });

      if (paragraphIndex < paragraphs.length - 1) {
        y += 2;
      }
    });
  };

  if (title) {
    addWrappedText({
      text: title,
      style: "bold",
      size: 16,
      lineHeight: 20,
    });
    y += 8;
  }

  for (let index = 0; index < notebook.cells.length; index += 1) {
    const cell = notebook.cells[index];

    if (!cell || !["markdown", "code", "raw"].includes(cell.cell_type)) {
      continue;
    }

    ensureSpace(28);

    if (cell.cell_type === "markdown") {
      if (showCellLabels) {
        addWrappedText({
          text: "Markdown",
          style: "bold",
          size: 8.5,
          lineHeight: 11,
        });
        y += 2;
      }

      addWrappedText({
        text: markdownToPlainText(cell.source),
        style: "normal",
        size: 11,
        lineHeight: 15,
      });

      y += 12;
      continue;
    }

    if (cell.cell_type === "raw") {
      if (showCellLabels) {
        addWrappedText({
          text: "Raw",
          style: "bold",
          size: 8.5,
          lineHeight: 11,
        });
        y += 2;
      }

      addWrappedText({
        text: sourceToText(cell.source),
        font: "courier",
        size: 9.5,
        lineHeight: 13,
      });

      y += 12;
      continue;
    }

    const executionLabel =
      showExecutionCounts && cell.execution_count !== null
        ? `In [${cell.execution_count}]:`
        : "Python";

    addWrappedText({
      text: executionLabel,
      style: "bold",
      size: 8.5,
      lineHeight: 11,
    });

    y += 2;

    const code = sourceToText(cell.source);

    if (code.trim()) {
      addWrappedText({
        text: code,
        font: "courier",
        size: 9.2,
        lineHeight: 12.5,
      });
    } else {
      addWrappedText({
        text: "(empty code cell)",
        style: "italic",
        size: 9,
        lineHeight: 12,
      });
    }

    const outputs = Array.isArray(cell.outputs) ? cell.outputs : [];

    for (const output of outputs) {
      const text = outputText(output);
      const imageSrc = outputImage(output);

      if (text.trim()) {
        y += 6;

        const outputLabel =
          showExecutionCounts && cell.execution_count !== null
            ? `Out [${cell.execution_count}]:`
            : "Output:";

        addWrappedText({
          text: outputLabel,
          style: "bold",
          size: 8.5,
          lineHeight: 11,
        });

        addWrappedText({
          text,
          font: "courier",
          size: 9.2,
          lineHeight: 12.5,
        });
      }

      if (imageSrc) {
        y += 8;

        try {
          const image = await loadImage(imageSrc);
          const dimensions = getImageSize(
            image,
            contentWidth,
            Math.min(390, pageHeight * 0.48),
          );

          ensureSpace(dimensions.height + 10);

          const format = imageSrc.startsWith("data:image/jpeg")
            ? "JPEG"
            : "PNG";

          pdf.addImage(
            imageSrc,
            format,
            margin,
            y,
            dimensions.width,
            dimensions.height,
          );

          y += dimensions.height + 8;
        } catch (error) {
          console.warn(error);

          addWrappedText({
            text: "[Image output could not be rendered]",
            style: "italic",
            size: 9,
            lineHeight: 12,
          });
        }
      }
    }

    y += 14;
  }

  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text(
      `Page ${page} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 18,
      { align: "center" },
    );
  }

  pdf.save(`${safeFileName(fileName)}.pdf`);
}
