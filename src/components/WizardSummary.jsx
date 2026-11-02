import {
  PRESETS,
  isPresetUnchanged,
  normalizeTextStyle,
} from "../utils/textStyles";

const MODE_LABEL = {
  none: "Not shown",
  every: "Every page",
  first: "First page only",
};

function Row({ label, value, onEdit }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-sm font-bold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
      >
        Edit
      </button>
    </div>
  );
}

/** Read-only recap shown on the last step, with an Edit link back to each step. */
export default function WizardSummary({
  details,
  questions,
  options,
  onEditStep,
}) {
  const count = questions.filter((question) => question.trim()).length;
  const style = normalizeTextStyle(options.textStyle);
  const styleLabel = `${PRESETS[style.preset].label}${isPresetUnchanged(style) ? "" : " (customised)"}`;

  const tableOn = options.showDetailsTable !== false;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">Ready to download</h2>
      <p className="mt-1 text-sm text-slate-500">
        Check your choices, then preview or download your assignment.
      </p>

      <div className="mt-4">
        <Row
          label="Questions"
          value={`${count} question${count === 1 ? "" : "s"}`}
          onEdit={() => onEditStep(1)}
        />
        <Row
          label="Assignment"
          value={`${details.subject || "No subject"} · Assignment ${details.assignmentNumber || "?"}`}
          onEdit={() => onEditStep(2)}
        />
        <Row
          label="Student"
          value={`${details.fullName || "No name"}${details.studentId ? ` (${details.studentId})` : ""}`}
          onEdit={() => onEditStep(2)}
        />
        <Row
          label="Details table, header and footer"
          value={`Table ${tableOn ? "on" : "off"} · Header: ${MODE_LABEL[options.headerMode || "none"]} · Footer: ${MODE_LABEL[options.footerMode || "none"]}`}
          onEdit={() => onEditStep(3)}
        />
        <Row
          label="Text style"
          value={styleLabel}
          onEdit={() => onEditStep(3)}
        />
      </div>
    </section>
  );
}
