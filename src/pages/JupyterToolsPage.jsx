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
  if (!file) throw new Error("Please choose a PDF or DOCX question file.");

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
  if (!questions.length) return null;

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

  const handleCreateQuestionFile = async (event) => {
    const file = event.target.files?.[0] || null;
    setCreateFile(null);
    setCreateQuestions([]);
    resetMessages();

    if (!file) return;

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

    if (!file) return;

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

    if (!file) return;

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

    if (!file) return;

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
      const notebook = createPythonNotebook(createQuestions);
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
        `Notebook continued successfully. Old cells/outputs were preserved and new questions start from Question ${oldNotebookInfo.lastQuestionNumber + 1}.`,
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
        <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setMode("create");
              resetMessages();
            }}
            className={`rounded-2xl p-5 text-left transition ${
              mode === "create"
                ? "bg-indigo-600 text-white shadow-lg"
                : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-indigo-50"
            }`}
          >
            <div className="font-bold">1. Create Notebook</div>
            <div
              className={`mt-1 text-sm ${mode === "create" ? "text-indigo-100" : "text-slate-500"}`}
            >
              PDF/DOCX → .ipynb
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("continue");
              resetMessages();
            }}
            className={`rounded-2xl p-5 text-left transition ${
              mode === "continue"
                ? "bg-violet-600 text-white shadow-lg"
                : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-violet-50"
            }`}
          >
            <div className="font-bold">2. Continue Notebook</div>
            <div
              className={`mt-1 text-sm ${mode === "continue" ? "text-violet-100" : "text-slate-500"}`}
            >
              Old .ipynb + latest assignment
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("pdf");
              resetMessages();
            }}
            className={`rounded-2xl p-5 text-left transition ${
              mode === "pdf"
                ? "bg-slate-900 text-white shadow-lg"
                : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
            }`}
          >
            <div className="font-bold">3. Notebook to PDF</div>
            <div
              className={`mt-1 text-sm ${mode === "pdf" ? "text-slate-300" : "text-slate-500"}`}
            >
              Completed .ipynb → PDF
            </div>
          </button>
        </section>

        {mode === "create" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <h2 className="text-xl font-bold">Upload Teacher Questions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload PDF or DOCX. AssignCraft will detect the questions and
                create a Python notebook.
              </p>

              <label className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 p-8 text-center">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={isReading}
                  onChange={handleCreateQuestionFile}
                />
                <div className="font-bold text-indigo-700">
                  {isReading ? "Reading..." : "Choose PDF / DOCX"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {createFile?.name || "No file selected"}
                </div>
                {progress && (
                  <div className="mt-3 text-xs font-semibold text-slate-600">
                    {progress}
                  </div>
                )}
              </label>
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
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-lg hover:bg-indigo-700"
              >
                Download Jupyter Notebook (.ipynb)
              </button>
            )}
          </>
        )}

        {mode === "continue" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="mb-4">
                <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
                  Step 1
                </span>
                <h2 className="mt-3 text-xl font-bold">Upload Old Notebook</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Existing Markdown, Python code and saved outputs remain
                  unchanged.
                </p>
              </div>

              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 p-8 text-center">
                <input
                  type="file"
                  accept=".ipynb,application/x-ipynb+json,application/json"
                  className="hidden"
                  disabled={isReading}
                  onChange={handleOldNotebook}
                />
                <div className="font-bold text-indigo-700">
                  {isReading ? "Reading..." : "Choose Existing .ipynb"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {oldNotebookFile?.name || "No notebook selected"}
                </div>
              </label>

              {oldNotebookInfo && (
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <b>{oldNotebookInfo.cellCount}</b>
                    <div className="text-xs text-slate-500">Existing cells</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <b>{oldNotebookInfo.codeCellCount}</b>
                    <div className="text-xs text-slate-500">Code cells</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <b>{oldNotebookInfo.outputCount}</b>
                    <div className="text-xs text-slate-500">Saved outputs</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                    <b>Q-{oldNotebookInfo.lastQuestionNumber || "?"}</b>
                    <div className="text-xs">Last question</div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="mb-4">
                <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-700">
                  Step 2
                </span>
                <h2 className="mt-3 text-xl font-bold">Upload New Questions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload the latest teacher PDF or DOCX. Old questions are
                  detected and skipped automatically.
                </p>
              </div>

              <label
                className={`block rounded-2xl border-2 border-dashed p-8 text-center ${
                  oldNotebook
                    ? "cursor-pointer border-violet-300 bg-violet-50/60"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={!oldNotebook || isReading}
                  onChange={handleContinueQuestionFile}
                />
                <div className="font-bold text-violet-700">
                  {!oldNotebook
                    ? "Upload old notebook first"
                    : isReading
                      ? "Reading..."
                      : "Choose New PDF / DOCX"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {continueQuestionFile?.name ||
                    "No new question file selected"}
                </div>
                {progress && (
                  <div className="mt-3 text-xs font-semibold text-slate-600">
                    {progress}
                  </div>
                )}
              </label>

              {continueComparison && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {continueComparison.totalTeacherQuestions}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      Questions in latest file
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-4">
                    <div className="text-2xl font-bold text-amber-800">
                      {continueComparison.duplicateCount}
                    </div>
                    <div className="text-xs font-medium text-amber-700">
                      Already in notebook — skipped
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="text-2xl font-bold text-emerald-800">
                      {continueComparison.newQuestionCount}
                    </div>
                    <div className="text-xs font-medium text-emerald-700">
                      New questions to add
                    </div>
                  </div>
                </div>
              )}

              {continueComparison?.newQuestionCount === 0 && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Your notebook already contains all questions from this file.
                  No duplicate questions will be added.
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
                className="w-full rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-lg hover:bg-violet-700"
              >
                Download Continued Notebook (.ipynb)
              </button>
            )}
          </>
        )}

        {mode === "pdf" && (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <h2 className="text-xl font-bold">Upload Completed Notebook</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload a completed .ipynb file. Markdown, Python code and saved
                outputs will be added to the PDF.
              </p>

              <label className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-500">
                <input
                  type="file"
                  accept=".ipynb,application/x-ipynb+json,application/json"
                  className="hidden"
                  disabled={isReading || isGeneratingPdf}
                  onChange={handlePdfNotebook}
                />

                <div className="font-bold text-slate-800">
                  {isReading
                    ? "Reading Notebook..."
                    : "Choose Completed .ipynb"}
                </div>

                <div className="mt-2 text-sm text-slate-500">
                  {pdfNotebookFile?.name || "No notebook selected"}
                </div>

                {progress && (
                  <div className="mt-3 text-xs font-semibold text-slate-600">
                    {progress}
                  </div>
                )}
              </label>

              {pdfNotebookInfo && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <b>{pdfNotebookInfo.cellCount}</b>
                    <div className="text-xs text-slate-500">Notebook cells</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <b>{pdfNotebookInfo.codeCellCount}</b>
                    <div className="text-xs text-slate-500">Python cells</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-sm">
                    <b>{pdfNotebookInfo.outputCount}</b>
                    <div className="text-xs text-slate-500">Saved outputs</div>
                  </div>
                </div>
              )}
            </section>

            {pdfNotebook && (
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={downloadPdf}
                className="w-full rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingPdf
                  ? "Generating PDF..."
                  : "Download Notebook PDF"}
              </button>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              The PDF includes Markdown text, Python code, text outputs and
              PNG/JPEG plot or image outputs saved inside the notebook.
            </div>
          </>
        )}

        {message && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow">
            {message}
          </div>
        )}

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
