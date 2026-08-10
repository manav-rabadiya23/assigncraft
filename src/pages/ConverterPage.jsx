import { useMemo, useRef, useState } from "react";
import {
  FaArrowRightLong,
  FaCheck,
  FaCloudArrowUp,
  FaDownload,
  FaFilePdf,
  FaFileWord,
  FaRightLeft,
  FaRotateRight,
  FaXmark,
} from "react-icons/fa6";

import Header from "../components/Header";
import { convertDocument } from "../services/converterApi";

const conversionOptions = {
  wordToPdf: {
    title: "Word to PDF",
    description: "Convert a Word document into a PDF file.",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    inputFormat: "docx",
    outputFormat: "pdf",
    inputLabel: "Word",
    outputLabel: "PDF",
    buttonLabel: "Convert to PDF",
    Icon: FaFileWord,
    OutputIcon: FaFilePdf,
  },
  pdfToWord: {
    title: "PDF to Word",
    description: "Convert a PDF into an editable Word document.",
    accept: ".pdf,application/pdf",
    inputFormat: "pdf",
    outputFormat: "docx",
    inputLabel: "PDF",
    outputLabel: "Word",
    buttonLabel: "Convert to Word",
    Icon: FaFilePdf,
    OutputIcon: FaFileWord,
  },
};

const statusText = {
  creating: "Preparing converter...",
  uploading: "Uploading file...",
  waiting: "Waiting to start...",
  processing: "Converting document...",
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function ConverterPage() {
  const [mode, setMode] = useState("wordToPdf");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const option = conversionOptions[mode];
  const busy = ["creating", "uploading", "waiting", "processing"].includes(status);
  const finished = status === "finished" && result;

  const expectedExtension = useMemo(
    () => `.${option.inputFormat}`,
    [option.inputFormat],
  );

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const changeMode = (nextMode) => {
    if (busy) return;
    setMode(nextMode);
    setFile(null);
    setStatus("idle");
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const selectFile = (selectedFile) => {
    if (!selectedFile || busy) return;

    if (!selectedFile.name.toLowerCase().endsWith(expectedExtension)) {
      setFile(null);
      setResult(null);
      setStatus("idle");
      setError(`Please select a ${expectedExtension.toUpperCase()} file.`);
      return;
    }

    setFile(selectedFile);
    setError("");
    setResult(null);
    setStatus("idle");
  };

  const handleConvert = async () => {
    if (!file || busy) return;

    setError("");
    setResult(null);

    try {
      const converted = await convertDocument(
        file,
        option.inputFormat,
        option.outputFormat,
        (nextStatus) => setStatus(nextStatus),
      );

      setResult(converted.file);
      setStatus("finished");
    } catch (conversionError) {
      setStatus("error");
      setError(conversionError.message || "Conversion failed. Please try again.");
    }
  };

  const Icon = option.Icon;
  const OutputIcon = option.OutputIcon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <FaRightLeft className="text-xl" />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            AssignCraft Converter
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Document Converter
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Convert Word documents to PDF or turn PDF files into editable Word documents.
          </p>
        </section>

        <section className="mx-auto mt-9 max-w-4xl">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {Object.entries(conversionOptions).map(([key, item]) => {
              const TabIcon = item.Icon;
              const active = mode === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={busy}
                  onClick={() => changeMode(key)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition sm:text-base ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <TabIcon />
                  {item.title}
                </button>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                  <Icon />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{option.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {!finished ? (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={option.accept}
                    className="hidden"
                    disabled={busy}
                    onChange={(event) => selectFile(event.target.files?.[0])}
                  />

                  {!file ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => inputRef.current?.click()}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setDragging(false);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        selectFile(event.dataTransfer.files?.[0]);
                      }}
                      className={`flex min-h-[230px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition ${
                        dragging
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-indigo-600 shadow-sm">
                        <FaCloudArrowUp />
                      </div>
                      <p className="mt-4 text-base font-black text-slate-800">
                        Drop your {option.inputLabel} file here
                      </p>
                      <p className="mt-1 text-sm text-slate-500">or click to choose a file</p>
                      <span className="mt-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                        {expectedExtension.toUpperCase()} only
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-indigo-600 shadow-sm">
                          <Icon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-800 sm:text-base">
                            {file.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {formatBytes(file.size)} · {option.inputLabel} file
                          </p>
                        </div>
                        {!busy && (
                          <button
                            type="button"
                            onClick={reset}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            aria-label="Remove file"
                          >
                            <FaXmark />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  {busy && (
                    <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <FaRotateRight className="animate-spin text-indigo-600" />
                        <div>
                          <p className="text-sm font-black text-indigo-900">
                            {statusText[status] || "Converting document..."}
                          </p>
                          <p className="mt-0.5 text-xs text-indigo-600">
                            Keep this page open until the conversion finishes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!file || busy}
                    onClick={handleConvert}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {busy ? (
                      <>
                        <FaRotateRight className="animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        {option.buttonLabel}
                        <FaArrowRightLong className="text-xs" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="py-4 text-center sm:py-7">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                    <FaCheck />
                  </div>
                  <h2 className="mt-5 text-2xl font-black text-slate-900">
                    Conversion complete
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Your {option.outputLabel} file is ready to download.
                  </p>

                  <div className="mx-auto mt-6 flex max-w-md items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-indigo-600 shadow-sm">
                      <OutputIcon />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">
                      {result.name}
                    </p>
                  </div>

                  <a
                    href={result.url}
                    className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700"
                  >
                    <FaDownload />
                    Download {option.outputLabel}
                  </a>

                  <button
                    type="button"
                    onClick={reset}
                    className="mt-3 text-sm font-bold text-slate-500 transition hover:text-indigo-600"
                  >
                    Convert another file
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-slate-400">
            Conversion is processed securely through the configured document conversion service.
          </p>
        </section>
      </main>
    </div>
  );
}
