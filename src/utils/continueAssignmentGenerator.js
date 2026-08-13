import JSZip from "jszip";
import { saveAs } from "file-saver";

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseDocumentXml(xml = "") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Unable to read the completed Word document.");
  }

  return doc;
}

function nodeText(node) {
  if (!node) return "";

  return Array.from(node.getElementsByTagNameNS(WORD_NS, "t"))
    .map((textNode) => textNode.textContent || "")
    .join("")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function documentText(doc) {
  return Array.from(doc.getElementsByTagNameNS(WORD_NS, "t"))
    .map((node) => node.textContent || "")
    .join(" ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanContinuationQuestion(question = "") {
  return String(question)
    .replace(
      /^(?:Exercise|Experiment|Practical)\s*(?:No\.?\s*)?\d+\s*[:.)-]?\s*/i,
      "",
    )
    .replace(
      /^(?:Q(?:uestion)?|Que)\s*(?:No\.?\s*)?[-.:]?\s*\d+\s*[:.)-]?\s*/i,
      "",
    )
    .replace(/^\d{1,4}\s*[.)-:]\s*/, "")
    .trim();
}

function extractExistingQuestions(doc) {
  const questions = [];
  const seenNumbers = new Set();

  const rows = Array.from(doc.getElementsByTagNameNS(WORD_NS, "tr"));

  rows.forEach((row) => {
    const cells = Array.from(row.getElementsByTagNameNS(WORD_NS, "tc"));
    if (cells.length < 2) return;

    const label = nodeText(cells[0]);
    const match = label.match(
      /^\s*(?:Q(?:uestion)?|Que)\s*(?:No\.?\s*)?[-.:]?\s*(\d{1,4})\b/i,
    );

    if (!match) return;

    const number = Number(match[1]);
    if (!Number.isInteger(number) || number <= 0 || seenNumbers.has(number)) {
      return;
    }

    const text = cleanContinuationQuestion(nodeText(cells[1]));

    questions.push({
      number,
      text,
    });

    seenNumbers.add(number);
  });

  return questions;
}

function normalizeQuestionForComparison(question = "") {
  let text = cleanContinuationQuestion(question)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[•●▪◦\uf0b7]/g, " ");

  // Teacher files often contain sample input/output after the real question.
  // Those examples should not make the same question look different.
  text = text.replace(
    /\b(?:sample\s+input|sample\s+output|expected\s+output)\b[\s\S]*$/i,
    "",
  );

  return text
    .toLowerCase()
    .replace(/\bpython\s+program\s+to\b/g, "python program to")
    .replace(/[^a-z0-9+#.'()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text = "") {
  return new Set(
    normalizeQuestionForComparison(text)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 1),
  );
}

function diceSimilarity(first, second) {
  const a = tokenSet(first);
  const b = tokenSet(second);

  if (!a.size || !b.size) return 0;

  let common = 0;

  for (const token of a) {
    if (b.has(token)) common += 1;
  }

  return (2 * common) / (a.size + b.size);
}

function questionsAreSame(first, second) {
  const a = normalizeQuestionForComparison(first);
  const b = normalizeQuestionForComparison(second);

  if (!a || !b) return false;
  if (a === b) return true;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;

  if (shorter.length >= 28 && longer.startsWith(shorter)) {
    return true;
  }

  return diceSimilarity(a, b) >= 0.88;
}

export async function inspectCompletedAssignment(file) {
  if (!file) {
    throw new Error("Please choose the completed assignment Word file.");
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    throw new Error("The completed assignment must be a .docx file.");
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentEntry = zip.file("word/document.xml");

  if (!documentEntry) {
    throw new Error("This is not a valid Word DOCX document.");
  }

  const documentXml = await documentEntry.async("string");
  const doc = parseDocumentXml(documentXml);
  const text = documentText(doc);

  const numbers = [];

  // Supports Q-12, Q 12, Q.12, Question 12 etc.
  for (const match of text.matchAll(
    /\bQ(?:uestion)?\s*[-.:]?\s*(\d{1,4})\b/gi,
  )) {
    numbers.push(Number(match[1]));
  }

  if (!numbers.length) {
    throw new Error(
      "No question number was found in the completed assignment. Expected labels such as Q-1, Q-12 or Question 12.",
    );
  }

  const questionNumbers = [...new Set(numbers)]
    .filter((number) => Number.isInteger(number) && number > 0)
    .sort((a, b) => a - b);

  const lastQuestionNumber = Math.max(...questionNumbers);
  const existingQuestions = extractExistingQuestions(doc);

  const mediaFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/media/") && !zip.files[name].dir,
  );

  return {
    lastQuestionNumber,
    questionCount: questionNumbers.length,
    questionNumbers,
    existingQuestions,
    mediaCount: mediaFiles.length,
  };
}

export function compareTeacherQuestionsWithCompletedAssignment(
  completedInspection,
  teacherQuestions = [],
) {
  const validTeacherQuestions = teacherQuestions
    .map(cleanContinuationQuestion)
    .filter(Boolean);

  const existingQuestions = Array.isArray(
    completedInspection?.existingQuestions,
  )
    ? completedInspection.existingQuestions
    : [];

  const lastQuestionNumber = Number(
    completedInspection?.lastQuestionNumber || 0,
  );

  const existingNumbers = new Set(
    Array.isArray(completedInspection?.questionNumbers)
      ? completedInspection.questionNumbers
      : existingQuestions.map((question) => question.number),
  );

  const hasCompleteSequence =
    lastQuestionNumber > 0 &&
    Array.from({ length: lastQuestionNumber }, (_, index) => index + 1).every(
      (number) => existingNumbers.has(number),
    );

  // If the teacher sends the whole updated assignment again (old + new),
  // the first Q1..Qn positions correspond to the already completed questions.
  const looksLikeFullUpdatedAssignment =
    hasCompleteSequence && validTeacherQuestions.length >= lastQuestionNumber;

  const duplicateQuestions = [];
  const newQuestions = [];

  validTeacherQuestions.forEach((question, index) => {
    const matchedExisting = existingQuestions.find((existingQuestion) =>
      questionsAreSame(existingQuestion.text, question),
    );

    const teacherPositionNumber = index + 1;

    const positionalDuplicate =
      !matchedExisting &&
      looksLikeFullUpdatedAssignment &&
      teacherPositionNumber <= lastQuestionNumber;

    if (matchedExisting || positionalDuplicate) {
      duplicateQuestions.push({
        question,
        teacherPositionNumber,
        existingQuestionNumber:
          matchedExisting?.number ||
          (positionalDuplicate ? teacherPositionNumber : null),
        matchedBy: matchedExisting ? "content" : "position",
      });
      return;
    }

    newQuestions.push(question);
  });

  return {
    totalTeacherQuestions: validTeacherQuestions.length,
    duplicateCount: duplicateQuestions.length,
    newQuestionCount: newQuestions.length,
    duplicateQuestions,
    newQuestions,
    looksLikeFullUpdatedAssignment,
    lastQuestionNumber,
  };
}

function paragraphXml(
  text,
  { bold = false, pageBreak = false, after = 0 } = {},
) {
  const runProps = bold ? "<w:rPr><w:b/></w:rPr>" : "";
  const breakXml = pageBreak ? '<w:br w:type="page"/>' : "";
  const spacing = after ? `<w:pPr><w:spacing w:after="${after}"/></w:pPr>` : "";

  return `<w:p>${spacing}<w:r>${runProps}${breakXml}<w:t xml:space="preserve">${escapeXml(
    text,
  )}</w:t></w:r></w:p>`;
}

function cellXml(contentXml, width, { bold = false } = {}) {
  const borders = `
    <w:tcBorders>
      <w:top w:val="single" w:sz="4" w:color="808080"/>
      <w:left w:val="single" w:sz="4" w:color="808080"/>
      <w:bottom w:val="single" w:sz="4" w:color="808080"/>
      <w:right w:val="single" w:sz="4" w:color="808080"/>
    </w:tcBorders>`;

  const runProps = bold ? "<w:rPr><w:b/></w:rPr>" : "";

  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:tcMar>
          <w:top w:w="100" w:type="dxa"/>
          <w:left w:w="120" w:type="dxa"/>
          <w:bottom w:w="100" w:type="dxa"/>
          <w:right w:w="120" w:type="dxa"/>
        </w:tcMar>
        ${borders}
      </w:tcPr>
      <w:p>
        <w:r>
          ${runProps}
          <w:t xml:space="preserve">${escapeXml(contentXml)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
}

function blankCellXml(width, blankParagraphs = 6) {
  const borders = `
    <w:tcBorders>
      <w:top w:val="single" w:sz="4" w:color="808080"/>
      <w:left w:val="single" w:sz="4" w:color="808080"/>
      <w:bottom w:val="single" w:sz="4" w:color="808080"/>
      <w:right w:val="single" w:sz="4" w:color="808080"/>
    </w:tcBorders>`;

  const paragraphs = Array.from(
    { length: blankParagraphs },
    () => '<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>',
  ).join("");

  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        <w:tcMar>
          <w:top w:w="100" w:type="dxa"/>
          <w:left w:w="120" w:type="dxa"/>
          <w:bottom w:w="100" w:type="dxa"/>
          <w:right w:w="120" w:type="dxa"/>
        </w:tcMar>
        ${borders}
      </w:tcPr>
      ${paragraphs}
    </w:tc>`;
}

function questionTableXml(questionNumber, question) {
  const cleanQuestion = cleanContinuationQuestion(question);

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblLayout w:type="fixed"/>
      </w:tblPr>
      <w:tblGrid>
        <w:gridCol w:w="1800"/>
        <w:gridCol w:w="7200"/>
      </w:tblGrid>

      <w:tr>
        ${cellXml(`Q-${questionNumber}`, 1800, { bold: true })}
        ${cellXml(cleanQuestion, 7200)}
      </w:tr>

      <w:tr>
        ${cellXml("Code", 1800, { bold: true })}
        ${blankCellXml(7200, 8)}
      </w:tr>

      <w:tr>
        ${cellXml("Output", 1800, { bold: true })}
        ${blankCellXml(7200, 6)}
      </w:tr>
    </w:tbl>`;
}

function buildContinuationXml(questions, startQuestionNumber) {
  const validQuestions = questions
    .map((question) => cleanContinuationQuestion(question))
    .filter(Boolean);

  if (!validQuestions.length) {
    throw new Error("There are no valid new questions to append.");
  }

  const blocks = [
    // Start continuation on a fresh page.
    paragraphXml("", { pageBreak: true }),
  ];

  validQuestions.forEach((question, index) => {
    const number = startQuestionNumber + index;

    blocks.push(
      paragraphXml(`Question ${number}`, { bold: true, after: 100 }),
      questionTableXml(number, question),
      paragraphXml(" ", { after: 160 }),
    );
  });

  return blocks.join("");
}

function insertBeforeFinalSectionProperties(documentXml, continuationXml) {
  const sectPrIndex = documentXml.lastIndexOf("<w:sectPr");

  if (sectPrIndex !== -1) {
    return (
      documentXml.slice(0, sectPrIndex) +
      continuationXml +
      documentXml.slice(sectPrIndex)
    );
  }

  const bodyEndIndex = documentXml.lastIndexOf("</w:body>");

  if (bodyEndIndex === -1) {
    throw new Error(
      "The completed Word document has an invalid document body.",
    );
  }

  return (
    documentXml.slice(0, bodyEndIndex) +
    continuationXml +
    documentXml.slice(bodyEndIndex)
  );
}

export async function generateContinuedAssignment({
  completedFile,
  questions,
  lastQuestionNumber,
}) {
  if (!completedFile) {
    throw new Error("Please upload the completed assignment first.");
  }

  const zip = await JSZip.loadAsync(await completedFile.arrayBuffer());
  const documentEntry = zip.file("word/document.xml");

  if (!documentEntry) {
    throw new Error("The completed DOCX does not contain word/document.xml.");
  }

  const originalXml = await documentEntry.async("string");

  // We never rebuild the old document. Only the filtered new questions are
  // appended, so old tables, code, images, outputs and formatting are kept.
  const continuationXml = buildContinuationXml(
    questions,
    Number(lastQuestionNumber) + 1,
  );

  const updatedXml = insertBeforeFinalSectionProperties(
    originalXml,
    continuationXml,
  );

  zip.file("word/document.xml", updatedXml);

  const outputBlob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });

  const baseName = completedFile.name.replace(/\.docx$/i, "");
  saveAs(outputBlob, `${baseName}-continued.docx`);
}
