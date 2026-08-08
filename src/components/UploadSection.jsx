export default function UploadSection({
  isReading,
  uploadedFiles,
  onUpload,
  onRemoveFile,
  onClearFiles,
  progressMessage,
  pastedQuestions,
  onPastedQuestionsChange,
  onAddPastedQuestions,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">1</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Add Questions</h2>
          <p className="mt-1 text-sm text-slate-500">Upload one or more PDF/DOCX files, or paste questions directly. Scanned PDFs are automatically read with OCR.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">Upload Question Files</h3>
          <p className="mt-1 text-sm text-slate-500">Questions detected from every selected file are added to the same question list.</p>

          <label className="mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 px-6 py-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              disabled={isReading}
              onChange={onUpload}
            />
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-200">↑</div>
            <span className="text-base font-bold text-indigo-700">{isReading ? "Reading Files..." : "Choose PDF or Word Files"}</span>
            <span className="mt-2 text-sm text-slate-500">Select one file or multiple files together</span>
            {isReading && progressMessage && <span className="mt-3 text-xs font-semibold text-slate-600">{progressMessage}</span>}
          </label>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-700">Uploaded Files ({uploadedFiles.length})</p>
                <button type="button" onClick={onClearFiles} className="text-xs font-semibold text-red-600 hover:text-red-700">Clear file list</button>
              </div>

              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500">{file.type} · {file.questionCount} question(s){file.usedOcr ? " · OCR" : ""}</p>
                  </div>
                  <button type="button" onClick={() => onRemoveFile(file.id)} className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-red-600 hover:bg-red-50" aria-label={`Remove ${file.name}`}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">Copy & Paste Questions</h3>
          <p className="mt-1 text-sm text-slate-500">Paste Q1/Q2, numbered questions, or one question per line.</p>

          <textarea
            rows="9"
            value={pastedQuestions}
            onChange={(event) => onPastedQuestionsChange(event.target.value)}
            placeholder={`Example:
1. Write a Python program to...
2. Explain the concept of...
3. Create a program to...`}
            className="mt-4 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />

          <button type="button" onClick={onAddPastedQuestions} className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
            Add Pasted Questions
          </button>
        </div>
      </div>
    </section>
  );
}
