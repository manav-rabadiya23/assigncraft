import {
  getSelectedDetailRows,
  getSelectedHeaderParts,
} from "../utils/documentFields";

function PreviewDetailRow({ label, value, last = false }) {
  return (
    <div
      className={`grid grid-cols-[125px_1fr] ${
        last ? "" : "border-b border-slate-500"
      }`}
    >
      <div className="border-r border-slate-500 px-3 py-2 font-bold">
        {label}
      </div>
      <div className="min-w-0 break-words px-3 py-2">{value}</div>
    </div>
  );
}

function RepeatingHeaderPreview({ details, options }) {
  if (!options.showHeaderEveryPage) return null;

  const values = getSelectedHeaderParts(details, options);

  return (
    <div className="mb-5 border-b border-slate-500 pb-2 text-center font-serif text-[12px] leading-5 text-black">
      {values.join(" | ")}
    </div>
  );
}

function WordLikePage({ details, questions, options }) {
  const selectedRows = getSelectedDetailRows(details, options);
  const validQuestions = questions.filter((question) => question.trim());

  return (
    <div className="word-page mx-auto bg-white text-black shadow-xl">
      <RepeatingHeaderPreview details={details} options={options} />

      <div className="text-center font-serif">
        <h3 className="text-[23px] font-bold uppercase leading-tight">
          Assignment {details.assignmentNumber}
        </h3>
        <p className="mt-2 text-[17px] font-bold">{details.subject}</p>
      </div>

      {selectedRows.length > 0 && (
        <div className="mt-7 overflow-hidden border border-slate-500 font-serif text-[16px]">
          {selectedRows.map(([label, value], index) => (
            <PreviewDetailRow
              key={label}
              label={label}
              value={value}
              last={index === selectedRows.length - 1}
            />
          ))}
        </div>
      )}

      <div className="mt-7 space-y-7 font-serif">
        {validQuestions.map((question, index) => (
          <div key={index} className="break-inside-avoid">
            <h4 className="mb-2 text-[17px] font-bold">
              Question {index + 1}
            </h4>

            <div className="border border-slate-600 text-[16px]">
              <div className="grid grid-cols-[95px_1fr] border-b border-slate-600">
                <div className="border-r border-slate-600 p-3 font-bold">
                  Q-{index + 1}
                </div>
                <div className="p-3 leading-6">{question}</div>
              </div>

              <div className="grid grid-cols-[95px_1fr] border-b border-slate-600">
                <div className="border-r border-slate-600 p-3 font-bold">
                  Code
                </div>
                <div className="h-44 bg-white" />
              </div>

              <div className="grid grid-cols-[95px_1fr]">
                <div className="border-r border-slate-600 p-3 font-bold">
                  Output
                </div>
                <div className="h-32 bg-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {options.showPageNumbers && (
        <div className="mt-10 border-t border-slate-300 pt-2 text-center font-serif text-xs text-slate-600">
          Page numbers are added automatically in the exported Word/PDF file.
        </div>
      )}
    </div>
  );
}

export default function PreviewModal({
  details,
  questions,
  options,
  onClose,
  onDownloadWord,
  onDownloadPdf,
  onPrint,
  isGenerating,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Word-style A4 Preview
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Preview of the exported assignment
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto bg-slate-200 p-3 sm:p-6">
          <WordLikePage
            details={details}
            questions={questions}
            options={options}
          />
        </div>

        <div className="grid gap-2 border-t border-slate-200 bg-white p-4 sm:grid-cols-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Continue Editing
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onDownloadWord}
            className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Download Word
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onDownloadPdf}
            className="rounded-xl bg-violet-600 px-4 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            Download PDF
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={onPrint}
            className="rounded-xl bg-slate-800 px-4 py-3 font-bold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
