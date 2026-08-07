export default function QuestionsSection({ questions, questionRefs, onUpdate, onAddEnd, onAddBefore, onAddAfter, onDelete, onMove, onClear }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold text-white">4</div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detected Questions</h2>
            <p className="mt-1 text-sm text-slate-500">Question numbers are automatic. Add, delete or move questions and numbering rearranges itself.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.length > 0 && <button type="button" onClick={onClear} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100">Clear All</button>}
          <button type="button" onClick={onAddEnd} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">+ Add Question</button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <div className="text-4xl">📄</div>
          <p className="mt-4 font-semibold text-slate-700">No questions available</p>
          <p className="mt-1 text-sm text-slate-500">Upload a file or add a question manually.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={index}
              ref={(element) => { questionRefs.current[index] = element; }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-md sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">Question {index + 1}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => onAddBefore(index)} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">+ Before</button>
                  <button type="button" onClick={() => onAddAfter(index)} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">+ After</button>
                  <button type="button" disabled={index === 0} onClick={() => onMove(index, "up")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">↑ Up</button>
                  <button type="button" disabled={index === questions.length - 1} onClick={() => onMove(index, "down")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">↓ Down</button>
                  <button type="button" onClick={() => onDelete(index)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">Delete</button>
                </div>
              </div>

              <textarea
                rows="4"
                value={question}
                placeholder="Enter the complete question here..."
                onChange={(event) => onUpdate(index, event.target.value)}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
