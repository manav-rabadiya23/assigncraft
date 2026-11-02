/**
 * Step indicator and Back / Next buttons for the Home page wizard.
 * Uses the same colours and button styles as the rest of the page.
 */
const WIZARD_STEPS = [
  { id: 1, title: "Add questions", short: "Questions" },
  { id: 2, title: "Your details", short: "Details" },
  { id: 3, title: "Layout and style", short: "Layout" },
  { id: 4, title: "Preview and download", short: "Download" },
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function WizardStepper({ step, onGo, stepperRef }) {
  const current = WIZARD_STEPS.find((item) => item.id === step);

  return (
    <nav
      ref={stepperRef}
      aria-label="Progress"
      className="scroll-mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-300/30 sm:p-6"
    >
      <ol className="grid grid-cols-4 gap-2">
        {WIZARD_STEPS.map((item) => {
          const isCurrent = item.id === step;
          const isDone = item.id < step;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onGo(item.id)}
                aria-current={isCurrent ? "step" : undefined}
                className="flex w-full flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-lg"
                      : isDone
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isDone ? <CheckIcon /> : item.id}
                </span>

                <span
                  className={`text-xs font-bold sm:text-sm ${
                    isCurrent
                      ? "text-indigo-700"
                      : isDone
                        ? "text-slate-700"
                        : "text-slate-500"
                  }`}
                >
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${(step / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>

      <p className="mt-2 text-center text-xs text-slate-500">
        Step {step} of {WIZARD_STEPS.length}: {current?.title}
      </p>
    </nav>
  );
}

/** Back on the left, Next on the right. Either can be left out. */
export function WizardActions({ onBack, onNext, nextLabel = "Next" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-indigo-200 bg-white px-6 py-4 font-bold text-indigo-700 shadow-lg shadow-slate-200/60 transition hover:bg-indigo-50"
        >
          Back
        </button>
      ) : (
        <span />
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-lg transition hover:bg-indigo-700"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
