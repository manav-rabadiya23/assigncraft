import { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";
import { HEADER_FIELD_OPTIONS } from "../constants/defaults";

export default function DocumentOptions({
  options,
  customDetails = [],
  onToggleHeader,
  onToggleHeaderField,
  onReorderHeaderField,
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
  const [draggedKey, setDraggedKey] = useState(null);

  const moveField = (key, direction, orderedKeys) => {
    const currentIndex = orderedKeys.indexOf(key);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= orderedKeys.length) return;

    const nextOrder = [...orderedKeys];

    [nextOrder[currentIndex], nextOrder[newIndex]] = [
      nextOrder[newIndex],
      nextOrder[currentIndex],
    ];

    onReorderHeaderField(nextOrder);
  };

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
          Select the details you want to show, then drag and drop them to change
          their order.
        </p>

        <div className="space-y-2">
          {(() => {
            const availableFields = [
              ...HEADER_FIELD_OPTIONS.map((field) => field.key),
              ...customDetails.map((field) => `custom:${field.id}`),
            ];
            const fieldMap = new Map([
              ...HEADER_FIELD_OPTIONS.map((field) => [field.key, field]),
              ...customDetails.map((field) => [
                `custom:${field.id}`,
                { ...field, key: `custom:${field.id}`, custom: true },
              ]),
            ]);
            const orderedKeys = [
              ...(options.headerFieldOrder || []),
              ...availableFields,
            ].filter(
              (key, index, list) =>
                availableFields.includes(key) && list.indexOf(key) === index,
            );
            const handleDrop = (targetKey) => {
              if (!draggedKey || draggedKey === targetKey) return;
              const nextOrder = [...orderedKeys];
              const fromIndex = nextOrder.indexOf(draggedKey);
              const toIndex = nextOrder.indexOf(targetKey);
              if (fromIndex < 0 || toIndex < 0) return;
              nextOrder.splice(fromIndex, 1);
              nextOrder.splice(toIndex, 0, draggedKey);
              onReorderHeaderField(nextOrder);
              setDraggedKey(null);
            };
            return orderedKeys.map((key) => {
              const field = fieldMap.get(key);
              if (!field) return null;
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setDraggedKey(key)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(key)}
                  onDragEnd={() => setDraggedKey(null)}
                  className={`flex cursor-grab items-center gap-3 rounded-xl border bg-white p-3 transition active:cursor-grabbing ${draggedKey === key ? "border-indigo-400 opacity-50 shadow-md" : "border-slate-200 hover:border-indigo-200 hover:shadow-sm"}`}
                >
                  <span
                    className="select-none text-lg leading-none text-slate-400"
                    title="Drag to reorder"
                    aria-hidden="true"
                  >
                    ⋮⋮
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(options.headerFields[key])}
                    onChange={() => onToggleHeaderField(key)}
                    className={`h-4 w-4 ${field.custom ? "accent-violet-600" : "accent-indigo-600"}`}
                  />
                  <span
                    className={`text-sm font-medium ${field.custom ? "text-violet-700" : "text-slate-700"}`}
                  >
                    {field.label}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    {field.custom && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600">
                        Custom
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => moveField(key, -1, orderedKeys)}
                      disabled={orderedKeys.indexOf(key) === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Move ${field.label} up`}
                    >
                      <FaArrowUp className="text-xs" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveField(key, 1, orderedKeys)}
                      disabled={
                        orderedKeys.indexOf(key) === orderedKeys.length - 1
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Move ${field.label} down`}
                    >
                      <FaArrowDown className="text-xs" />
                    </button>
                  </div>
                </div>
              );
            });
          })()}
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
                    <div className="font-bold text-slate-800">
                      {section.label}
                    </div>
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
            Added sections are selected automatically. Uncheck a section if you
            do not want it in the document.
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
