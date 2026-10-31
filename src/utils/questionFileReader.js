import { extractTextFromDocx } from "./docxExtractor";
import { extractTextFromPdf } from "./pdfExtractor";
import { extractTextFromTxt } from "./textFileExtractor";

/** File types the question readers accept (teacher's question files). */
export const QUESTION_FILE_EXTENSIONS = ["pdf", "docx", "txt"];

export const QUESTION_FILE_ACCEPT =
  ".pdf,.docx,.txt,application/pdf,text/plain," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const QUESTION_FILE_LABEL = "PDF, DOCX or TXT";

export function getFileExtension(file) {
  return file?.name?.split(".").pop()?.toLowerCase() || "";
}

export function isSupportedQuestionFile(file) {
  return QUESTION_FILE_EXTENSIONS.includes(getFileExtension(file));
}

/**
 * Reads the text of a question file (PDF, DOCX or TXT).
 * @returns {{ text: string, usedOcr: boolean, extension: string }}
 */
export async function readQuestionFile(file, { onProgress } = {}) {
  const extension = getFileExtension(file);

  if (extension === "pdf") {
    const result = await extractTextFromPdf(file, { onProgress });
    return {
      text: result.text || "",
      usedOcr: Boolean(result.usedOcr),
      extension,
    };
  }

  if (extension === "docx") {
    onProgress?.({ message: "Reading Word file..." });
    return { text: await extractTextFromDocx(file), usedOcr: false, extension };
  }

  if (extension === "txt") {
    onProgress?.({ message: "Reading text file..." });
    return { text: await extractTextFromTxt(file), usedOcr: false, extension };
  }

  throw new Error(`Only ${QUESTION_FILE_LABEL} question files are supported.`);
}
