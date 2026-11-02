import { parseQuestionBlock, splitBold } from "../utils/questionFormat";
import {
  cssTextStyle,
  getLineSpacing,
  getPartStyle,
} from "../utils/textStyles";
import {
  getSelectedDetailRows,
  getSelectedFooterParts,
  getSelectedHeaderParts,
} from "../utils/documentFields";

function PreviewDetailRow({ label, value, style, last = false }) {
  return (
    <div
      className={`grid grid-cols-[125px_1fr] ${last ? "" : "border-b border-slate-500"}`}
      style={{ ...cssTextStyle(style), textAlign: "left" }}
    >
      <div className="border-r border-slate-500 px-3 py-2 font-bold">
        {label}
      </div>
      <div className="min-w-0 break-words px-3 py-2">{value}</div>
    </div>
  );
}

function PageHeader({ details, options, pageNumber }) {
  const show =
    options.headerMode === "every" ||
    (options.headerMode === "first" && pageNumber === 1);
  if (!show) return <div className="h-4" />;
  const values = getSelectedHeaderParts(details, options);
  if (!values.length) return <div className="h-4" />;
  return (
    <div
      className="mb-5 border-b border-slate-500 pb-2 text-center leading-5"
      style={{
        ...cssTextStyle(getPartStyle(options, "headerFooter")),
        textAlign: "center",
      }}
    >
      {values.join(" | ")}
    </div>
  );
}

function PageFooter({ details, options, pageNumber }) {
  const showDetails =
    options.footerMode === "every" ||
    (options.footerMode === "first" && pageNumber === 1);
  const parts = [];
  if (showDetails) parts.push(...getSelectedFooterParts(details, options));
  if (options.showPageNumbers) parts.push(`Page ${pageNumber}`);
  if (!parts.length) return null;
  return (
    <div
      className="mt-8 border-t border-slate-300 pt-2 text-center"
      style={{
        ...cssTextStyle(getPartStyle(options, "headerFooter")),
        textAlign: "center",
      }}
    >
      {parts.join("  |  ")}
    </div>
  );
}

function QuestionBody({ question, options }) {
  const { statement, sections } = parseQuestionBlock(question);
  const showSamples = options.includeSamples !== false;
  const questionStyle = getPartStyle(options, "question");
  const labelStyle = getPartStyle(options, "sampleLabel");
  const sampleStyle = getPartStyle(options, "sample");
  const lineHeight = 1.25 * getLineSpacing(options);

  return (
    <>
      {statement.map((line, lineIndex) => {
        const isList = /^(?:[•◦]|\(?\d{1,2}[.)]|\(?[a-z][.)])\s/.test(line);
        return (
          <p
            key={lineIndex}
            className={`${lineIndex ? "mt-1" : ""} ${isList ? (line.startsWith("◦") ? "ml-10" : "ml-5") : ""}`}
            style={{ ...cssTextStyle(questionStyle), lineHeight }}
          >
            {splitBold(line).map((run, runIndex) =>
              run.bold ? (
                <strong key={runIndex}>{run.text}</strong>
              ) : (
                <span key={runIndex}>{run.text}</span>
              ),
            )}
          </p>
        );
      })}
      {showSamples &&
        sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mt-3">
            <p style={{ ...cssTextStyle(labelStyle), textAlign: "left" }}>
              {section.label}:
            </p>
            <pre
              className="ml-3 whitespace-pre-wrap"
              style={{
                ...cssTextStyle(sampleStyle),
                textAlign: "left",
                lineHeight,
              }}
            >
              {section.lines.join("\n")}
            </pre>
          </div>
        ))}
    </>
  );
}

function QuestionBlock({ question, index, options }) {
  const custom = (options.customAnswerSections || []).filter(
    (section) => section.enabled,
  );
  const hasRows = options.includeCode || options.includeOutput || custom.length;
  const labelStyle = getPartStyle(options, "labels");
  const labelCss = { ...cssTextStyle(labelStyle), textAlign: "left" };
  return (
    <div className="break-inside-avoid">
      <h4
        className="mb-2"
        style={{ ...labelCss, fontSize: `${labelStyle.size + 1}pt` }}
      >
        Question {index + 1}
      </h4>
      <div className="border border-slate-600">
        <div
          className={`grid grid-cols-[95px_1fr] ${hasRows ? "border-b border-slate-600" : ""}`}
        >
          <div className="border-r border-slate-600 p-3" style={labelCss}>
            Q-{index + 1}
          </div>
          <div className="p-3 leading-6">
            <QuestionBody question={question} options={options} />
          </div>
        </div>
        {options.includeCode && (
          <div
            className={`grid grid-cols-[95px_1fr] ${options.includeOutput || custom.length ? "border-b border-slate-600" : ""}`}
          >
            <div className="border-r border-slate-600 p-3" style={labelCss}>
              Code
            </div>
            <div className="h-44 bg-white" />
          </div>
        )}
        {options.includeOutput && (
          <div
            className={`grid grid-cols-[95px_1fr] ${custom.length ? "border-b border-slate-600" : ""}`}
          >
            <div className="border-r border-slate-600 p-3" style={labelCss}>
              Output
            </div>
            <div className="h-32 bg-white" />
          </div>
        )}
        {custom.map((section, i) => (
          <div
            key={section.id}
            className={`grid grid-cols-[95px_1fr] ${i < custom.length - 1 ? "border-b border-slate-600" : ""}`}
          >
            <div className="border-r border-slate-600 p-3" style={labelCss}>
              {section.label}
            </div>
            <div className="h-32 bg-white" />
          </div>
        ))}
      </div>
    </div>
  );
}

function buildPages(questions) {
  const pages = [];
  const perPage = 3;
  for (let index = 0; index < questions.length; index += perPage)
    pages.push(questions.slice(index, index + perPage));
  return pages.length ? pages : [[]];
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
  const validQuestions = questions
    .filter((question) => question.trim())
    .map((question) => question.trim());
  const pages = buildPages(validQuestions);
  const selectedRows = getSelectedDetailRows(details, options);
  const titleStyle = getPartStyle(options, "title");
  const detailsStyle = getPartStyle(options, "details");

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
            <p className="mt-1 text-xs text-slate-500">
              Preview of the selected header, footer, and answer format
              settings.{" "}
            </p>
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
          <div className="space-y-6">
            {pages.map((pageQuestions, pageIndex) => {
              const pageNumber = pageIndex + 1;
              const questionOffset = pageIndex * 3;
              return (
                <div
                  key={pageNumber}
                  className="word-page mx-auto bg-white text-black shadow-xl"
                >
                  <PageHeader
                    details={details}
                    options={options}
                    pageNumber={pageNumber}
                  />
                  {pageNumber === 1 && (
                    <>
                      <div style={cssTextStyle(titleStyle)}>
                        <h3 className="uppercase leading-tight">
                          Assignment {details.assignmentNumber}
                        </h3>
                        <p
                          className="mt-2"
                          style={{
                            fontSize: `${Math.max(10, titleStyle.size - 4)}pt`,
                          }}
                        >
                          {details.subject}
                        </p>
                      </div>
                      {selectedRows.length > 0 && (
                        <div className="mt-7 overflow-hidden border border-slate-500">
                          {selectedRows.map(([label, value], index) => (
                            <PreviewDetailRow
                              key={label}
                              label={label}
                              value={value}
                              style={detailsStyle}
                              last={index === selectedRows.length - 1}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-7 space-y-7">
                    {pageQuestions.map((question, index) => (
                      <QuestionBlock
                        key={`${pageNumber}-${index}`}
                        question={question}
                        index={questionOffset + index}
                        options={options}
                      />
                    ))}
                  </div>
                  <PageFooter
                    details={details}
                    options={options}
                    pageNumber={pageNumber}
                  />
                  <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-slate-400">
                    Preview Page {pageNumber}
                  </div>
                </div>
              );
            })}
          </div>
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
