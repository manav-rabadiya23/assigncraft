import SEO from "../components/SEO";

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../App.css";
import AssignmentDetailsSection from "../components/AssignmentDetailsSection";
import DocumentOptions from "../components/DocumentOptions";
import TextStyleSection from "../components/TextStyleSection";
import Header from "../components/Header";
import MessageBanner from "../components/MessageBanner";
import PreviewModal from "../components/PreviewModal";
import QuestionsSection from "../components/QuestionsSection";
import SiteFooter from "../components/SiteFooter";
import UploadSection from "../components/UploadSection";
import { WizardActions, WizardStepper } from "../components/WizardNav";
import WizardSummary from "../components/WizardSummary";
import { DEFAULT_DOCUMENT_OPTIONS } from "../constants/defaults";
import {
  downloadAssignmentPdf,
  printAssignmentPdf,
} from "../utils/pdfGenerator";
import { getSavedProfile, saveProfile } from "../utils/profileStorage";
import {
  QUESTION_FILE_LABEL,
  isSupportedQuestionFile,
  readQuestionFile,
} from "../utils/questionFileReader";
import { focusAndHighlight } from "../utils/focusTarget";
import { detectQuestions } from "../utils/questionParser";
import { parsePastedQuestions } from "../utils/pastedQuestions";
import { loadSavedTextStyle, saveTextStyle } from "../utils/textStyles";
import { generateWordAssignment } from "../utils/wordGenerator";

// The wizard step lives in the address (#step-2 ...), so the browser's Back and
// Forward buttons move between steps.
const stepFromHash = (hash) => {
  const match = /^#step-([1-4])$/.exec(hash || "");
  return match ? Number(match[1]) : 1;
};

function HomePage() {
  const navigate = useNavigate();
  const [detectionReport, setDetectionReport] = useState(null);
  const [details, setDetails] = useState(getSavedProfile);
  const [customDetails, setCustomDetails] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [documentOptions, setDocumentOptions] = useState(() => ({
    ...DEFAULT_DOCUMENT_OPTIONS,
    textStyle: loadSavedTextStyle(), // remembered on this device
  }));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pastedQuestions, setPastedQuestions] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const questionRefs = useRef([]);

  const location = useLocation();
  const step = stepFromHash(location.hash);
  const stepperRef = useRef(null);
  const previousStep = useRef(step);
  const skipScroll = useRef(false);

  const setStep = (target) =>
    navigate({ hash: target === 1 ? "" : `#step-${target}` });

  // Reloading the page empties the form, so always start again from step 1.
  useEffect(() => {
    if (location.hash.startsWith("#step-")) {
      navigate({ hash: "" }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to the top of the wizard when the step changes (unless an error is
  // already taking the user to a specific field).
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;

    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }

    stepperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    saveTextStyle(documentOptions.textStyle);
  }, [documentOptions.textStyle]);

  const setTextStyle = (textStyle) =>
    setDocumentOptions((current) => ({ ...current, textStyle }));

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
    setMessage({ type, text });
  };

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;

    setDetails((current) => ({
      ...current,
      [name]: value,
    }));
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

    showMessage(
      "success",
      `"${cleanLabel}" added to Assignment Details. Select it in Header or Footer if you want to display it there.`,
    );

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
          ? {
              ...item,
              label: cleanLabel,
              value: cleanValue,
            }
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
      const nextFooterFields = { ...current.footerFields };

      delete nextHeaderFields[`custom:${id}`];
      delete nextFooterFields[`custom:${id}`];

      return {
        ...current,
        headerFields: nextHeaderFields,
        footerFields: nextFooterFields,
        headerFieldOrder: (current.headerFieldOrder || []).filter(
          (key) => key !== `custom:${id}`,
        ),
        footerFieldOrder: (current.footerFieldOrder || []).filter(
          (key) => key !== `custom:${id}`,
        ),
      };
    });

    if (target) {
      showMessage("info", `"${target.label}" removed.`);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const supportedFiles = files.filter(isSupportedQuestionFile);

    if (!supportedFiles.length) {
      showMessage("error", `Please upload valid ${QUESTION_FILE_LABEL} files.`);
      event.target.value = "";
      return;
    }

    if (supportedFiles.length !== files.length) {
      showMessage(
        "warning",
        `Some unsupported files were skipped. Only ${QUESTION_FILE_LABEL} files are supported.`,
      );
    }

    try {
      setIsReading(true);

      const detectedFromAllFiles = [];
      const newFileRecords = [];

      const detectionWarnings = [];
      const reportFiles = [];
      let reportSnippet = "";
      let lowConfidenceCount = 0;
      setDetectionReport(null);
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
          const result = await readQuestionFile(file, {
            onProgress: ({ message: progress }) =>
              setProgressMessage(
                `${fileIndex + 1}/${supportedFiles.length} · ${file.name} · ${progress}`,
              ),
          });

          extractedText = result.text;
          usedOcr = result.usedOcr;

          const detected = extractedText.trim()
            ? detectQuestions(extractedText)
            : {
                questions: [],
                confidence: 0,
                usedFallback: false,
              };

          (detected.warnings || []).forEach((warning) =>
            detectionWarnings.push(`${file.name}: ${warning}`),
          );

          // Kept so the student can report a file that was not read well.
          const looksWrong =
            detected.questions.length === 0 ||
            detected.confidence < 85 ||
            detected.usedFallback ||
            (detected.warnings || []).length > 0;

          reportFiles.push({
            type: extension,
            questions: detected.questions.length,
            confidence: detected.confidence,
            style: detected.format || "none",
            usedOcr,
            warnings: (detected.warnings || []).slice(0, 4),
            looksWrong,
          });

          if (looksWrong && !reportSnippet) {
            reportSnippet = extractedText.slice(0, 1500);
          }

          if (usedOcr) {
            totalOcrFiles += 1;
          }

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

          reportFiles.push({
            type: extension,
            questions: 0,
            error: String(fileError?.message || fileError),
            looksWrong: true,
          });

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

      setDetectionReport(
        reportFiles.some((file) => file.looksWrong)
          ? { files: reportFiles, snippet: reportSnippet }
          : null,
      );

      questionRefs.current = [];

      if (!detectedFromAllFiles.length) {
        showMessage(
          "warning",
          "The files were read, but no questions were detected. You can paste or add questions manually.",
        );
      } else if (lowConfidenceCount > 0 || detectionWarnings.length > 0) {
        showMessage(
          "warning",
          `${detectedFromAllFiles.length} question(s) added from ${supportedFiles.length} file(s)${
            totalOcrFiles ? `; OCR used for ${totalOcrFiles} file(s)` : ""
          }. Please verify the detected questions.${
            detectionWarnings.length
              ? ` Note: ${detectionWarnings.slice(0, 2).join(" ")}`
              : ""
          }`,
        );
      } else {
        showMessage(
          "success",
          `${detectedFromAllFiles.length} question(s) added from ${supportedFiles.length} file(s)${
            totalOcrFiles ? `; OCR used for ${totalOcrFiles} file(s)` : ""
          }.`,
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

      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

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

    if (newIndex < 0 || newIndex >= questions.length) {
      return;
    }

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

  const toggleDetailsTable = () => {
    setDocumentOptions((current) => ({
      ...current,
      showDetailsTable: current.showDetailsTable === false,
    }));
  };

  const toggleTableField = (field) => {
    setDocumentOptions((current) => ({
      ...current,
      tableFields: {
        ...current.tableFields,
        [field]: !current.tableFields?.[field],
      },
    }));
  };

  const reorderTableField = (order) => {
    setDocumentOptions((current) => ({
      ...current,
      tableFieldOrder: order,
    }));
  };

  const setHeaderMode = (mode) => {
    setDocumentOptions((current) => ({
      ...current,
      headerMode: mode,
    }));
  };

  const setFooterMode = (mode) => {
    setDocumentOptions((current) => ({
      ...current,
      footerMode: mode,
    }));
  };

  const togglePageNumbers = () => {
    setDocumentOptions((current) => ({
      ...current,
      showPageNumbers: !current.showPageNumbers,
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

  const reorderHeaderField = (order) => {
    setDocumentOptions((current) => ({
      ...current,
      headerFieldOrder: order,
    }));
  };

  const toggleFooterField = (field) => {
    setDocumentOptions((current) => ({
      ...current,
      footerFields: {
        ...current.footerFields,
        [field]: !current.footerFields[field],
      },
    }));
  };

  const reorderFooterField = (order) => {
    setDocumentOptions((current) => ({
      ...current,
      footerFieldOrder: order,
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
      showMessage(
        "warning",
        "At least one answer section must remain selected.",
      );

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
      showMessage(
        "warning",
        "At least one answer section must remain selected.",
      );

      return;
    }

    setDocumentOptions((current) => ({
      ...current,
      includeOutput: !current.includeOutput,
    }));
  };

  const toggleSamples = () => {
    setDocumentOptions((current) => ({
      ...current,
      includeSamples: current.includeSamples === false,
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

    if (reservedNames.includes(cleanName.toLowerCase()) || duplicateCustom) {
      showMessage(
        "warning",
        `An answer section named "${cleanName}" already exists.`,
      );

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
        {
          id,
          label: cleanName,
          enabled: true,
        },
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
        showMessage(
          "warning",
          "At least one answer section must remain selected.",
        );

        return current;
      }

      return {
        ...current,
        customAnswerSections: sections.map((section) =>
          section.id === id
            ? {
                ...section,
                enabled: !section.enabled,
              }
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
      showMessage(
        "warning",
        `An answer section named "${cleanName}" already exists.`,
      );

      return false;
    }

    setDocumentOptions((current) => ({
      ...current,
      customAnswerSections: (current.customAnswerSections || []).map(
        (section) =>
          section.id === id
            ? {
                ...section,
                label: cleanName,
              }
            : section,
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

    if (target) {
      showMessage("info", `"${target.label}" removed from Answer format.`);
    }
  };

  // Shows the error AND takes the user to the place that needs fixing,
  // switching to the right step first when that field is on another step.
  const fail = (text, target, targetStep) => {
    showMessage("error", text);

    if (targetStep && targetStep !== step) {
      skipScroll.current = true;
      setStep(targetStep);
      window.setTimeout(() => focusAndHighlight(target), 150);
    } else {
      focusAndHighlight(target);
    }

    return false;
  };

  const validateDetailsStep = () => {
    const required = [
      ["Course Name", details.courseName, "courseName"],
      ["Full Name", details.fullName, "fullName"],
      ["Student ID", details.studentId, "studentId"],
      ["Division", details.division, "division"],
      ["Subject", details.subject, "subject"],
      ["Subject Code", details.subjectCode, "subjectCode"],
      ["Assignment Number", details.assignmentNumber, "assignmentNumber"],
    ];

    const missing = required.find(([, value]) => !value.trim());

    if (missing) {
      return fail(`Please enter ${missing[0]}.`, missing[2], 2);
    }

    return true;
  };

  const validateQuestionsStep = () => {
    if (!questions.some((question) => question.trim())) {
      return fail(
        "Please upload files, paste questions or add at least one question.",
        "upload-section",
        1,
      );
    }

    return true;
  };

  const validateLayoutStep = () => {
    const headerMode = documentOptions.headerMode || "none";
    const footerMode = documentOptions.footerMode || "none";

    const hasHeaderFields = Object.values(
      documentOptions.headerFields || {},
    ).some(Boolean);

    const hasFooterFields = Object.values(
      documentOptions.footerFields || {},
    ).some(Boolean);

    if (headerMode !== "none" && !hasHeaderFields) {
      return fail(
        "Select at least one detail for the header or set Header to Don't show.",
        "header-options",
        3,
      );
    }

    if (
      footerMode !== "none" &&
      !hasFooterFields &&
      !documentOptions.showPageNumbers
    ) {
      return fail(
        "Select at least one detail for the footer, enable Page Number, or set Footer to Don't show.",
        "footer-options",
        3,
      );
    }

    return true;
  };

  // Same checks and same order as before, used by Preview / Download / Print.
  const validateForm = () =>
    validateDetailsStep() && validateQuestionsStep() && validateLayoutStep();

  // Checks of each step; moving forward runs the checks of every step passed.
  const stepValidators = {
    1: validateQuestionsStep,
    2: validateDetailsStep,
    3: validateLayoutStep,
  };

  const goToStep = (target) => {
    if (target <= step) {
      setStep(target);
      return;
    }

    for (let current = step; current < target; current += 1) {
      if (stepValidators[current] && !stepValidators[current]()) return;
    }

    setStep(target);
  };

  const payload = () => ({
    details: {
      ...details,
      customDetails,
    },
    questions,
    options: documentOptions,
  });

  const openPreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
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
    <>
      {/* SEO metadata */}
      <SEO
        title="AssignCraft – PDF, Word & Assignment Generator"
        description="AssignCraft is a web-based assignment generator developed by Manav Rabadiya. Detect questions from PDF and Word files, customize assignments, and export them to Word or PDF."
        path="/"
        keywords="AssignCraft, assignment generator, PDF assignment generator, Word assignment generator, PDF to Word assignment, question detection, OCR assignment tool, DOCX assignment generator"
        breadcrumbs={[
          {
            name: "Home",
            path: "/",
          },
        ]}
      />

      <div className="min-h-screen bg-slate-100 text-slate-900">
        <Header />

        {/* Homepage Hero */}
        <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white">
          <div className="mx-auto max-w-5xl px-4 pb-24 pt-12 text-center">
            <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100 backdrop-blur">
              Smart PDF, OCR and Word Assignment Tool
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              PDF, Word & Assignment Generator
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
              AssignCraft is a web-based assignment generator developed by Manav
              Rabadiya. Upload PDF or Word question files, detect and organize
              questions, customize assignment details, and export your final
              assignment to Word or PDF.
            </p>
          </div>
        </header>

        <main className="mx-auto -mt-14 max-w-5xl space-y-6 px-4 pb-12">
          <WizardStepper step={step} onGo={goToStep} stepperRef={stepperRef} />

          {/* Step 1: questions */}
          <div className={step === 1 ? "space-y-6" : "hidden"}>
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

            {detectionReport && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-900">
                <p className="max-w-xl">
                  <span className="font-bold">
                    Questions not detected correctly?
                  </span>{" "}
                  Send me this file&apos;s details and I will add support for
                  its format.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/about#contact", {
                      state: { report: detectionReport },
                    })
                  }
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                >
                  Report this file format
                </button>
              </div>
            )}

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
            <WizardActions
              onNext={() => goToStep(2)}
              nextLabel="Next: Your details"
            />
          </div>

          {/* Step 2: student details */}
          <div className={step === 2 ? "space-y-6" : "hidden"}>
            <AssignmentDetailsSection
              details={details}
              onChange={handleDetailsChange}
              customDetails={customDetails}
              onAddCustomDetail={addCustomDetail}
              onUpdateCustomDetail={updateCustomDetail}
              onDeleteCustomDetail={deleteCustomDetail}
            />

            <MessageBanner message={message} />
            <WizardActions
              onBack={() => goToStep(1)}
              onNext={() => goToStep(3)}
              nextLabel="Next: Layout and style"
            />
          </div>

          {/* Step 3: layout and text style */}
          <div className={step === 3 ? "space-y-6" : "hidden"}>
            <DocumentOptions
              options={documentOptions}
              customDetails={customDetails}
              onToggleDetailsTable={toggleDetailsTable}
              onToggleTableField={toggleTableField}
              onReorderTableField={reorderTableField}
              onSetHeaderMode={setHeaderMode}
              onToggleHeaderField={toggleHeaderField}
              onReorderHeaderField={reorderHeaderField}
              onSetFooterMode={setFooterMode}
              onToggleFooterField={toggleFooterField}
              onReorderFooterField={reorderFooterField}
              onTogglePageNumbers={togglePageNumbers}
              onToggleCode={toggleCode}
              onToggleOutput={toggleOutput}
              onToggleSamples={toggleSamples}
              onAddCustomAnswerSection={addCustomAnswerSection}
              onToggleCustomAnswerSection={toggleCustomAnswerSection}
              onRenameCustomAnswerSection={renameCustomAnswerSection}
              onDeleteCustomAnswerSection={deleteCustomAnswerSection}
            />

            <TextStyleSection
              options={documentOptions}
              onChange={setTextStyle}
            />

            <MessageBanner message={message} />
            <WizardActions
              onBack={() => goToStep(2)}
              onNext={() => goToStep(4)}
              nextLabel="Next: Preview and download"
            />
          </div>

          {/* Step 4: preview and download */}
          <div className={step === 4 ? "space-y-6" : "hidden"}>
            <WizardSummary
              details={details}
              questions={questions}
              options={documentOptions}
              onEditStep={goToStep}
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

            <WizardActions onBack={() => goToStep(3)} />
          </div>

          <p className="text-center text-xs text-slate-500">
            Normal PDF/DOCX processing stays in your browser. OCR also runs
            locally in the browser with Tesseract.js.
          </p>
        </main>

        {showPreview && (
          <PreviewModal
            details={{
              ...details,
              customDetails,
            }}
            questions={questions}
            options={documentOptions}
            onClose={() => setShowPreview(false)}
            onDownloadWord={downloadWord}
            onDownloadPdf={downloadPdf}
            onPrint={printPdf}
            isGenerating={isGenerating}
          />
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          Developed by{" "}
          <a
            href="https://rabadiya-manav.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Manav Rabadiya
          </a>
        </p>

        <SiteFooter />
      </div>
    </>
  );
}

export default HomePage;
