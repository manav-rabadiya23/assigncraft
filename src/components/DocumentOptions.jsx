import { useState } from "react";
import { FaPen, FaPlus, FaTrash } from "react-icons/fa6";
import { HEADER_FIELD_OPTIONS } from "../constants/defaults";

export default function DocumentOptions({
  options,
  customDetails = [],
  onToggleHeader,
  onToggleHeaderField,
  onTogglePageNumbers,
  onToggleCode,
  onToggleOutput,
  onAddCustomAnswerSection,
  onToggleCustomAnswerSection,
  onRenameCustomAnswerSection,
  onDeleteCustomAnswerSection,
}) {
  const [newSectionName, setNewSectionName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const addSection = () => {
    if (onAddCustomAnswerSection?.(newSectionName)) setNewSectionName("");
  };

  const saveRename = (id) => {
    if (onRenameCustomAnswerSection?.(id, editingName)) {
      setEditingId(null);
      setEditingName("");
    }
  };
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

          {customDetails.map((field) => {
            const fieldKey = `custom:${field.id}`;

            return (
              <label
                key={fieldKey}
                className="flex cursor-pointer items-center gap-2 text-sm font-medium text-violet-700"
              >
                <input
                  type="checkbox"
                  checked={Boolean(options.headerFields[fieldKey])}
                  onChange={() => onToggleHeaderField(fieldKey)}
                  className="h-4 w-4 accent-violet-600"
                />
                {field.label}
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600">
                  Custom
                </span>
              </label>
            );
          })}
        </div>
      </div>


      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-1 text-sm font-bold text-slate-800">Answer format</p>
        <p className="mb-4 text-xs text-slate-500">
          Choose which blank answer sections should appear for each question.
          Both are selected by default.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <input
              type="checkbox"
              checked={options.includeCode}
              onChange={onToggleCode}
              className="mt-0.5 h-5 w-5 accent-indigo-600"
            />
            <div>
              <div className="font-bold text-slate-800">Code</div>
              <div className="text-xs text-slate-500">
                Include the blank Code section for every question.
              </div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <input
              type="checkbox"
              checked={options.includeOutput}
              onChange={onToggleOutput}
              className="mt-0.5 h-5 w-5 accent-indigo-600"
            />
            <div>
              <div className="font-bold text-slate-800">Output</div>
              <div className="text-xs text-slate-500">
                Include the blank Output section for every question.
              </div>
            </div>
          </label>

          {(options.customAnswerSections || []).map((section) => (
            <div
              key={section.id}
              className="flex items-start gap-3 rounded-xl border border-violet-200 bg-white p-3"
            >
              <input
                type="checkbox"
                checked={section.enabled}
                onChange={() => onToggleCustomAnswerSection(section.id)}
                className="mt-0.5 h-5 w-5 accent-violet-600"
              />

              <div className="min-w-0 flex-1">
                {editingId === section.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveRename(section.id);
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-violet-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveRename(section.id)}
                      className="rounded-lg bg-violet-600 px-3 text-xs font-bold text-white"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-bold text-slate-800">{section.label}</div>
                    <div className="text-xs text-slate-500">
                      Custom blank section for every question.
                    </div>
                  </>
                )}
              </div>

              {editingId !== section.id && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(section.id);
                      setEditingName(section.label);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                    aria-label={`Edit ${section.label}`}
                  >
                    <FaPen className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomAnswerSection(section.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${section.label}`}
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-700">
            Add custom answer section
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addSection();
              }}
              placeholder="Example: Algorithm, Explanation, Result"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
            >
              <FaPlus />
              Add Section
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Added sections are selected automatically. Uncheck a section if you do not want it in the document.
          </p>
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
