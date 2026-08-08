export default function ContinueQuestionsSection({
  questions,
  startNumber,
  onUpdate,
  onAdd,
  onDelete,
  onMove,
  onClear,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            3. Verify New Questions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These questions will be appended from Q{startNumber} onward.
          </p>
        </div>

        <div className="flex gap-2">
          {questions.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            + Add Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Upload the teacher&apos;s new PDF/DOCX or add a question manually.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const number = startNumber + index;

            return (
              <div
                key={`${number}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
                    Question {number}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMove(index, "up")}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
                    >
                      ↑ Up
                    </button>
                    <button
                      type="button"
                      disabled={index === questions.length - 1}
                      onClick={() => onMove(index, "down")}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
                    >
                      ↓ Down
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(index)}
                      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <textarea
                  rows="4"
                  value={question}
                  onChange={(event) => onUpdate(index, event.target.value)}
                  placeholder={`Enter Question ${number}...`}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
