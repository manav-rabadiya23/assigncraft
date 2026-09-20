import { useState } from "react";

import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";

import { extractTextFromDocx } from "../utils/docxExtractor";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { detectQuestions } from "../utils/questionParser";

import {
  cleanNotebookQuestion,
  compareTeacherQuestionsWithNotebook,
  continuePythonNotebook,
  createPythonNotebook,
  downloadNotebook,
  readNotebookFile,
} from "../utils/jupyterNotebook";

import { generateNotebookPdf } from "../utils/notebookPdf";

async function extractQuestionsFromTeacherFile(file, setProgress) {
  if (!file) {
    throw new Error("Please choose a PDF or DOCX question file.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!["pdf", "docx"].includes(extension)) {
    throw new Error("Only PDF and DOCX question files are supported.");
  }

  let text = "";

  if (extension === "pdf") {
    const result = await extractTextFromPdf(file, {
      onProgress: ({ message }) => setProgress?.(message || ""),
    });

    text = result.text || "";
  } else {
    setProgress?.("Reading Word question file...");

    text = await extractTextFromDocx(file);
  }

  const detected = detectQuestions(text);

  const questions = (detected.questions || [])
    .map(cleanNotebookQuestion)
    .filter(Boolean);

  if (!questions.length) {
    throw new Error(
      "The file was read, but no questions were detected. Please verify the teacher's file.",
    );
  }

  return questions;
}

function QuestionReview({
  questions,
  startNumber,
  onChange,
  onDelete,
  onAddAfter,
}) {
  if (!questions.length) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Verify Questions</h2>

        <p className="mt-1 text-sm text-slate-500">
          Each question becomes a Markdown cell followed by a blank Python code
          cell.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={`${startNumber}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
                Question {startNumber + index}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onAddAfter(index)}
                  className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  + After
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <textarea
              rows="4"
              value={question}
              onChange={(event) => onChange(index, event.target.value)}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <b>Markdown cell:</b> {startNumber + index}. Question
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <b>Python cell:</b> Empty code cell
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function JupyterToolsPage() {
  const [mode, setMode] = useState("create");

  const [createFile, setCreateFile] = useState(null);

  const [createQuestions, setCreateQuestions] = useState([]);

  const [studentDetails, setStudentDetails] = useState({
    assignmentNumber: "",
    name: "",
    id: "",
    subject: "PYTHON",
    course: "",
    division: "",
    semester: "",
  });

  const [oldNotebookFile, setOldNotebookFile] = useState(null);

  const [oldNotebook, setOldNotebook] = useState(null);

  const [oldNotebookInfo, setOldNotebookInfo] = useState(null);

  const [continueQuestionFile, setContinueQuestionFile] = useState(null);

  const [continueQuestions, setContinueQuestions] = useState([]);

  const [continueComparison, setContinueComparison] = useState(null);

  const [pdfNotebookFile, setPdfNotebookFile] = useState(null);

  const [pdfNotebook, setPdfNotebook] = useState(null);

  const [pdfNotebookInfo, setPdfNotebookInfo] = useState(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isReading, setIsReading] = useState(false);

  const [progress, setProgress] = useState("");

  const [message, setMessage] = useState("");

  const resetMessages = () => {
    setMessage("");
    setProgress("");
  };

  const updateStudentDetail = (field, value) => {
    setStudentDetails((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateQuestionFile = async (event) => {
    const file = event.target.files?.[0] || null;

    setCreateFile(null);
    setCreateQuestions([]);
    resetMessages();

    if (!file) {
      return;
    }

    try {
      setIsReading(true);

      const questions = await extractQuestionsFromTeacherFile(
        file,
        setProgress,
      );

      setCreateFile(file);
      setCreateQuestions(questions);

      setMessage(`${questions.length} question(s) detected successfully.`);
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to read the question file.");

      event.target.value = "";
    } finally {
      setIsReading(false);
      setProgress("");
    }
  };

  const handleOldNotebook = async (event) => {
    const file = event.target.files?.[0] || null;

    setOldNotebookFile(null);
    setOldNotebook(null);
    setOldNotebookInfo(null);
    setContinueQuestionFile(null);
    setContinueQuestions([]);
    setContinueComparison(null);
    resetMessages();

    if (!file) {
      return;
    }

    try {
      setIsReading(true);
      setProgress("Reading existing Jupyter Notebook...");

      const { notebook, inspection } = await readNotebookFile(file);

      setOldNotebookFile(file);
      setOldNotebook(notebook);
      setOldNotebookInfo(inspection);

      setMessage(
        `Notebook loaded. ${inspection.cellCount} existing cells, ${inspection.codeCellCount} code cells, ${inspection.outputCount} saved output(s). Last question: ${
          inspection.lastQuestionNumber
            ? `Q-${inspection.lastQuestionNumber}`
            : "not detected"
        }.`,
      );
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to read the notebook.");

      event.target.value = "";
    } finally {
      setIsReading(false);
      setProgress("");
    }
  };

  const handleContinueQuestionFile = async (event) => {
    const file = event.target.files?.[0] || null;

    setContinueQuestionFile(null);
    setContinueQuestions([]);
    setContinueComparison(null);
    resetMessages();

    if (!file) {
      return;
    }

    if (!oldNotebook) {
      setMessage("Upload the old .ipynb notebook first.");

      event.target.value = "";
      return;
    }

    try {
      setIsReading(true);

      setProgress("Reading latest teacher question file...");

      const questions = await extractQuestionsFromTeacherFile(
        file,
        setProgress,
      );

      const comparison = compareTeacherQuestionsWithNotebook(
        oldNotebook,
        questions,
      );

      setContinueQuestionFile(file);
      setContinueComparison(comparison);
      setContinueQuestions(comparison.newQuestions);

      const first = (oldNotebookInfo?.lastQuestionNumber || 0) + 1;

      if (comparison.newQuestionCount === 0) {
        setMessage(
          `${comparison.totalTeacherQuestions} question(s) found. ${comparison.duplicateCount} already exist in your notebook. No new questions were found, so nothing will be added.`,
        );
      } else {
        setMessage(
          `${comparison.totalTeacherQuestions} question(s) found. ${comparison.duplicateCount} already exist and were skipped. ${comparison.newQuestionCount} new question(s) will be added starting from Question ${first}.`,
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to read the new questions.");

      event.target.value = "";
    } finally {
      setIsReading(false);
      setProgress("");
    }
  };

  const handlePdfNotebook = async (event) => {
    const file = event.target.files?.[0] || null;

    setPdfNotebookFile(null);
    setPdfNotebook(null);
    setPdfNotebookInfo(null);
    resetMessages();

    if (!file) {
      return;
    }

    try {
      setIsReading(true);

      setProgress("Reading notebook for PDF conversion...");

      const { notebook, inspection } = await readNotebookFile(file);

      setPdfNotebookFile(file);
      setPdfNotebook(notebook);
      setPdfNotebookInfo(inspection);

      setMessage(
        `Notebook ready for PDF. ${inspection.cellCount} cell(s), ${inspection.codeCellCount} code cell(s), ${inspection.outputCount} saved output(s).`,
      );
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to read the notebook.");

      event.target.value = "";
    } finally {
      setIsReading(false);
      setProgress("");
    }
  };

  const updateQuestion = (setter) => (index, value) => {
    setter((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    );
  };

  const deleteQuestion = (setter) => (index) => {
    setter((current) =>
      current.filter((_, questionIndex) => questionIndex !== index),
    );
  };

  const addAfter = (setter) => (index) => {
    setter((current) => {
      const next = [...current];

      next.splice(index + 1, 0, "");

      return next;
    });
  };

  const downloadCreatedNotebook = () => {
    try {
      const notebook = createPythonNotebook(createQuestions, studentDetails);

      const baseName =
        createFile?.name?.replace(/\.(pdf|docx)$/i, "") || "python-assignment";

      downloadNotebook(notebook, `${baseName}.ipynb`);

      setMessage("Jupyter Notebook generated successfully.");
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to create the notebook.");
    }
  };

  const downloadContinuedNotebook = () => {
    try {
      if (!oldNotebook || !oldNotebookFile) {
        throw new Error("Upload the old Jupyter Notebook first.");
      }

      if (!oldNotebookInfo?.lastQuestionNumber) {
        throw new Error(
          "The last question number could not be detected from the old notebook. Please make sure question Markdown cells begin with numbers such as 1., 2., 3.",
        );
      }

      const notebook = continuePythonNotebook(
        oldNotebook,
        continueQuestions,
        oldNotebookInfo.lastQuestionNumber,
      );

      const baseName = oldNotebookFile.name.replace(/\.ipynb$/i, "");

      downloadNotebook(notebook, `${baseName}-continued.ipynb`);

      setMessage(
        `Notebook continued successfully. Old cells/outputs were preserved and new questions start from Question ${
          oldNotebookInfo.lastQuestionNumber + 1
        }.`,
      );
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to continue the notebook.");
    }
  };

  const downloadPdf = async () => {
    if (!pdfNotebook || !pdfNotebookFile) {
      setMessage("Upload a completed .ipynb notebook first.");

      return;
    }

    try {
      setIsGeneratingPdf(true);

      setMessage("Generating notebook PDF...");

      const baseName = pdfNotebookFile.name.replace(/\.ipynb$/i, "");

      await generateNotebookPdf(pdfNotebook, {
        fileName: baseName,
        title: baseName,
        showCellLabels: false,
        showExecutionCounts: true,
      });

      setMessage("Notebook PDF generated successfully.");
    } catch (error) {
      console.error(error);

      setMessage(error.message || "Unable to generate the notebook PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const continueStartNumber = (oldNotebookInfo?.lastQuestionNumber || 0) + 1;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 text-center">
          <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100">
            Python Assignment Tools
          </div>

          <h1 className="text-4xl font-bold sm:text-5xl">Jupyter Tools</h1>

          <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
            Create, continue and export Jupyter Notebook assignments.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-5xl space-y-6 px-4 pb-12">
        {/* Mode Selection */}
        <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              resetMessages();
            }}
            className={`rounded-2xl px-4 py-4 text-left transition ${
              mode === "create"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-slate-50 text-slate-700 hover:bg-indigo-50"
            }`}
          >
            <div className="font-bold">Create Notebook</div>

            <div
              className={`mt-1 text-xs ${
                mode === "create" ? "text-indigo-100" : "text-slate-500"
              }`}
            >
              PDF / DOCX → .ipynb
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("continue");
              resetMessages();
            }}
            className={`rounded-2xl px-4 py-4 text-left transition ${
              mode === "continue"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-slate-50 text-slate-700 hover:bg-indigo-50"
            }`}
          >
            <div className="font-bold">Continue Notebook</div>

            <div
              className={`mt-1 text-xs ${
                mode === "continue" ? "text-indigo-100" : "text-slate-500"
              }`}
            >
              Add new questions
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("pdf");
              resetMessages();
            }}
            className={`rounded-2xl px-4 py-4 text-left transition ${
              mode === "pdf"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-slate-50 text-slate-700 hover:bg-indigo-50"
            }`}
          >
            <div className="font-bold">Notebook to PDF</div>

            <div
              className={`mt-1 text-xs ${
                mode === "pdf" ? "text-indigo-100" : "text-slate-500"
              }`}
            >
              .ipynb → PDF
            </div>
          </button>
        </section>

        {/* CREATE NOTEBOOK */}
        {mode === "create" && (
          <>
            {/* Assignment Details */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Assignment Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  These details will be added to the first Markdown cell of the
                  Jupyter Notebook.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Assignment Number */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assignment Number
                  </label>

                  <input
                    type="text"
                    value={studentDetails.assignmentNumber}
                    onChange={(event) =>
                      updateStudentDetail(
                        "assignmentNumber",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 2"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* ID */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    ID
                  </label>

                  <input
                    type="text"
                    value={studentDetails.id}
                    onChange={(event) =>
                      updateStudentDetail("id", event.target.value)
                    }
                    placeholder="e.g. 24BCA196"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Name
                  </label>

                  <input
                    type="text"
                    value={studentDetails.name}
                    onChange={(event) =>
                      updateStudentDetail("name", event.target.value)
                    }
                    placeholder="e.g. Rabadiya Manav"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Course
                  </label>

                  <input
                    type="text"
                    value={studentDetails.course}
                    onChange={(event) =>
                      updateStudentDetail("course", event.target.value)
                    }
                    placeholder="e.g. BCA"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Semester */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Semester
                  </label>

                  <input
                    type="text"
                    value={studentDetails.semester}
                    onChange={(event) =>
                      updateStudentDetail("semester", event.target.value)
                    }
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* Division */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Division
                  </label>

                  <input
                    type="text"
                    value={studentDetails.division}
                    onChange={(event) =>
                      updateStudentDetail("division", event.target.value)
                    }
                    placeholder="e.g. 3"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>
            </section>

            {/* Upload Question File */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Upload Teacher Questions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload the PDF or DOCX containing the assignment questions.
                </p>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleCreateQuestionFile}
                  className="hidden"
                />

                <div className="text-sm font-bold text-indigo-700">
                  {isReading ? "Reading file..." : "Choose PDF or DOCX file"}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {createFile ? createFile.name : "Click here to upload"}
                </div>
              </label>

              {progress && (
                <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  {progress}
                </div>
              )}
            </section>

            <QuestionReview
              questions={createQuestions}
              startNumber={1}
              onChange={updateQuestion(setCreateQuestions)}
              onDelete={deleteQuestion(setCreateQuestions)}
              onAddAfter={addAfter(setCreateQuestions)}
            />

            {createQuestions.length > 0 && (
              <button
                type="button"
                onClick={downloadCreatedNotebook}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Download Jupyter Notebook (.ipynb)
              </button>
            )}
          </>
        )}

        {/* CONTINUE NOTEBOOK */}
        {mode === "continue" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Upload Existing Notebook
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload the previous .ipynb file first.
                </p>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                <input
                  type="file"
                  accept=".ipynb"
                  onChange={handleOldNotebook}
                  className="hidden"
                />

                <div className="text-sm font-bold text-indigo-700">
                  {isReading
                    ? "Reading notebook..."
                    : "Choose existing .ipynb file"}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {oldNotebookFile
                    ? oldNotebookFile.name
                    : "Click here to upload"}
                </div>
              </label>

              {oldNotebookInfo && (
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Questions</div>
                    <div className="mt-1 text-lg font-bold">
                      {oldNotebookInfo.questionCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Cells</div>
                    <div className="mt-1 text-lg font-bold">
                      {oldNotebookInfo.cellCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Code Cells</div>
                    <div className="mt-1 text-lg font-bold">
                      {oldNotebookInfo.codeCellCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Last Question</div>
                    <div className="mt-1 text-lg font-bold">
                      {oldNotebookInfo.lastQuestionNumber || "—"}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Upload Latest Assignment
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Existing questions are automatically skipped.
                </p>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleContinueQuestionFile}
                  className="hidden"
                />

                <div className="text-sm font-bold text-indigo-700">
                  Choose PDF or DOCX file
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {continueQuestionFile
                    ? continueQuestionFile.name
                    : "Click here to upload"}
                </div>
              </label>

              {continueComparison && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <div className="text-xs text-slate-500">
                        Teacher Questions
                      </div>
                      <div className="mt-1 font-bold">
                        {continueComparison.totalTeacherQuestions}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Existing</div>
                      <div className="mt-1 font-bold">
                        {continueComparison.duplicateCount}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">New</div>
                      <div className="mt-1 font-bold text-emerald-600">
                        {continueComparison.newQuestionCount}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">Start Number</div>
                      <div className="mt-1 font-bold">
                        {continueStartNumber}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <QuestionReview
              questions={continueQuestions}
              startNumber={continueStartNumber}
              onChange={updateQuestion(setContinueQuestions)}
              onDelete={deleteQuestion(setContinueQuestions)}
              onAddAfter={addAfter(setContinueQuestions)}
            />

            {continueQuestions.length > 0 && (
              <button
                type="button"
                onClick={downloadContinuedNotebook}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                Download Continued Notebook (.ipynb)
              </button>
            )}
          </>
        )}

        {/* NOTEBOOK TO PDF */}
        {mode === "pdf" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Notebook to PDF
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload a completed Jupyter Notebook and export it as a PDF.
                </p>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                <input
                  type="file"
                  accept=".ipynb"
                  onChange={handlePdfNotebook}
                  className="hidden"
                />

                <div className="text-sm font-bold text-indigo-700">
                  Choose .ipynb file
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {pdfNotebookFile
                    ? pdfNotebookFile.name
                    : "Click here to upload"}
                </div>
              </label>

              {pdfNotebookInfo && (
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Questions</div>

                    <div className="mt-1 text-lg font-bold">
                      {pdfNotebookInfo.questionCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Cells</div>

                    <div className="mt-1 text-lg font-bold">
                      {pdfNotebookInfo.cellCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Code Cells</div>

                    <div className="mt-1 text-lg font-bold">
                      {pdfNotebookInfo.codeCellCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Outputs</div>

                    <div className="mt-1 text-lg font-bold">
                      {pdfNotebookInfo.outputCount}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {pdfNotebook && (
              <button
                type="button"
                onClick={downloadPdf}
                disabled={isGeneratingPdf}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingPdf
                  ? "Generating PDF..."
                  : "Download Notebook PDF"}
              </button>
            )}
          </>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
            {message}
          </div>
        )}

        {/* FORMAT INFO */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Notebook format:</b> Question = Markdown cell. Answer = Python code
          cell. When continuing a notebook, old cells, code and stored outputs
          are preserved.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
