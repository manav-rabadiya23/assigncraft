import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";
import { normalizeLine } from "./questionParser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MIN_TEXT_CHARACTERS = 40;

function cleanPageLines(lines) {
  return lines.map(normalizeLine).filter(Boolean);
}

function findRepeatedPageNoise(pages) {
  if (pages.length < 2) return new Set();

  const counts = new Map();

  for (const lines of pages) {
    const candidates = [...lines.slice(0, 3), ...lines.slice(-3)];
    const unique = new Set(candidates.map((line) => line.toLowerCase()));

    for (const candidate of unique) {
      counts.set(candidate, (counts.get(candidate) || 0) + 1);
    }
  }

  const threshold = Math.max(2, Math.ceil(pages.length * 0.6));
  const repeated = new Set();

  for (const [line, count] of counts.entries()) {
    if (count >= threshold && line.length <= 140) {
      repeated.add(line);
    }
  }

  return repeated;
}

function removeRepeatedPageNoise(pages) {
  const repeated = findRepeatedPageNoise(pages);

  if (!repeated.size) return pages;

  return pages.map((lines) =>
    lines.filter((line, index) => {
      const isEdgeLine = index < 3 || index >= lines.length - 3;
      return !(isEdgeLine && repeated.has(line.toLowerCase()));
    }),
  );
}

async function extractPageLines(page) {
  const textContent = await page.getTextContent();
  const pageLines = [];
  let currentLine = [];
  let currentY = null;

  const flushLine = () => {
    const line = normalizeLine(currentLine.join(" "));
    if (line) pageLines.push(line);
    currentLine = [];
  };

  for (const item of textContent.items) {
    if (!("str" in item)) continue;

    const value = normalizeLine(item.str);
    const itemY = Array.isArray(item.transform) ? item.transform[5] : null;

    if (
      currentLine.length > 0 &&
      currentY !== null &&
      itemY !== null &&
      Math.abs(itemY - currentY) > 2.5
    ) {
      flushLine();
    }

    if (value) currentLine.push(value);
    if (itemY !== null) currentY = itemY;

    if (item.hasEOL) {
      flushLine();
      currentY = null;
    }
  }

  if (currentLine.length) flushLine();
  return cleanPageLines(pageLines);
}

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
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.({
      phase: "text",
      progress: Math.round((pageNumber / pdf.numPages) * 100),
      message: `Reading page ${pageNumber} of ${pdf.numPages}...`,
    });

    const page = await pdf.getPage(pageNumber);
    pages.push(await extractPageLines(page));
  }

  const cleanedPages = removeRepeatedPageNoise(pages);
  const text = cleanedPages
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
