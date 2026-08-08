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

function xmlText(xml = "") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Unable to read the completed Word document.");
  }

  return Array.from(doc.getElementsByTagNameNS(WORD_NS, "t"))
    .map((node) => node.textContent || "")
    .join(" ");
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
  const text = xmlText(documentXml);

  const numbers = [];

  // Supports Q-12, Q 12, Q.12, Question 12 etc.
  for (const match of text.matchAll(/\bQ(?:uestion)?\s*[-.:]?\s*(\d{1,4})\b/gi)) {
    numbers.push(Number(match[1]));
  }

  if (!numbers.length) {
    throw new Error(
      "No question number was found in the completed assignment. Expected labels such as Q-1, Q-12 or Question 12.",
    );
  }

  const lastQuestionNumber = Math.max(...numbers);

  const mediaFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/media/") && !zip.files[name].dir,
  );

  return {
    lastQuestionNumber,
    mediaCount: mediaFiles.length,
  };
}

function cleanContinuationQuestion(question = "") {
  return question
    .replace(
      /^(?:Exercise|Experiment|Practical)\s*(?:No\.?\s*)?\d+\s*[:.)-]?\s*/i,
      "",
    )
    .replace(
      /^(?:Q(?:uestion)?|Que)\s*(?:No\.?\s*)?[-.:]?\s*\d+\s*[:.)-]?\s*/i,
      "",
    )
    .trim();
}

function paragraphXml(text, { bold = false, pageBreak = false, after = 0 } = {}) {
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
    throw new Error("The completed Word document has an invalid document body.");
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

  // IMPORTANT:
  // We never extract/rebuild the old questions. We only append XML to the
  // existing document body. All old tables, code, images and relationships
  // remain in the original DOCX package.
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
