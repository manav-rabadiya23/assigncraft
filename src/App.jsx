import { useEffect, useRef, useState } from "react";
import mammoth from "mammoth";
import { saveAs } from "file-saver";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROFILE_STORAGE_KEY = "assignment-generator-profile";

const PORTFOLIO_URL = "https://rabadiya-manav.vercel.app";
const DEVLOKS_URL = "https://devlok-team.vercel.app";

const emptyDetails = {
  courseName: "",
  fullName: "",
  studentId: "",
  division: "",
  subject: "",
  subjectCode: "",
  assignmentNumber: "",
};

function getSavedProfile() {
  try {
    const savedProfile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));

    return {
      ...emptyDetails,
      courseName: savedProfile?.courseName || "",
      fullName: savedProfile?.fullName || "",
      studentId: savedProfile?.studentId || "",
      division: savedProfile?.division || "",
    };
  } catch {
    return emptyDetails;
  }
}

function App() {
  const [details, setDetails] = useState(getSavedProfile);
  const [questions, setQuestions] = useState([]);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const questionRefs = useRef([]);

  useEffect(() => {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        courseName: details.courseName,
        fullName: details.fullName,
        studentId: details.studentId,
        division: details.division,
      }),
    );
  }, [
    details.courseName,
    details.fullName,
    details.studentId,
    details.division,
  ]);

  useEffect(() => {
    if (!showPreview) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setShowPreview(false);
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showPreview]);

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    });
  };

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;

    setDetails((currentDetails) => ({
      ...currentDetails,
      [name]: value,
    }));
  };

  const ignoredHeadings = [
    "Practical Assignment-1",
    "Practical Assignment 1",
    "Data Types, Variables, and Literals",
    "Identifiers and Naming Rules",
    "Operators",
    "Decision Making & Control Flow Statements",
  ];

  const normalizeLine = (line) =>
    line
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();

  const shouldIgnoreLine = (line) => {
    const cleanLine = normalizeLine(line);
    const lowerLine = cleanLine.toLowerCase();

    if (!cleanLine) {
      return true;
    }

    if (
      ignoredHeadings.some((heading) => heading.toLowerCase() === lowerLine)
    ) {
      return true;
    }

    const ignoredPatterns = [
      /^subject\s*:/i,
      /^course(?:\s+name|\s+code)?\s*:/i,
      /^student(?:\s+name|\s+id)?\s*:/i,
      /^name\s*:/i,
      /^division\s*:/i,
      /^class\s*:/i,
      /^programme?\s*:/i,

      /^lab\s+assignment\b/i,
      /^practical\s+assignment\b/i,

      /^part\s+[ivxlcdm\d]+\s*[:\-]/i,
      /^unit\s+[ivxlcdm\d]+\s*[:\-]/i,
      /^module\s+[ivxlcdm\d]+\s*[:\-]/i,
      /^section\s+[a-zivxlcdm\d]+\s*[:\-]/i,

      /^(?:bca|mca|b\.?ca|m\.?ca|bsc|msc|btech|mtech)\b.*\bsemester\b/i,
      /^semester\s+[ivxlcdm\d]+\s*$/i,

      /^instructions?\s*:?\s*$/i,
      /^general\s+instructions?\s*:?\s*$/i,

      /^page\s+\d+(?:\s+of\s+\d+)?\s*$/i,
      /^\d+\s*\/\s*\d+\s*$/,
    ];

    return ignoredPatterns.some((pattern) => pattern.test(cleanLine));
  };

  const parseExplicitQuestionMarker = (line) => {
    // Exercise 1, Exercise 1:, Experiment 1
    const exerciseMatch = line.match(
      /^(exercise|experiment)\s*(?:no\.?\s*)?(\d+)\s*[.)\-:]?\s*(.*)$/i,
    );

    if (exerciseMatch) {
      const label =
        exerciseMatch[1].toLowerCase() === "experiment"
          ? "Experiment"
          : "Exercise";

      const number = exerciseMatch[2];
      const title = exerciseMatch[3]?.trim() || "";

      return {
        content: title ? `${label} ${number}: ${title}` : `${label} ${number}`,
      };
    }

    // Q-1, Q.1, Q 1, Question 1, Question No. 1
    const questionMatch = line.match(
      /^(?:q(?:uestion)?|que)\s*(?:no\.?\s*)?[-.:]?\s*(\d+)\s*[.)\-:]?\s*(.*)$/i,
    );

    if (questionMatch) {
      return {
        content: questionMatch[2]?.trim() || "",
      };
    }

    return null;
  };

  const parseNumberedQuestionMarker = (line) => {
    // 1. Question
    // 1) Question
    // 1: Question
    // 1- Question

    const match = line.match(/^(\d{1,3})\s*[.)\-:]\s+(.+)$/);

    if (!match) {
      return null;
    }

    return {
      content: match[2]?.trim() || "",
    };
  };

  const isSectionHeading = (line) => {
    const cleanLine = normalizeLine(line);

    return [
      /^part\s+[ivxlcdm\d]+\b/i,
      /^unit\s+[ivxlcdm\d]+\b/i,
      /^module\s+[ivxlcdm\d]+\b/i,
      /^section\s+[a-zivxlcdm\d]+\b/i,
      /^chapter\s+[ivxlcdm\d]+\b/i,

      /^lab\s+assignment\b/i,
      /^practical\s+assignment\b/i,

      /^subject\s*:/i,

      /^(?:bca|mca|b\.?ca|m\.?ca|bsc|msc|btech|mtech)\b.*\bsemester\b/i,

      /^semester\s+[ivxlcdm\d]+\s*$/i,

      /^instructions?\s*:/i,
      /^note\s*:/i,

      /^page\s+\d+(?:\s+of\s+\d+)?\s*$/i,
      /^\d+\s*\/\s*\d+\s*$/,
    ].some((pattern) => pattern.test(cleanLine));
  };

  const cleanDetectedQuestions = (questions) => {
    const seen = new Set();

    return questions
      .map((question) =>
        question
          .replace(/\s+([,.;:?!])/g, "$1")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter((question) => {
        if (!question) {
          return false;
        }

        const key = question.toLowerCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      });
  };

  const detectQuestions = (text) => {
    const lines = text
      .replace(/\r/g, "")
      .split("\n")
      .map(normalizeLine)
      .filter(Boolean);

    /*
     * FIRST:
     * Look for strong markers like:
     *
     * Exercise 1
     * Experiment 1
     * Q-1
     * Question 1
     *
     * These are safer than normal numbering.
     */

    const explicitMarkers = lines
      .map((line) => parseExplicitQuestionMarker(line))
      .filter(Boolean);

    const useExplicitMarkers = explicitMarkers.length > 0;

    /*
     * SECOND:
     * If explicit markers don't exist,
     * detect:
     *
     * 1.
     * 2)
     * 3:
     */

    const numberedMarkers = useExplicitMarkers
      ? []
      : lines.map((line) => parseNumberedQuestionMarker(line)).filter(Boolean);

    const useNumberedMarkers = numberedMarkers.length > 0;

    if (useExplicitMarkers || useNumberedMarkers) {
      const detectedQuestions = [];

      let currentQuestion = "";
      let questionStarted = false;

      for (const line of lines) {
        const marker = useExplicitMarkers
          ? parseExplicitQuestionMarker(line)
          : parseNumberedQuestionMarker(line);

        /*
         * New question found
         */
        if (marker) {
          if (currentQuestion.trim()) {
            detectedQuestions.push(currentQuestion.trim());
          }

          currentQuestion = marker.content;

          questionStarted = true;

          continue;
        }

        /*
         * Ignore everything before first question.
         *
         * Example:
         *
         * MCA Semester I
         * Lab Assignment 2.1
         * Subject...
         */

        if (!questionStarted) {
          continue;
        }

        /*
         * Ignore headings found between questions
         *
         * Example:
         *
         * Part II: Inheritance
         */

        if (shouldIgnoreLine(line) || isSectionHeading(line)) {
          continue;
        }

        /*
         * Join wrapped question lines
         */

        currentQuestion = currentQuestion ? `${currentQuestion} ${line}` : line;
      }

      /*
       * Add last question
       */

      if (currentQuestion.trim()) {
        detectedQuestions.push(currentQuestion.trim());
      }

      return {
        questions: cleanDetectedQuestions(detectedQuestions),
        usedFallback: false,
      };
    }

    /*
     * FALLBACK
     *
     * Used when PDF does not contain:
     *
     * Exercise 1
     * Q-1
     * Question 1
     * 1.
     *
     * This is safer than your old fallback because
     * it does NOT treat every line as a question.
     */

    const questionStartPattern =
      /^(?:write|create|develop|demonstrate|explain|define|describe|calculate|accept|initialize|design|implement|find|display|show|access|compare|differentiate|derive|convert|check|print|read|enter|what|why|how|which|when|where|who)\b/i;

    const fallbackQuestions = [];

    let currentFallback = "";

    for (const line of lines) {
      if (shouldIgnoreLine(line) || isSectionHeading(line)) {
        continue;
      }

      const looksLikeQuestion =
        questionStartPattern.test(line) || /\?\s*$/.test(line);

      if (looksLikeQuestion) {
        if (currentFallback.trim()) {
          fallbackQuestions.push(currentFallback.trim());
        }

        currentFallback = line;
      } else if (currentFallback) {
        currentFallback = `${currentFallback} ${line}`.trim();
      }
    }

    if (currentFallback.trim()) {
      fallbackQuestions.push(currentFallback.trim());
    }

    return {
      questions: cleanDetectedQuestions(fallbackQuestions),
      usedFallback: true,
    };
  };

  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdf = await loadingTask.promise;

    const allPagesText = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);

      const textContent = await page.getTextContent();

      const pageLines = [];

      let currentLine = [];

      let currentY = null;

      const flushLine = () => {
        const line = normalizeLine(currentLine.join(" "));

        if (line) {
          pageLines.push(line);
        }

        currentLine = [];
      };

      for (const item of textContent.items) {
        if (!("str" in item)) {
          continue;
        }

        const textValue = normalizeLine(item.str);

        if (!textValue) {
          if (item.hasEOL && currentLine.length > 0) {
            flushLine();

            currentY = null;
          }

          continue;
        }

        const itemY = Array.isArray(item.transform) ? item.transform[5] : null;

        /*
         * Detect new PDF line using Y position.
         *
         * Some PDFs don't provide hasEOL correctly.
         */

        if (
          currentLine.length > 0 &&
          currentY !== null &&
          itemY !== null &&
          Math.abs(itemY - currentY) > 2.5
        ) {
          flushLine();
        }

        currentLine.push(textValue);

        if (itemY !== null) {
          currentY = itemY;
        }

        if (item.hasEOL) {
          flushLine();

          currentY = null;
        }
      }

      if (currentLine.length > 0) {
        flushLine();
      }

      allPagesText.push(pageLines.join("\n"));
    }

    return allPagesText.join("\n");
  };
  //   const arrayBuffer = await file.arrayBuffer();

  //   const result = await mammoth.extractRawText({
  //     arrayBuffer,
  //   });

  //   return result.value;
  // };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    const supportedExtensions = ["pdf", "docx"];

    if (!supportedExtensions.includes(extension)) {
      setFileName("");
      setFileType("");
      setQuestions([]);

      showMessage("error", "Please upload a valid PDF or DOCX file.");

      event.target.value = "";
      return;
    }

    try {
      setIsReading(true);
      setFileName(file.name);
      setFileType(extension.toUpperCase());

      showMessage(
        "info",
        `Reading the ${extension.toUpperCase()} file and detecting questions...`,
      );

      const extractedText =
        extension === "pdf"
          ? await extractTextFromPdf(file)
          : await extractTextFromDocx(file);

      if (!extractedText.trim()) {
        setQuestions([]);

        showMessage(
          "warning",
          "No readable text was found. The file may be a scanned PDF.",
        );

        return;
      }

      const detectedResult = detectQuestions(extractedText);

      setQuestions(detectedResult.questions);
      questionRefs.current = [];

      if (detectedResult.questions.length === 0) {
        showMessage(
          "warning",
          "No questions were detected. Add questions manually.",
        );
      } else if (detectedResult.usedFallback) {
        showMessage(
          "warning",
          `${detectedResult.questions.length} paragraph(s) were detected. Please check them before generating the assignment.`,
        );
      } else {
        showMessage(
          "success",
          `${detectedResult.questions.length} question(s) detected successfully from the ${extension.toUpperCase()} file.`,
        );
      }
    } catch (error) {
      console.error("File reading error:", error);

      setQuestions([]);

      showMessage(
        "error",
        "Unable to read this file. Please select another PDF or DOCX file.",
      );
    } finally {
      setIsReading(false);
      event.target.value = "";
    }
  };

  const updateQuestion = (index, value) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    );
  };

  const addQuestion = () => {
    const newQuestionIndex = questions.length;

    setQuestions((currentQuestions) => [...currentQuestions, ""]);

    showMessage("info", "A new blank question has been added.");

    window.setTimeout(() => {
      const newQuestion = questionRefs.current[newQuestionIndex];

      if (!newQuestion) {
        return;
      }

      newQuestion.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      newQuestion.querySelector("textarea")?.focus();
    }, 100);
  };

  const deleteQuestion = (index) => {
    setQuestions((currentQuestions) =>
      currentQuestions.filter((_, questionIndex) => questionIndex !== index),
    );

    questionRefs.current.splice(index, 1);

    showMessage("info", "Question removed.");
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= questions.length) {
      return;
    }

    setQuestions((currentQuestions) => {
      const reorderedQuestions = [...currentQuestions];

      [reorderedQuestions[index], reorderedQuestions[newIndex]] = [
        reorderedQuestions[newIndex],
        reorderedQuestions[index],
      ];

      return reorderedQuestions;
    });

    showMessage(
      "info",
      `Question moved ${direction === "up" ? "up" : "down"}.`,
    );
  };

  const clearAllQuestions = () => {
    setQuestions([]);
    setFileName("");
    setFileType("");
    questionRefs.current = [];

    showMessage("info", "All questions have been cleared.");
  };

  const createBorder = () => ({
    style: BorderStyle.SINGLE,
    size: 1,
    color: "808080",
  });

  const createTableBorders = () => {
    const border = createBorder();

    return {
      top: border,
      bottom: border,
      left: border,
      right: border,
      insideHorizontal: border,
      insideVertical: border,
    };
  };

  const createCell = ({
    text = "",
    width = 80,
    bold = false,
    blankLines = 0,
  }) => {
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
  };

  const createDetailsTable = () => {
    const detailRows = [
      ["Course Name", details.courseName],
      ["Full Name", details.fullName],
      ["Student ID", details.studentId],
      ["Division", details.division],
      ["Subject", details.subject],
      ["Subject Code", details.subjectCode],
      ["Assignment Number", details.assignmentNumber],
    ];

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: createTableBorders(),
      rows: detailRows.map(
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
  };

  const createQuestionTable = (question, index) => {
    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            createCell({
              text: `Q-${index + 1}`,
              width: 20,
              bold: true,
            }),
            createCell({
              text: question,
              width: 80,
            }),
          ],
        }),
        new TableRow({
          children: [
            createCell({
              text: "Code",
              width: 20,
              bold: true,
            }),
            createCell({
              text: "",
              width: 80,
              blankLines: 8,
            }),
          ],
        }),
        new TableRow({
          children: [
            createCell({
              text: "Output",
              width: 20,
              bold: true,
            }),
            createCell({
              text: "",
              width: 80,
              blankLines: 6,
            }),
          ],
        }),
      ],
    });
  };

  const validateForm = () => {
    const requiredFields = [
      {
        label: "Course Name",
        value: details.courseName,
      },
      {
        label: "Full Name",
        value: details.fullName,
      },
      {
        label: "Student ID",
        value: details.studentId,
      },
      {
        label: "Division",
        value: details.division,
      },
      {
        label: "Subject",
        value: details.subject,
      },
      {
        label: "Subject Code",
        value: details.subjectCode,
      },
      {
        label: "Assignment Number",
        value: details.assignmentNumber,
      },
    ];

    const missingField = requiredFields.find((field) => !field.value.trim());

    if (missingField) {
      showMessage("error", `Please enter ${missingField.label}.`);

      return false;
    }

    const validQuestions = questions.filter(
      (question) => question.trim() !== "",
    );

    if (validQuestions.length === 0) {
      showMessage(
        "error",
        "Please upload a file or add at least one question.",
      );

      return false;
    }

    return true;
  };

  const openPreview = () => {
    if (!validateForm()) {
      return;
    }

    setShowPreview(true);
  };

  const generateAssignment = async () => {
    if (!validateForm()) {
      return;
    }

    const validQuestions = questions
      .map((question) => question.trim())
      .filter(Boolean);

    try {
      setIsGenerating(true);

      showMessage("info", "Generating your assignment Word file...");

      const documentChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 120,
          },
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
          spacing: {
            after: 300,
          },
          children: [
            new TextRun({
              text: details.subject,
              bold: true,
              size: 26,
              font: "Times New Roman",
            }),
          ],
        }),

        createDetailsTable(),

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
        documentChildren.push(
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
        );

        documentChildren.push(createQuestionTable(question, index));

        documentChildren.push(
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

      const assignmentDocument = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: documentChildren,
          },
        ],
      });

      const documentBlob = await Packer.toBlob(assignmentDocument);

      const safeSubjectCode = details.subjectCode
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, "-")
        .trim();

      const safeStudentId = details.studentId
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, "-")
        .trim();

      const generatedFileName = `${safeStudentId}-${safeSubjectCode}-Assignment-${details.assignmentNumber}.docx`;

      saveAs(documentBlob, generatedFileName);

      setShowPreview(false);

      showMessage("success", "Assignment Word file generated successfully.");
    } catch (error) {
      console.error("Document generation error:", error);

      showMessage(
        "error",
        "Something went wrong while generating the Word file.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const messageStyles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  const validPreviewQuestions = questions.filter(
    (question) => question.trim() !== "",
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}

      <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 px-4 pb-24 pt-12 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 backdrop-blur">
            Smart PDF and Word Assignment Tool
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Assignment Generator
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
            Upload the teacher&apos;s PDF or Word file, verify the detected
            questions and generate a properly formatted assignment document.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-14 max-w-5xl space-y-6 px-4 pb-12">
        {/* Upload section */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              1
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Upload Question File
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload the PDF or DOCX file provided by your teacher.
              </p>
            </div>
          </div>

          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 px-6 py-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={isReading}
              onChange={handleFileUpload}
            />

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-200">
              ↑
            </div>

            <span className="text-base font-bold text-indigo-700">
              {isReading ? "Reading File..." : "Choose PDF or Word File"}
            </span>

            <span className="mt-2 break-all text-sm text-slate-500">
              {fileName || "PDF and DOCX files are supported"}
            </span>

            {fileType && (
              <span className="mt-3 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                {fileType} selected
              </span>
            )}
          </label>
        </section>

        {/* Assignment details */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">
              2
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Assignment Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Course name, your name, ID and division are saved in this
                browser.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              label="Course Name"
              name="courseName"
              value={details.courseName}
              placeholder="Example: BCA"
              onChange={handleDetailsChange}
            />

            <FormInput
              label="Full Name"
              name="fullName"
              value={details.fullName}
              placeholder="Enter your full name"
              onChange={handleDetailsChange}
            />

            <FormInput
              label="Student ID"
              name="studentId"
              value={details.studentId}
              placeholder="Example: 24BCA196"
              onChange={handleDetailsChange}
            />

            <FormInput
              label="Division"
              name="division"
              value={details.division}
              placeholder="Example: 3"
              onChange={handleDetailsChange}
            />

            <FormInput
              label="Subject"
              name="subject"
              value={details.subject}
              placeholder="Enter subject name"
              onChange={handleDetailsChange}
            />

            <FormInput
              label="Subject Code"
              name="subjectCode"
              value={details.subjectCode}
              placeholder="Example: CAUC301"
              onChange={handleDetailsChange}
            />

            <FormInput
              label="Assignment Number"
              name="assignmentNumber"
              value={details.assignmentNumber}
              placeholder="Example: 1"
              onChange={handleDetailsChange}
            />
          </div>
        </section>

        {/* Questions section */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold text-white">
                3
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Detected Questions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Check, edit and reorder every question before generating.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllQuestions}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Clear All
                </button>
              )}

              <button
                type="button"
                onClick={addQuestion}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                + Add Question
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <div className="text-4xl">📄</div>

              <p className="mt-4 font-semibold text-slate-700">
                No questions available
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Upload a PDF or Word file, or add a question manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  ref={(element) => {
                    questionRefs.current[index] = element;
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-md sm:p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
                      Question {index + 1}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveQuestion(index, "up")}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑ Up
                      </button>

                      <button
                        type="button"
                        disabled={index === questions.length - 1}
                        onClick={() => moveQuestion(index, "down")}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↓ Down
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteQuestion(index)}
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows="4"
                    value={question}
                    placeholder="Enter the complete question here..."
                    onChange={(event) =>
                      updateQuestion(index, event.target.value)
                    }
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Status message */}

        {message.text && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
              messageStyles[message.type] || messageStyles.info
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Preview and download buttons */}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isReading || isGenerating}
            onClick={openPreview}
            className="w-full rounded-2xl border border-indigo-200 bg-white px-6 py-4 text-base font-bold text-indigo-700 shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-lg"
          >
            Preview Assignment
          </button>

          <button
            type="button"
            disabled={isGenerating || isReading}
            onClick={generateAssignment}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-lg"
          >
            {isGenerating
              ? "Generating Word File..."
              : "Download Assignment Word File"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500">
          Your uploaded file is processed inside your browser. It is not
          uploaded to a database.
        </p>
      </main>

      {/* Preview modal */}

      {showPreview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPreview(false);
            }
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Assignment Preview
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Check before downloading
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto bg-slate-100 p-3 sm:p-6">
              <div className="mx-auto max-w-3xl bg-white p-5 shadow-md sm:p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold uppercase text-slate-900">
                    Assignment {details.assignmentNumber}
                  </h3>

                  <p className="mt-1 font-semibold text-slate-700">
                    {details.subject}
                  </p>
                </div>

                <div className="mt-6 overflow-hidden border border-slate-400 text-sm">
                  <PreviewDetailRow
                    label="Course Name"
                    value={details.courseName}
                  />

                  <PreviewDetailRow
                    label="Full Name"
                    value={details.fullName}
                  />

                  <PreviewDetailRow
                    label="Student ID"
                    value={details.studentId}
                  />

                  <PreviewDetailRow label="Division" value={details.division} />

                  <PreviewDetailRow label="Subject" value={details.subject} />

                  <PreviewDetailRow
                    label="Subject Code"
                    value={details.subjectCode}
                  />

                  <PreviewDetailRow
                    label="Assignment Number"
                    value={details.assignmentNumber}
                    last
                  />
                </div>

                <div className="mt-7 space-y-7">
                  {validPreviewQuestions.map((question, index) => (
                    <div key={index}>
                      <h4 className="mb-2 font-bold text-slate-900">
                        Question {index + 1}
                      </h4>

                      <div className="border border-slate-500 text-sm">
                        <div className="grid grid-cols-[85px_1fr] border-b border-slate-500">
                          <div className="border-r border-slate-500 p-3 font-bold">
                            Q-{index + 1}
                          </div>

                          <div className="p-3 leading-6">{question}</div>
                        </div>

                        <div className="grid grid-cols-[85px_1fr] border-b border-slate-500">
                          <div className="border-r border-slate-500 p-3 font-bold">
                            Code
                          </div>

                          <div className="h-32 bg-white" />
                        </div>

                        <div className="grid grid-cols-[85px_1fr]">
                          <div className="border-r border-slate-500 p-3 font-bold">
                            Output
                          </div>

                          <div className="h-24 bg-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-slate-200 bg-white p-4 sm:grid-cols-2 sm:px-7">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Continue Editing
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={generateAssignment}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-bold text-white transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating
                  ? "Generating Word File..."
                  : "Download Word File"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}

      <footer className="border-t border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="grid md:grid-cols-2">
              {/* Developer */}

              <div className="flex items-center gap-4 border-b border-slate-200 p-4 md:border-b-0 md:border-r">
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <img
                    src="/manav-rabadiya.jpeg"
                    alt="Manav Rabadiya"
                    className="h-16 w-16 rounded-xl border-2 border-white object-cover shadow-md transition hover:scale-105"
                  />
                </a>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Developed By
                  </p>

                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-base font-bold text-slate-900 transition hover:text-indigo-600"
                  >
                    Manav Rabadiya
                  </a>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    BCA Student and Frontend Developer
                  </p>

                  <a
                    href={PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    View Portfolio ↗
                  </a>
                </div>
              </div>

              {/* DEVLOKS */}

              <div className="flex items-center gap-4 p-4">
                <a
                  href={DEVLOKS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-md transition hover:scale-105">
                    <img
                      src="/devloks-favicon.png"
                      alt="DEVLOKS Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </a>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Presented By
                  </p>

                  <a
                    href={DEVLOKS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-base font-bold text-slate-900 transition hover:text-violet-600"
                  >
                    DEVLOKS
                  </a>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Modern websites and digital solutions
                  </p>

                  <a
                    href={DEVLOKS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                  >
                    Visit DEVLOKS ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">
            © {new Date().getFullYear()} Assignment Generator · Developed by{" "}
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Manav Rabadiya
            </a>{" "}
            · Presented by{" "}
            <a
              href={DEVLOKS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-600 hover:underline"
            >
              DEVLOKS
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FormInput({ label, name, value, placeholder, onChange }) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}

function PreviewDetailRow({ label, value, last = false }) {
  return (
    <div
      className={`grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] ${
        last ? "" : "border-b border-slate-400"
      }`}
    >
      <div className="border-r border-slate-400 p-2.5 font-bold">{label}</div>

      <div className="min-w-0 break-words p-2.5">{value}</div>
    </div>
  );
}

export default App;
