import { HEADER_FIELD_OPTIONS } from "../constants/defaults";

export default function DocumentOptions({
  options,
  onToggleHeader,
  onToggleHeaderField,
  onTogglePageNumbers,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-600 text-lg font-bold text-white">
          3
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Options</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose which assignment details should appear. Then separately
            decide whether those selected details should repeat on every page.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-1 text-sm font-bold text-slate-800">
          Choose details to display
        </p>
        <p className="mb-4 text-xs text-slate-500">
          These selected details appear once on the first page by default.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HEADER_FIELD_OPTIONS.map((field) => (
            <label
              key={field.key}
              className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700"
            >
              <input
                type="checkbox"
                checked={Boolean(options.headerFields[field.key])}
                onChange={() => onToggleHeaderField(field.key)}
                className="h-4 w-4 accent-indigo-600"
              />
              {field.label}
            </label>
          ))}
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={options.showHeaderEveryPage}
          onChange={onToggleHeader}
          className="h-5 w-5 accent-indigo-600"
        />
        <div>
          <div className="font-bold text-slate-800">
            Show header on every page
          </div>
          <div className="text-xs text-slate-500">
            Repeat the selected details on every page. If disabled, they will
            appear only on the first page of the generated document. <br></br>
            <br />
            <b>ℹ️ Note:</b>
            The repeating header is shown accurately in the{" "}
            <b>downloaded Word document</b> and <b>Print Preview</b>. The in-app
            preview may not fully reflect this feature.{" "}
          </div>
        </div>
      </label>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={options.showPageNumbers}
          onChange={onTogglePageNumbers}
          className="h-5 w-5 accent-indigo-600"
        />
        <div>
          <div className="font-bold text-slate-800">Show page numbers</div>
          <div className="text-xs text-slate-500">
            Adds Page 1, Page 2 and so on in the footer.
          </div>
        </div>
      </label>
    </section>
  );
}
