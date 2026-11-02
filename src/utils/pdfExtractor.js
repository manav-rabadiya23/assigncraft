import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";
import { layoutPages, markBoldItems } from "./pdfLayout";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MIN_TEXT_CHARACTERS = 40;

async function renderPageToCanvas(page, scale = 2) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

async function runOcr(pdf, onProgress) {
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.({
          phase: "ocr",
          progress: Math.round((message.progress || 0) * 100),
          message: `Reading scanned page with OCR... ${Math.round(
            (message.progress || 0) * 100,
          )}%`,
        });
      }
    },
  });

  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.({
        phase: "ocr",
        progress: Math.round(((pageNumber - 1) / pdf.numPages) * 100),
        message: `OCR page ${pageNumber} of ${pdf.numPages}...`,
      });

      const page = await pdf.getPage(pageNumber);
      const canvas = await renderPageToCanvas(page, 2);
      const result = await worker.recognize(canvas);
      pages.push(result.data.text || "");
      canvas.remove?.();
    }
  } finally {
    await worker.terminate();
  }

  return pages.join("\n---PAGE_BREAK---\n");
}

export async function extractTextFromPdf(file, { onProgress } = {}) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  });
  const pdf = await loadingTask.promise;
  const pagesOfItems = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.({
      phase: "text",
      progress: Math.round((pageNumber / pdf.numPages) * 100),
      message: `Reading page ${pageNumber} of ${pdf.numPages}...`,
    });

    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    let items = textContent.items;

    // Fonts are only available after the page operators are read; this lets us
    // keep the teacher's bold text.
    try {
      await page.getOperatorList();
      items = markBoldItems(items, (name) =>
        page.commonObjs.has(name) ? page.commonObjs.get(name) : null,
      );
    } catch (error) {
      console.warn("Could not read font styles; bold will not be kept.", error);
    }

    pagesOfItems.push(items);
  }

  // Splits Sample Input / Expected Output tables by column, joins kerning
  // glitches and removes repeated page headers (see utils/pdfLayout.js).
  const text = layoutPages(pagesOfItems)
    .map((lines) => lines.join("\n"))
    .join("\n---PAGE_BREAK---\n");

  const readableCharacters = text.replace(/\s/g, "").length;

  if (readableCharacters >= MIN_TEXT_CHARACTERS) {
    return {
      text,
      usedOcr: false,
      pageCount: pdf.numPages,
    };
  }

  onProgress?.({
    phase: "ocr",
    progress: 0,
    message: "Scanned PDF detected. Starting OCR...",
  });

  const ocrText = await runOcr(pdf, onProgress);

  return {
    text: ocrText,
    usedOcr: true,
    pageCount: pdf.numPages,
  };
}
