import { saveAs } from "file-saver";

function splitLines(text = "") {
  const normalized = String(text).replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  return lines.length
    ? lines.map((line, index) =>
        index < lines.length - 1 ? `${line}\n` : line,
      )
    : [""];
}

function cleanQuestionText(question = "") {
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

function createMarkdownCell(question, number) {
  const clean = cleanQuestionText(question);

  return {
    cell_type: "markdown",
    metadata: {},
    source: splitLines(`<b>${number}. ${clean}</b>`),
  };
}

function createCodeCell() {
  return {
    cell_type: "code",
    execution_count: null,
    metadata: {},
    outputs: [],
    source: [],
  };
}

export function createPythonNotebook(questions) {
  const validQuestions = questions.map(cleanQuestionText).filter(Boolean);

  if (!validQuestions.length) {
    throw new Error("There are no valid questions to create a notebook.");
  }

  const cells = [];

  validQuestions.forEach((question, index) => {
    cells.push(createMarkdownCell(question, index + 1), createCodeCell());
  });

  return {
    cells,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
        file_extension: ".py",
        mimetype: "text/x-python",
        pygments_lexer: "ipython3",
        nbconvert_exporter: "python",
        codemirror_mode: {
          name: "ipython",
          version: 3,
        },
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

function sourceToText(source) {
  if (Array.isArray(source)) return source.join("");
  return String(source || "");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function questionNumberFromMarkdown(source) {
  const text = stripHtml(sourceToText(source));

  const patterns = [
    /^(?:Q(?:uestion)?|Que)\s*[-.:]?\s*(\d{1,4})\b/i,
    /^(\d{1,4})\s*[.)-:]\s+/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
}

function normalizeQuestionForComparison(question = "") {
  let text = stripHtml(question);

  text = cleanQuestionText(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[•●▪◦\uf0b7]/g, " ");

  // Teacher files often include sample input/output below the real question.
  // Existing notebooks usually contain only the question statement.
  // Ignore the sample section while comparing duplicates.
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

  // Safe for cases where the PDF parser adds extra examples/details after
  // the same question text.
  if (shorter.length >= 28 && longer.startsWith(shorter)) {
    return true;
  }

  // Handles small formatting/wording differences without treating unrelated
  // questions as duplicates.
  return diceSimilarity(a, b) >= 0.88;
}

export function getNotebookQuestions(notebook) {
  if (!notebook || !Array.isArray(notebook.cells)) return [];

  return notebook.cells
    .filter((cell) => cell?.cell_type === "markdown")
    .map((cell) => {
      const rawText = sourceToText(cell.source);
      const number = questionNumberFromMarkdown(rawText);

      if (!number) return null;

      return {
        number,
        text: cleanQuestionText(stripHtml(rawText)),
      };
    })
    .filter(Boolean);
}

export function compareTeacherQuestionsWithNotebook(
  notebook,
  teacherQuestions = [],
) {
  const existingQuestions = getNotebookQuestions(notebook);
  const validTeacherQuestions = teacherQuestions
    .map(cleanQuestionText)
    .filter(Boolean);

  const lastQuestionNumber = existingQuestions.length
    ? Math.max(...existingQuestions.map((question) => question.number))
    : 0;

  const existingNumbers = new Set(
    existingQuestions.map((question) => question.number),
  );

  // If the latest teacher file contains at least as many questions as the
  // completed notebook, it is very likely the teacher sent the full updated
  // assignment (old + new). This lets us safely keep Q1..Qn and only append
  // questions after the notebook's last completed question.
  const looksLikeFullUpdatedAssignment =
    lastQuestionNumber > 0 &&
    validTeacherQuestions.length >= lastQuestionNumber &&
    Array.from({ length: lastQuestionNumber }, (_, index) => index + 1).every(
      (number) => existingNumbers.has(number),
    );

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
    existingQuestionCount: existingQuestions.length,
    duplicateCount: duplicateQuestions.length,
    newQuestionCount: newQuestions.length,
    duplicateQuestions,
    newQuestions,
    looksLikeFullUpdatedAssignment,
    lastQuestionNumber,
  };
}

export function inspectNotebook(notebook) {
  if (!notebook || typeof notebook !== "object") {
    throw new Error("Invalid Jupyter Notebook file.");
  }

  if (!Array.isArray(notebook.cells)) {
    throw new Error("This file does not contain valid notebook cells.");
  }

  const numbers = notebook.cells
    .filter((cell) => cell?.cell_type === "markdown")
    .map((cell) => questionNumberFromMarkdown(cell.source))
    .filter((number) => Number.isInteger(number) && number > 0);

  const codeCells = notebook.cells.filter((cell) => cell?.cell_type === "code");

  const outputCount = codeCells.reduce(
    (total, cell) =>
      total + (Array.isArray(cell.outputs) ? cell.outputs.length : 0),
    0,
  );

  return {
    lastQuestionNumber: numbers.length ? Math.max(...numbers) : 0,
    questionCount: numbers.length,
    cellCount: notebook.cells.length,
    codeCellCount: codeCells.length,
    outputCount,
  };
}

export async function readNotebookFile(file) {
  if (!file) throw new Error("Please choose a Jupyter Notebook file.");

  if (!file.name.toLowerCase().endsWith(".ipynb")) {
    throw new Error("Please upload a valid .ipynb file.");
  }

  let notebook;

  try {
    notebook = JSON.parse(await file.text());
  } catch {
    throw new Error("The selected .ipynb file contains invalid JSON.");
  }

  const inspection = inspectNotebook(notebook);

  return {
    notebook,
    inspection,
  };
}

export function continuePythonNotebook(
  originalNotebook,
  questions,
  lastQuestionNumber,
) {
  // Deep copy ensures the uploaded notebook object itself is never changed.
  const notebook = JSON.parse(JSON.stringify(originalNotebook));

  const validQuestions = questions.map(cleanQuestionText).filter(Boolean);

  if (!validQuestions.length) {
    throw new Error("There are no new questions to append.");
  }

  if (!Array.isArray(notebook.cells)) {
    throw new Error("The old notebook does not contain a valid cells list.");
  }

  validQuestions.forEach((question, index) => {
    const number = Number(lastQuestionNumber) + index + 1;

    notebook.cells.push(createMarkdownCell(question, number), createCodeCell());
  });

  // Preserve old notebook metadata/format. Supply safe defaults only if missing.
  if (!notebook.metadata) notebook.metadata = {};
  if (!notebook.nbformat) notebook.nbformat = 4;
  if (notebook.nbformat_minor === undefined) notebook.nbformat_minor = 5;

  return notebook;
}

export function downloadNotebook(notebook, fileName = "assignment.ipynb") {
  const safeName = fileName.toLowerCase().endsWith(".ipynb")
    ? fileName
    : `${fileName}.ipynb`;

  const blob = new Blob([JSON.stringify(notebook, null, 2)], {
    type: "application/x-ipynb+json;charset=utf-8",
  });

  saveAs(blob, safeName);
}

export function cleanNotebookQuestion(question) {
  return cleanQuestionText(question);
}
