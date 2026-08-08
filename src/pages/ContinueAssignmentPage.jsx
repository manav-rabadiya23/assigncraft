import { useMemo, useState } from "react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import QuestionsSection from "../components/QuestionsSection";
import { extractTextFromDocx } from "../utils/docxExtractor";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { detectQuestions } from "../utils/questionParser";
import {
  generateContinuedAssignment,
  inspectCompletedAssignment,
} from "../utils/continueAssignmentGenerator";

function makeFileLabel(file) {
  if (!file) return "No file selected";
  return file.name;
}

export default function ContinueAssignmentPage() {
  const [completedFile, setCompletedFile] = useState(null);
  const [lastQuestionNumber, setLastQuestionNumber] = useState(null);
  const [existingMediaCount, setExistingMediaCount] = useState(0);

  const [newQuestionsFile, setNewQuestionsFile] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [isReadingOld, setIsReadingOld] = useState(false);
  const [isReadingNew, setIsReadingNew] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const questionRefs = useMemo(() => ({ current: [] }), []);

  const chooseCompletedAssignment = async (event) => {
    const file = event.target.files?.[0] || null;

    setCompletedFile(null);
    setLastQuestionNumber(null);
    setExistingMediaCount(0);
    setMessage("");

    if (!file) return;

    try {
      setIsReadingOld(true);

      const inspection = await inspectCompletedAssignment(file);

      setCompletedFile(file);
      setLastQuestionNumber(inspection.lastQuestionNumber);
      setExistingMediaCount(inspection.mediaCount);

      setMessage(
        `Completed assignment loaded. Last question detected: Q-${inspection.lastQuestionNumber}. Existing images found: ${inspection.mediaCount}.`,
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
    setMessage("");

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {
      setMessage("New questions must be a PDF or DOCX file.");
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
      const newQuestions = detected.questions || [];

      if (!newQuestions.length) {
        throw new Error(
          "The new file was read, but no questions were detected. Please check the file.",
        );
      }

      setNewQuestionsFile(file);
      setQuestions(newQuestions);

      const firstNumber =
        Number.isInteger(lastQuestionNumber) && lastQuestionNumber >= 0
          ? lastQuestionNumber + 1
          : "?";

      setMessage(
        `${newQuestions.length} new question(s) detected. They will start from Q-${firstNumber}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to read the new questions file.");
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

  const reorderQuestion = (sourceIndex, targetIndex) => {
    setQuestions((current) => {
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const generate = async () => {
    if (!completedFile) {
      setMessage("Step 1: Upload your completed assignment Word file.");
      return;
    }

    if (!newQuestionsFile || !questions.some((question) => question.trim())) {
      setMessage("Step 2: Upload the teacher's new questions file.");
      return;
    }

    try {
      setIsGenerating(true);
      setMessage(
        `Creating final document. Q-1 to Q-${lastQuestionNumber} will not be rebuilt.`,
      );

      await generateContinuedAssignment({
        completedFile,
        questions,
        lastQuestionNumber,
      });

      setMessage(
        `Done. Existing Q-1 to Q-${lastQuestionNumber}, including their code and images, were kept. New questions were appended from Q-${lastQuestionNumber + 1}.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to generate the continued assignment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const displayStartNumber =
    Number.isInteger(lastQuestionNumber) ? lastQuestionNumber + 1 : 1;

  // QuestionsSection normally displays Question 1, 2, 3...
  // For continuation we wrap the question text with the actual future number
  // only in this page's review heading below. The generated DOCX uses Q-13 etc.
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
            Keep your completed Word assignment unchanged and append only the
            teacher&apos;s new questions.
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
                Upload the DOCX that already contains your old questions,
                code and output screenshots. AssignCraft will NOT regenerate it.
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
              <b>Ready:</b> Last existing question is Q-{lastQuestionNumber}.
              {existingMediaCount > 0
                ? ` ${existingMediaCount} existing image(s) were found and will stay in the DOCX.`
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
              <h2 className="text-xl font-bold">Upload New Questions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload only the teacher&apos;s new PDF or DOCX question file.
                Only this file is passed through question detection.
              </p>
            </div>
          </div>

          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/60 p-7 text-center">
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={
                !completedFile || isReadingNew || isGenerating
              }
              onChange={chooseNewQuestionsFile}
            />
            <div className="font-bold text-violet-700">
              {!completedFile
                ? "Upload Step 1 first"
                : isReadingNew
                  ? "Reading new questions..."
                  : "Choose New PDF / DOCX"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {makeFileLabel(newQuestionsFile)}
            </div>
          </label>
        </section>

        {questions.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-xl font-bold">Verify New Questions</h2>
            <p className="mt-1 text-sm text-slate-500">
              {questions.length} new question(s). In the final Word file they
              will be numbered Q-{displayStartNumber} to Q-
              {displayStartNumber + questions.length - 1}.
            </p>

            <div className="mt-5 space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
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
          <b>Important:</b> Step 1 is never converted into questions. Its
          existing code, screenshots, tables and formatting stay inside the
          original DOCX package. Only Step 2 is parsed.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
