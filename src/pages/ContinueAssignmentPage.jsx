import { useMemo, useState } from "react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import { extractTextFromDocx } from "../utils/docxExtractor";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { detectQuestions } from "../utils/questionParser";
import {
  compareTeacherQuestionsWithCompletedAssignment,
  generateContinuedAssignment,
  inspectCompletedAssignment,
} from "../utils/continueAssignmentGenerator";

function makeFileLabel(file) {
  if (!file) return "No file selected";
  return file.name;
}

export default function ContinueAssignmentPage() {
  const [completedFile, setCompletedFile] = useState(null);
  const [completedInspection, setCompletedInspection] = useState(null);
  const [lastQuestionNumber, setLastQuestionNumber] = useState(null);
  const [existingMediaCount, setExistingMediaCount] = useState(0);

  const [newQuestionsFile, setNewQuestionsFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [comparison, setComparison] = useState(null);

  const [isReadingOld, setIsReadingOld] = useState(false);
  const [isReadingNew, setIsReadingNew] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const questionRefs = useMemo(() => ({ current: [] }), []);

  const chooseCompletedAssignment = async (event) => {
    const file = event.target.files?.[0] || null;

    setCompletedFile(null);
    setCompletedInspection(null);
    setLastQuestionNumber(null);
    setExistingMediaCount(0);
    setNewQuestionsFile(null);
    setQuestions([]);
    setComparison(null);
    setMessage("");

    if (!file) return;

    try {
      setIsReadingOld(true);

      const inspection = await inspectCompletedAssignment(file);

      setCompletedFile(file);
      setCompletedInspection(inspection);
      setLastQuestionNumber(inspection.lastQuestionNumber);
      setExistingMediaCount(inspection.mediaCount);

      setMessage(
        `Completed assignment loaded. ${inspection.questionCount} existing question(s) found. Last question: Q-${inspection.lastQuestionNumber}. Existing images: ${inspection.mediaCount}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to read the completed assignment.");
      event.target.value = "";
    } finally {
      setIsReadingOld(false);
    }
  };

  const chooseNewQuestionsFile = async (event) => {
    const file = event.target.files?.[0] || null;

    setNewQuestionsFile(null);
    setQuestions([]);
    setComparison(null);
    setMessage("");

    if (!file) return;

    if (!completedFile || !completedInspection) {
      setMessage("Step 1: Upload your completed assignment Word file first.");
      event.target.value = "";
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {
      setMessage("Teacher question file must be a PDF or DOCX file.");
      event.target.value = "";
      return;
    }

    try {
      setIsReadingNew(true);

      let text = "";

      if (extension === "pdf") {
        const result = await extractTextFromPdf(file);
        text = result.text || "";
      } else {
        text = await extractTextFromDocx(file);
      }

      const detected = detectQuestions(text);
      const teacherQuestions = detected.questions || [];

      if (!teacherQuestions.length) {
        throw new Error(
          "The teacher file was read, but no questions were detected. Please check the file.",
        );
      }

      const result = compareTeacherQuestionsWithCompletedAssignment(
        completedInspection,
        teacherQuestions,
      );

      setNewQuestionsFile(file);
      setComparison(result);
      setQuestions(result.newQuestions);

      if (result.newQuestionCount === 0) {
        setMessage(
          `${result.totalTeacherQuestions} question(s) detected. ${result.duplicateCount} already exist in your completed Word assignment and were skipped. No new questions were found.`,
        );
      } else {
        setMessage(
          `${result.totalTeacherQuestions} question(s) detected. ${result.duplicateCount} existing question(s) skipped. ${result.newQuestionCount} new question(s) will be added from Q-${lastQuestionNumber + 1}.`,
        );
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to read the teacher question file.");
      event.target.value = "";
    } finally {
      setIsReadingNew(false);
    }
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
  };

  const deleteQuestion = (index) => {
    setQuestions((current) =>
      current.filter((_, questionIndex) => questionIndex !== index),
    );
  };

  const moveQuestion = (index, direction) => {
    const target = direction === "up" ? index - 1 : index + 1;

    if (target < 0 || target >= questions.length) return;

    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const generate = async () => {
    if (!completedFile) {
      setMessage("Step 1: Upload your completed assignment Word file.");
      return;
    }

    if (!newQuestionsFile) {
      setMessage("Step 2: Upload the teacher's latest PDF or DOCX file.");
      return;
    }

    if (!questions.some((question) => question.trim())) {
      setMessage(
        "No new questions are available to add. Existing duplicate questions were already skipped.",
      );
      return;
    }

    try {
      setIsGenerating(true);
      setMessage(
        `Creating final document. Existing Q-1 to Q-${lastQuestionNumber} will stay unchanged.`,
      );

      await generateContinuedAssignment({
        completedFile,
        questions,
        lastQuestionNumber,
      });

      setMessage(
        `Done. Existing Q-1 to Q-${lastQuestionNumber}, including code, output, images and formatting, were preserved. ${questions.filter((question) => question.trim()).length} new question(s) were added from Q-${lastQuestionNumber + 1}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(
        error.message || "Unable to generate the continued assignment.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const displayStartNumber = Number.isInteger(lastQuestionNumber)
    ? lastQuestionNumber + 1
    : 1;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />

      <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 text-white">
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 text-center">
          <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-100">
            Continue an Existing Assignment
          </div>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Continue Assignment
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
            Upload your completed Word assignment and the teacher&apos;s latest
            question file. AssignCraft skips repeated questions and adds only
            the new ones.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-5xl space-y-6 px-4 pb-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold">Upload Completed Assignment</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload the DOCX that already contains your completed questions,
                code and outputs. AssignCraft will not rebuild this document.
              </p>
            </div>
          </div>

          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 p-7 text-center">
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={isReadingOld || isGenerating}
              onChange={chooseCompletedAssignment}
            />
            <div className="font-bold text-indigo-700">
              {isReadingOld
                ? "Reading completed assignment..."
                : "Choose Completed DOCX"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {makeFileLabel(completedFile)}
            </div>
          </label>

          {completedFile && Number.isInteger(lastQuestionNumber) && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <b>Ready:</b> {completedInspection?.questionCount || 0} existing
              question(s) found. Last existing question is Q-
              {lastQuestionNumber}.
              {existingMediaCount > 0
                ? ` ${existingMediaCount} existing image(s) will remain unchanged.`
                : ""}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 font-bold text-white">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Upload Teacher&apos;s Latest Questions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The PDF/DOCX may contain old and new questions together.
                AssignCraft will detect the repeated questions and skip them.
              </p>
            </div>
          </div>

          <label
            className={`block rounded-2xl border-2 border-dashed p-7 text-center ${
              completedFile
                ? "cursor-pointer border-violet-300 bg-violet-50/60"
                : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={!completedFile || isReadingNew || isGenerating}
              onChange={chooseNewQuestionsFile}
            />
            <div className="font-bold text-violet-700">
              {!completedFile
                ? "Upload Step 1 first"
                : isReadingNew
                  ? "Reading and comparing questions..."
                  : "Choose Latest PDF / DOCX"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {makeFileLabel(newQuestionsFile)}
            </div>
          </label>

          {comparison && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xl font-bold text-slate-900">
                  {comparison.totalTeacherQuestions}
                </div>
                <div className="text-xs text-slate-500">
                  Questions in teacher file
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-xl font-bold text-amber-800">
                  {comparison.duplicateCount}
                </div>
                <div className="text-xs text-amber-700">Existing / skipped</div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="text-xl font-bold text-emerald-800">
                  {comparison.newQuestionCount}
                </div>
                <div className="text-xs text-emerald-700">
                  New questions to add
                </div>
              </div>
            </div>
          )}
        </section>

        {questions.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-xl font-bold">Verify New Questions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only questions that are not already in your completed assignment
              are shown here. They will be numbered Q-{displayStartNumber} to Q-
              {displayStartNumber + questions.length - 1}.
            </p>

            <div className="mt-5 space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  ref={(element) => {
                    questionRefs.current[index] = element;
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 font-bold text-indigo-700">
                    Q-{displayStartNumber + index}
                  </div>
                  <textarea
                    rows="4"
                    value={question}
                    onChange={(event) =>
                      updateQuestion(index, event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertQuestion(index)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    >
                      + Before
                    </button>
                    <button
                      type="button"
                      onClick={() => insertQuestion(index + 1)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    >
                      + After
                    </button>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveQuestion(index, "up")}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    >
                      ↑ Up
                    </button>
                    <button
                      type="button"
                      disabled={index === questions.length - 1}
                      onClick={() => moveQuestion(index, "down")}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    >
                      ↓ Down
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(index)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {comparison && comparison.newQuestionCount === 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            All detected questions already exist in your completed assignment.
            Nothing needs to be added.
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow">
            {message}
          </div>
        )}

        <button
          type="button"
          disabled={
            !completedFile ||
            !newQuestionsFile ||
            questions.length === 0 ||
            isGenerating
          }
          onClick={generate}
          className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating
            ? "Generating Continued Assignment..."
            : "Generate Continued Word File"}
        </button>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Important:</b> The completed DOCX is preserved as-is. AssignCraft
          compares the teacher&apos;s latest questions with the existing
          assignment, skips duplicates, and appends only the new questions.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
