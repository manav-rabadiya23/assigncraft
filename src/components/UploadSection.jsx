export default function UploadSection({ isReading, fileName, fileType, onUpload, progressMessage }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">1</div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Upload Question File</h2>
          <p className="mt-1 text-sm text-slate-500">Upload a PDF or DOCX. Scanned PDFs are automatically read with OCR.</p>
        </div>
      </div>

      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 px-6 py-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50">
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={isReading}
          onChange={onUpload}
        />
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-200">↑</div>
        <span className="text-base font-bold text-indigo-700">{isReading ? "Reading File..." : "Choose PDF or Word File"}</span>
        <span className="mt-2 break-all text-sm text-slate-500">{fileName || "PDF and DOCX files are supported"}</span>
        {fileType && <span className="mt-3 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{fileType} selected</span>}
        {isReading && progressMessage && <span className="mt-3 text-xs font-semibold text-slate-600">{progressMessage}</span>}
      </label>
    </section>
  );
}
