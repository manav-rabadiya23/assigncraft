import { useEffect, useRef, useState } from "react";

import "./App.css";
import AssignmentDetailsSection from "./components/AssignmentDetailsSection";
import DocumentOptions from "./components/DocumentOptions";
import MessageBanner from "./components/MessageBanner";
import PreviewModal from "./components/PreviewModal";
import QuestionsSection from "./components/QuestionsSection";
import SiteFooter from "./components/SiteFooter";
import UploadSection from "./components/UploadSection";
import { DEFAULT_DOCUMENT_OPTIONS } from "./constants/defaults";
import { extractTextFromDocx } from "./utils/docxExtractor";
import {
  downloadAssignmentPdf,
  printAssignmentPdf,
} from "./utils/pdfGenerator";
import { extractTextFromPdf } from "./utils/pdfExtractor";
import { getSavedProfile, saveProfile } from "./utils/profileStorage";
import { detectQuestions } from "./utils/questionParser";
import { generateWordAssignment } from "./utils/wordGenerator";

function App() {
  const [details, setDetails] = useState(getSavedProfile);
  const [questions, setQuestions] = useState([]);
  const [documentOptions, setDocumentOptions] = useState(
    DEFAULT_DOCUMENT_OPTIONS,
  );
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const questionRefs = useRef([]);

  useEffect(() => {
    saveProfile(details);
  }, [
    details.courseName,
    details.fullName,
    details.studentId,
    details.division,
  ]);

  useEffect(() => {
    if (!showPreview) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowPreview(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showPreview]);

  const showMessage = (type, text) => setMessage({ type, text });

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const supported = ["pdf", "docx"];

    if (!supported.includes(extension)) {
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
      setProgressMessage(`Reading ${extension.toUpperCase()} file...`);
      showMessage(
        "info",
        `Reading the ${extension.toUpperCase()} file and detecting questions...`,
      );

      let extractedText = "";
      let usedOcr = false;

      if (extension === "pdf") {
        const result = await extractTextFromPdf(file, {
          onProgress: ({ message: progress }) => setProgressMessage(progress),
        });
        extractedText = result.text;
        usedOcr = result.usedOcr;
      } else {
        extractedText = await extractTextFromDocx(file);
      }

      if (!extractedText.trim()) {
        setQuestions([]);
        showMessage("warning", "No readable text was found in this file.");
        return;
      }

      const detected = detectQuestions(extractedText);
      setQuestions(detected.questions);
      questionRefs.current = [];

      if (!detected.questions.length) {
        showMessage(
          "warning",
          "No questions were detected. Add questions manually or verify the source file.",
        );
      } else if (detected.confidence < 80 || detected.usedFallback) {
        showMessage(
          "warning",
          `${detected.questions.length} question(s) detected with ${detected.confidence}% confidence${usedOcr ? " using OCR" : ""}. Please verify them before generating.`,
        );
      } else {
        showMessage(
          "success",
          `${detected.questions.length} question(s) detected successfully (${detected.confidence}% confidence${usedOcr ? ", OCR used" : ""}).`,
        );
      }
    } catch (error) {
      console.error("File reading error:", error);
      setQuestions([]);
      showMessage(
        "error",
        "Unable to read this file. Please try another PDF or DOCX file.",
      );
    } finally {
      setIsReading(false);
      setProgressMessage("");
      event.target.value = "";
    }
  };

  const focusQuestion = (index) => {
    window.setTimeout(() => {
      const target = questionRefs.current[index];
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.querySelector("textarea")?.focus();
    }, 80);
  };

  const updateQuestion = (index, value) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    );
  };

  const insertQuestion = (index) => {
    setQuestions((current) => {
      const next = [...current];
      next.splice(index, 0, "");
      return next;
    });
    showMessage("info", `Blank question added as Question ${index + 1}.`);
    focusQuestion(index);
  };

  const addQuestionAtEnd = () => insertQuestion(questions.length);
  const addQuestionBefore = (index) => insertQuestion(index);
  const addQuestionAfter = (index) => insertQuestion(index + 1);

  const deleteQuestion = (index) => {
    setQuestions((current) =>
      current.filter((_, questionIndex) => questionIndex !== index),
    );
    questionRefs.current.splice(index, 1);
    showMessage(
      "info",
      "Question removed. Remaining questions were renumbered automatically.",
    );
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    setQuestions((current) => {
      const reordered = [...current];
      [reordered[index], reordered[newIndex]] = [
        reordered[newIndex],
        reordered[index],
      ];
      return reordered;
    });

    showMessage(
      "info",
      `Question moved ${direction}. Numbering was updated automatically.`,
    );
  };

  const clearAllQuestions = () => {
    setQuestions([]);
    setFileName("");
    setFileType("");
    questionRefs.current = [];
    showMessage("info", "All questions have been cleared.");
  };

  const toggleHeader = () => {
    setDocumentOptions((current) => ({
      ...current,
      showHeaderEveryPage: !current.showHeaderEveryPage,
    }));
  };

  const toggleHeaderField = (field) => {
    setDocumentOptions((current) => ({
      ...current,
      headerFields: {
        ...current.headerFields,
        [field]: !current.headerFields[field],
      },
    }));
  };

  const togglePageNumbers = () => {
    setDocumentOptions((current) => ({
      ...current,
      showPageNumbers: !current.showPageNumbers,
    }));
  };

  const validateForm = () => {
    const required = [
      ["Course Name", details.courseName],
      ["Full Name", details.fullName],
      ["Student ID", details.studentId],
      ["Division", details.division],
      ["Subject", details.subject],
      ["Subject Code", details.subjectCode],
      ["Assignment Number", details.assignmentNumber],
    ];

    const missing = required.find(([, value]) => !value.trim());
    if (missing) {
      showMessage("error", `Please enter ${missing[0]}.`);
      return false;
    }

    if (!questions.some((question) => question.trim())) {
      showMessage(
        "error",
        "Please upload a file or add at least one question.",
      );
      return false;
    }

    if (!Object.values(documentOptions.headerFields).some(Boolean)) {
      showMessage("error", "Select at least one assignment detail to display.");
      return false;
    }

    return true;
  };

  const payload = () => ({ details, questions, options: documentOptions });

  const openPreview = () => {
    if (validateForm()) setShowPreview(true);
  };

  const downloadWord = async () => {
    if (!validateForm()) return;
    try {
      setIsGenerating(true);
      showMessage("info", "Generating Word file...");
      await generateWordAssignment(payload());
      showMessage("success", "Assignment Word file generated successfully.");
    } catch (error) {
      console.error(error);
      showMessage(
        "error",
        "Something went wrong while generating the Word file.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (!validateForm()) return;
    try {
      setIsGenerating(true);
      downloadAssignmentPdf(payload());
      showMessage("success", "Assignment PDF generated successfully.");
    } catch (error) {
      console.error(error);
      showMessage("error", "Something went wrong while generating the PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const printPdf = () => {
    if (!validateForm()) return;
    try {
      printAssignmentPdf(payload());
    } catch (error) {
      console.error(error);
      showMessage("error", "Unable to open the printable PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-12 text-center">
          <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 backdrop-blur">
            Smart PDF, OCR and Word Assignment Tool
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AssignCraft
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
            Upload the teacher&apos;s PDF or Word file, verify detected
            questions, customize document options and export to Word or PDF.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-14 max-w-5xl space-y-6 px-4 pb-12">
        <UploadSection
          isReading={isReading}
          fileName={fileName}
          fileType={fileType}
          onUpload={handleFileUpload}
          progressMessage={progressMessage}
        />
        <AssignmentDetailsSection
          details={details}
          onChange={handleDetailsChange}
        />
        <DocumentOptions
          options={documentOptions}
          onToggleHeader={toggleHeader}
          onToggleHeaderField={toggleHeaderField}
          onTogglePageNumbers={togglePageNumbers}
        />
        <QuestionsSection
          questions={questions}
          questionRefs={questionRefs}
          onUpdate={updateQuestion}
          onAddEnd={addQuestionAtEnd}
          onAddBefore={addQuestionBefore}
          onAddAfter={addQuestionAfter}
          onDelete={deleteQuestion}
          onMove={moveQuestion}
          onClear={clearAllQuestions}
        />

        <MessageBanner message={message} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            disabled={isReading || isGenerating}
            onClick={openPreview}
            className="rounded-2xl border border-indigo-200 bg-white px-5 py-4 font-bold text-indigo-700 shadow-lg shadow-slate-200/60 transition hover:bg-indigo-50 disabled:opacity-60"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={isReading || isGenerating}
            onClick={downloadWord}
            className="rounded-2xl bg-indigo-600 px-5 py-4 font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60"
          >
            Download Word
          </button>
          <button
            type="button"
            disabled={isReading || isGenerating}
            onClick={downloadPdf}
            className="rounded-2xl bg-violet-600 px-5 py-4 font-bold text-white shadow-lg transition hover:bg-violet-700 disabled:opacity-60"
          >
            Download PDF
          </button>
          <button
            type="button"
            disabled={isReading || isGenerating}
            onClick={printPdf}
            className="rounded-2xl bg-slate-800 px-5 py-4 font-bold text-white shadow-lg transition hover:bg-slate-900 disabled:opacity-60"
          >
            Print
          </button>
        </div>

        <p className="text-center text-xs text-slate-500">
          Normal PDF/DOCX processing stays in your browser. OCR also runs
          locally in the browser with Tesseract.js.
        </p>
      </main>

      {showPreview && (
        <PreviewModal
          details={details}
          questions={questions}
          options={documentOptions}
          onClose={() => setShowPreview(false)}
          onDownloadWord={downloadWord}
          onDownloadPdf={downloadPdf}
          onPrint={printPdf}
          isGenerating={isGenerating}
        />
      )}

      <SiteFooter />
    </div>
  );
}

export default App;
