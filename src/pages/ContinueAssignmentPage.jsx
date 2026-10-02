import { useMemo, useState } from "react";
import Header from "../components/Header";
import SiteFooter from "../components/SiteFooter";
import SEO from "../components/SEO";

import {
  inspectCompletedAssignment,
  extractQuestionsFromFile,
  compareQuestionsWithCompletedAssignment,
  generateContinuedAssignment,
} from "../utils/continueAssignment";

export default function ContinueAssignmentPage() {
  const [completedFile, setCompletedFile] = useState(null);
  const [completedInspection, setCompletedInspection] = useState(null);
  const [lastQuestionNumber, setLastQuestionNumber] = useState(0);
  const [existingMediaCount, setExistingMediaCount] = useState(0);

  const [newQuestionsFile, setNewQuestionsFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [comparison, setComparison] = useState(null);

  const [isReadingOld, setIsReadingOld] = useState(false);
  const [isReadingNew, setIsReadingNew] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [message, setMessage] = useState("");

  const questionRefs = useMemo(() => ({ current: [] }), []);

  const chooseCompletedAssignment = async (file) => {
    if (!file) return;

    setCompletedFile(file);
    setCompletedInspection(null);
    setQuestions([]);
    setComparison(null);
    setMessage("");
    setIsReadingOld(true);

    try {
      const result = await inspectCompletedAssignment(file);

      setCompletedInspection(result);
      setLastQuestionNumber(result.lastQuestionNumber || 0);
      setExistingMediaCount(result.mediaCount || 0);

      setMessage(
        `Existing assignment loaded. Last question: ${
          result.lastQuestionNumber || 0
        }.`,
      );
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Unable to read the completed assignment.");
    } finally {
      setIsReadingOld(false);
    }
  };

  const chooseNewQuestionsFile = async (file) => {
    if (!file) return;

    if (!completedFile || !completedInspection) {
      setMessage("Please upload your completed assignment first.");
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isPdf && !isDocx) {
      setMessage("Please select a PDF or DOCX file.");
      return;
    }

    setNewQuestionsFile(file);
    setQuestions([]);
    setComparison(null);
    setMessage("");
    setIsReadingNew(true);

    try {
      const extracted = await extractQuestionsFromFile(file);

      const detectedQuestions = Array.isArray(extracted)
        ? extracted
        : extracted?.questions || [];

      const result = await compareQuestionsWithCompletedAssignment(
        completedInspection,
        detectedQuestions,
      );

      setComparison(result);

      setQuestions(result.newQuestions || []);

      setMessage(`${result.newQuestions?.length || 0} new question(s) found.`);
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Unable to process the new question file.");
    } finally {
      setIsReadingNew(false);
    }
  };

  const updateQuestion = (index, value) => {
    setQuestions((previous) =>
      previous.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              text: typeof question === "string" ? value : value,
            }
          : question,
      ),
    );
  };

  const insertQuestion = (index) => {
    setQuestions((previous) => {
      const next = [...previous];

      next.splice(index, 0, {
        text: "",
      });

      return next;
    });
  };

  const deleteQuestion = (index) => {
    setQuestions((previous) =>
      previous.filter((_, questionIndex) => questionIndex !== index),
    );
  };

  const moveQuestion = (index, direction) => {
    setQuestions((previous) => {
      const next = [...previous];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return previous;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

      return next;
    });
  };

  const generate = async () => {
    if (!completedFile || !completedInspection) {
      setMessage("Please upload the completed assignment first.");
      return;
    }

    if (!newQuestionsFile || questions.length === 0) {
      setMessage("Please upload a file containing new questions.");
      return;
    }

    setIsGenerating(true);
    setMessage("");

    try {
      const result = await generateContinuedAssignment({
        completedFile,
        completedInspection,
        questions,
        startQuestionNumber: lastQuestionNumber + 1,
      });

      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.fileName || "continued-assignment.docx";

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);
      }

      setMessage("Continued assignment generated successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error?.message || "Unable to generate the continued assignment.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const displayStartNumber = lastQuestionNumber + 1;

  return (
    <>
      <SEO
        title="Continue Assignment – Add New Questions to an Existing DOCX"
        description="Continue an existing assignment with AssignCraft. Upload your completed DOCX and the teacher's latest PDF or DOCX question file to detect duplicates and add only new questions."
        path="/continue-assignment"
        keywords="continue assignment, update existing assignment, add questions to DOCX, continue Word assignment, duplicate question detection, assignment continuation tool"
        breadcrumbs={[
          {
            name: "Home",
            path: "/",
          },
          {
            name: "Continue Assignment",
            path: "/continue-assignment",
          },
        ]}
      />

      <div className="min-h-screen bg-slate-100 text-slate-900">
        <Header />

        {/* Hero */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                Continue an Existing Assignment
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Continue an Existing Assignment with New Questions
              </h1>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                Upload your completed Word assignment and the teacher&apos;s
                latest PDF or DOCX question file. AssignCraft detects repeated
                questions and lets you add only the new questions while
                preserving your existing work.
              </p>
            </div>
          </div>
        </section>

        {/* Main content */}
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Existing assignment */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  1. Upload Completed Assignment
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select the Word assignment you have already completed.
                  AssignCraft uses it to identify existing questions and
                  preserve your previous work.
                </p>
              </div>

              <label
                htmlFor="completed-assignment"
                className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
              >
                <input
                  id="completed-assignment"
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(event) =>
                    chooseCompletedAssignment(event.target.files?.[0])
                  }
                />

                <div className="text-4xl">📄</div>

                <p className="mt-3 font-medium text-slate-900">
                  {completedFile ? completedFile.name : "Choose completed DOCX"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Word document (.docx)
                </p>
              </label>

              {isReadingOld && (
                <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  Reading your completed assignment...
                </div>
              )}

              {completedInspection && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Last Question
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {lastQuestionNumber}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Existing Media
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {existingMediaCount}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* New questions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  2. Upload Latest Questions
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Upload the teacher&apos;s latest PDF or DOCX file. AssignCraft
                  compares the questions with your completed assignment.
                </p>
              </div>

              <label
                htmlFor="new-questions"
                className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                  completedInspection
                    ? "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                }`}
              >
                <input
                  id="new-questions"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  disabled={!completedInspection}
                  onChange={(event) =>
                    chooseNewQuestionsFile(event.target.files?.[0])
                  }
                />

                <div className="text-4xl">📚</div>

                <p className="mt-3 font-medium text-slate-900">
                  {newQuestionsFile
                    ? newQuestionsFile.name
                    : "Choose PDF or DOCX"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Teacher&apos;s latest question file
                </p>
              </label>

              {!completedInspection && (
                <p className="mt-3 text-sm text-amber-600">
                  Upload the completed assignment first.
                </p>
              )}

              {isReadingNew && (
                <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                  Detecting and comparing questions...
                </div>
              )}
            </section>
          </div>

          {/* Comparison */}
          {comparison && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Question Comparison
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    AssignCraft compared the latest questions with your
                    completed assignment.
                  </p>
                </div>

                <div className="rounded-xl bg-indigo-50 px-4 py-3 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                    New Questions
                  </p>

                  <p className="text-2xl font-bold text-indigo-700">
                    {questions.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Total detected</p>

                  <p className="mt-1 text-2xl font-bold">
                    {comparison.totalQuestions ??
                      comparison.allQuestions?.length ??
                      0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Existing / duplicate</p>

                  <p className="mt-1 text-2xl font-bold">
                    {comparison.duplicateQuestions?.length ??
                      comparison.duplicates?.length ??
                      0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">New</p>

                  <p className="mt-1 text-2xl font-bold text-indigo-600">
                    {questions.length}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Questions */}
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  3. Review New Questions
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  New questions will continue from question number{" "}
                  <span className="font-semibold text-slate-900">
                    {displayStartNumber}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={() => insertQuestion(questions.length)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                + Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="font-medium text-slate-700">
                  No new questions to review.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Upload the latest teacher question file to detect new
                  questions.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {questions.map((question, index) => {
                  const questionText =
                    typeof question === "string"
                      ? question
                      : question?.text || "";

                  return (
                    <div
                      key={`question-${index}`}
                      ref={(element) => {
                        questionRefs.current[index] = element;
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                            Q{displayStartNumber + index}
                          </span>

                          <span className="text-sm text-slate-500">
                            New question
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveQuestion(index, -1)}
                            disabled={index === 0}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() => moveQuestion(index, 1)}
                            disabled={index === questions.length - 1}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => insertQuestion(index)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteQuestion(index)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={questionText}
                        onChange={(event) =>
                          updateQuestion(index, event.target.value)
                        }
                        rows={4}
                        placeholder="Enter question..."
                        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Generate */}
          <section className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  4. Generate Continued Assignment
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Existing questions, code, output, images and formatting are
                  preserved. The reviewed new questions are added after the
                  existing assignment.
                </p>
              </div>

              <button
                type="button"
                onClick={generate}
                disabled={
                  isGenerating || !completedInspection || questions.length === 0
                }
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Assignment"}
              </button>
            </div>

            {message && (
              <div className="mt-5 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}
          </section>

          {/* Workflow information */}
          <section className="mt-10">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl">📄</div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  Preserve Existing Work
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your completed assignment remains the base document for the
                  continuation process.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl">🔍</div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  Detect Duplicates
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Questions from the latest teacher file are compared with the
                  questions already present in your assignment.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl">➕</div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  Add New Questions
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review the detected new questions and add them to the
                  assignment with continued numbering.
                </p>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
