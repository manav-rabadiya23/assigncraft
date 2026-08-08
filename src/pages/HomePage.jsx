import { useEffect, useRef, useState } from "react";

import "../App.css";
import AssignmentDetailsSection from "../components/AssignmentDetailsSection";
import DocumentOptions from "../components/DocumentOptions";
import MessageBanner from "../components/MessageBanner";
import PreviewModal from "../components/PreviewModal";
import QuestionsSection from "../components/QuestionsSection";
import SiteFooter from "../components/SiteFooter";
import UploadSection from "../components/UploadSection";
import { DEFAULT_DOCUMENT_OPTIONS } from "../constants/defaults";
import { extractTextFromDocx } from "../utils/docxExtractor";
import {
  downloadAssignmentPdf,
  printAssignmentPdf,
} from "../utils/pdfGenerator";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { getSavedProfile, saveProfile } from "../utils/profileStorage";
import { detectQuestions } from "../utils/questionParser";
import { parsePastedQuestions } from "../utils/pastedQuestions";
import { generateWordAssignment } from "../utils/wordGenerator";
import Header from "../components/Header";

function HomePage() {
  const [details, setDetails] = useState(getSavedProfile);
  const [customDetails, setCustomDetails] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [documentOptions, setDocumentOptions] = useState(
    DEFAULT_DOCUMENT_OPTIONS,
  );
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pastedQuestions, setPastedQuestions] = useState("");
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

  const addCustomDetail = ({ label, value }) => {
    const cleanLabel = label.trim();
    const cleanValue = value.trim();

    if (!cleanLabel) {
      showMessage("warning", "Please enter a custom detail name.");
      return false;
    }

    const duplicate = customDetails.some(
      (item) => item.label.toLowerCase() === cleanLabel.toLowerCase(),
    );

    if (duplicate) {
      showMessage("warning", "A custom detail with this name already exists.");
      return false;
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const newDetail = {
      id,
      label: cleanLabel,
      value: cleanValue,
    };

    setCustomDetails((current) => [...current, newDetail]);

    setDocumentOptions((current) => ({
      ...current,
      headerFields: {
        ...current.headerFields,
        [`custom:${id}`]: true,
      },
    }));

    showMessage("success", `"${cleanLabel}" added to Assignment Details.`);
    return true;
  };

  const updateCustomDetail = (id, changes) => {
    const cleanLabel = changes.label.trim();
    const cleanValue = changes.value.trim();

    if (!cleanLabel) {
      showMessage("warning", "Custom detail name cannot be empty.");
      return false;
    }

    const duplicate = customDetails.some(
      (item) =>
        item.id !== id && item.label.toLowerCase() === cleanLabel.toLowerCase(),
    );

    if (duplicate) {
      showMessage("warning", "A custom detail with this name already exists.");
      return false;
    }

    setCustomDetails((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, label: cleanLabel, value: cleanValue }
          : item,
      ),
    );

    showMessage("success", `"${cleanLabel}" updated.`);
    return true;
  };

  const deleteCustomDetail = (id) => {
    const target = customDetails.find((item) => item.id === id);

    setCustomDetails((current) => current.filter((item) => item.id !== id));

    setDocumentOptions((current) => {
      const nextHeaderFields = { ...current.headerFields };
      delete nextHeaderFields[`custom:${id}`];

      return {
        ...current,
        headerFields: nextHeaderFields,
      };
    });

    if (target) {
      showMessage("info", `"${target.label}" removed.`);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const supportedFiles = files.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return ["pdf", "docx"].includes(extension);
    });

    if (!supportedFiles.length) {
      showMessage("error", "Please upload valid PDF or DOCX files.");
      event.target.value = "";
      return;
    }

    if (supportedFiles.length !== files.length) {
      showMessage(
        "warning",
        "Some unsupported files were skipped. Only PDF and DOCX files are supported.",
      );
    }

    try {
      setIsReading(true);

      const detectedFromAllFiles = [];
      const newFileRecords = [];
      let lowConfidenceCount = 0;
      let totalOcrFiles = 0;

      for (
        let fileIndex = 0;
        fileIndex < supportedFiles.length;
        fileIndex += 1
      ) {
        const file = supportedFiles[fileIndex];
        const extension = file.name.split(".").pop()?.toLowerCase();

        setProgressMessage(
          `Reading file ${fileIndex + 1} of ${supportedFiles.length}: ${file.name}`,
        );

        let extractedText = "";
        let usedOcr = false;

        try {
          if (extension === "pdf") {
            const result = await extractTextFromPdf(file, {
              onProgress: ({ message: progress }) =>
                setProgressMessage(
                  `${fileIndex + 1}/${supportedFiles.length} · ${file.name} · ${progress}`,
                ),
            });
            extractedText = result.text;
            usedOcr = result.usedOcr;
          } else {
            extractedText = await extractTextFromDocx(file);
          }

          const detected = extractedText.trim()
            ? detectQuestions(extractedText)
            : { questions: [], confidence: 0, usedFallback: false };

          if (usedOcr) totalOcrFiles += 1;
          if (
            detected.questions.length > 0 &&
            (detected.confidence < 80 || detected.usedFallback)
          ) {
            lowConfidenceCount += 1;
          }

          detectedFromAllFiles.push(...detected.questions);
          newFileRecords.push({
            id: `${file.name}-${file.lastModified}-${fileIndex}-${Date.now()}`,
            name: file.name,
            type: extension.toUpperCase(),
            questionCount: detected.questions.length,
            usedOcr,
          });
        } catch (fileError) {
          console.error(`File reading error for ${file.name}:`, fileError);
          newFileRecords.push({
            id: `${file.name}-${file.lastModified}-${fileIndex}-${Date.now()}`,
            name: file.name,
            type: extension.toUpperCase(),
            questionCount: 0,
            usedOcr: false,
          });
        }
      }

      setUploadedFiles((current) => [...current, ...newFileRecords]);
      setQuestions((current) => [...current, ...detectedFromAllFiles]);
      questionRefs.current = [];

      if (!detectedFromAllFiles.length) {
        showMessage(
          "warning",
          "The files were read, but no questions were detected. You can paste or add questions manually.",
        );
      } else if (lowConfidenceCount > 0) {
        showMessage(
          "warning",
          `${detectedFromAllFiles.length} question(s) added from ${supportedFiles.length} file(s)${totalOcrFiles ? `; OCR used for ${totalOcrFiles} file(s)` : ""}. Please verify the detected questions.`,
        );
      } else {
        showMessage(
          "success",
          `${detectedFromAllFiles.length} question(s) added from ${supportedFiles.length} file(s)${totalOcrFiles ? `; OCR used for ${totalOcrFiles} file(s)` : ""}.`,
        );
      }
    } finally {
      setIsReading(false);
      setProgressMessage("");
      event.target.value = "";
    }
  };

  const removeUploadedFile = (fileId) => {
    setUploadedFiles((current) => current.filter((file) => file.id !== fileId));
    showMessage(
      "info",
      "File removed from the uploaded file list. Already extracted questions are kept.",
    );
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
    showMessage(
      "info",
      "Uploaded file list cleared. Already extracted questions are kept.",
    );
  };

  const addPastedQuestions = () => {
    const parsedQuestions = parsePastedQuestions(pastedQuestions);

    if (!parsedQuestions.length) {
      showMessage("warning", "Paste at least one valid question first.");
      return;
    }

    setQuestions((current) => [...current, ...parsedQuestions]);
    setPastedQuestions("");
    questionRefs.current = [];
    showMessage(
      "success",
      `${parsedQuestions.length} pasted question(s) added successfully.`,
    );
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

  const reorderQuestion = (sourceIndex, targetIndex) => {
    if (
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex >= questions.length ||
      targetIndex >= questions.length ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    setQuestions((current) => {
      const reordered = [...current];
      const [movedQuestion] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedQuestion);
      return reordered;
    });

    questionRefs.current = [];
    showMessage(
      "info",
      "Question reordered by drag and drop. Numbering was updated automatically.",
    );
  };

  const clearAllQuestions = () => {
    setQuestions([]);
    setUploadedFiles([]);
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

  const toggleCode = () => {
    const hasEnabledCustom = (documentOptions.customAnswerSections || []).some(
      (section) => section.enabled,
    );

    if (
      documentOptions.includeCode &&
      !documentOptions.includeOutput &&
      !hasEnabledCustom
    ) {
      showMessage("warning", "At least one answer section must remain selected.");
      return;
    }

    setDocumentOptions((current) => ({
      ...current,
      includeCode: !current.includeCode,
    }));
  };

  const toggleOutput = () => {
    const hasEnabledCustom = (documentOptions.customAnswerSections || []).some(
      (section) => section.enabled,
    );

    if (
      documentOptions.includeOutput &&
      !documentOptions.includeCode &&
      !hasEnabledCustom
    ) {
      showMessage("warning", "At least one answer section must remain selected.");
      return;
    }

    setDocumentOptions((current) => ({
      ...current,
      includeOutput: !current.includeOutput,
    }));
  };

  const addCustomAnswerSection = (name) => {
    const cleanName = name.trim();

    if (!cleanName) {
      showMessage("warning", "Please enter a custom answer section name.");
      return false;
    }

    const reservedNames = ["code", "output"];
    const duplicateCustom = (documentOptions.customAnswerSections || []).some(
      (section) => section.label.toLowerCase() === cleanName.toLowerCase(),
    );

    if (
      reservedNames.includes(cleanName.toLowerCase()) ||
      duplicateCustom
    ) {
      showMessage("warning", `An answer section named "${cleanName}" already exists.`);
      return false;
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setDocumentOptions((current) => ({
      ...current,
      customAnswerSections: [
        ...(current.customAnswerSections || []),
        { id, label: cleanName, enabled: true },
      ],
    }));

    showMessage("success", `"${cleanName}" added to Answer format.`);
    return true;
  };

  const toggleCustomAnswerSection = (id) => {
    setDocumentOptions((current) => {
      const sections = current.customAnswerSections || [];
      const target = sections.find((section) => section.id === id);
      if (!target) return current;

      const enabledCount =
        Number(current.includeCode) +
        Number(current.includeOutput) +
        sections.filter((section) => section.enabled).length;

      if (target.enabled && enabledCount <= 1) {
        showMessage("warning", "At least one answer section must remain selected.");
        return current;
      }

      return {
        ...current,
        customAnswerSections: sections.map((section) =>
          section.id === id
            ? { ...section, enabled: !section.enabled }
            : section,
        ),
      };
    });
  };

  const renameCustomAnswerSection = (id, name) => {
    const cleanName = name.trim();

    if (!cleanName) {
      showMessage("warning", "Answer section name cannot be empty.");
      return false;
    }

    const reservedNames = ["code", "output"];
    const duplicate = (documentOptions.customAnswerSections || []).some(
      (section) =>
        section.id !== id &&
        section.label.toLowerCase() === cleanName.toLowerCase(),
    );

    if (reservedNames.includes(cleanName.toLowerCase()) || duplicate) {
      showMessage("warning", `An answer section named "${cleanName}" already exists.`);
      return false;
    }

    setDocumentOptions((current) => ({
      ...current,
      customAnswerSections: (current.customAnswerSections || []).map((section) =>
        section.id === id ? { ...section, label: cleanName } : section,
      ),
    }));

    showMessage("success", `"${cleanName}" updated.`);
    return true;
  };

  const deleteCustomAnswerSection = (id) => {
    const target = (documentOptions.customAnswerSections || []).find(
      (section) => section.id === id,
    );

    setDocumentOptions((current) => ({
      ...current,
      customAnswerSections: (current.customAnswerSections || []).filter(
        (section) => section.id !== id,
      ),
    }));

    if (target) showMessage("info", `"${target.label}" removed from Answer format.`);
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
        "Please upload files, paste questions or add at least one question.",
      );
      return false;
    }

    if (!Object.values(documentOptions.headerFields).some(Boolean)) {
      showMessage("error", "Select at least one assignment detail to display.");
      return false;
    }

    return true;
  };

  const payload = () => ({
    details: { ...details, customDetails },
    questions,
    options: documentOptions,
  });

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
      <Header />

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
          uploadedFiles={uploadedFiles}
          onUpload={handleFileUpload}
          onRemoveFile={removeUploadedFile}
          onClearFiles={clearUploadedFiles}
          progressMessage={progressMessage}
          pastedQuestions={pastedQuestions}
          onPastedQuestionsChange={setPastedQuestions}
          onAddPastedQuestions={addPastedQuestions}
        />
        <AssignmentDetailsSection
          details={details}
          onChange={handleDetailsChange}
          customDetails={customDetails}
          onAddCustomDetail={addCustomDetail}
          onUpdateCustomDetail={updateCustomDetail}
          onDeleteCustomDetail={deleteCustomDetail}
        />
        <DocumentOptions
          options={documentOptions}
          customDetails={customDetails}
          onToggleHeader={toggleHeader}
          onToggleHeaderField={toggleHeaderField}
          onTogglePageNumbers={togglePageNumbers}
          onToggleCode={toggleCode}
          onToggleOutput={toggleOutput}
          onAddCustomAnswerSection={addCustomAnswerSection}
          onToggleCustomAnswerSection={toggleCustomAnswerSection}
          onRenameCustomAnswerSection={renameCustomAnswerSection}
          onDeleteCustomAnswerSection={deleteCustomAnswerSection}
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
          onReorder={reorderQuestion}
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
          details={{ ...details, customDetails }}
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

export default HomePage;
