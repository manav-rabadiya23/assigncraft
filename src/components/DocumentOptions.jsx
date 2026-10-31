import { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaPlus,
  FaTrash,
  FaPen,
} from "react-icons/fa6";
import { HEADER_FIELD_OPTIONS } from "../constants/defaults";

const DISPLAY_MODES = [
  { value: "none", label: "Don't show" },
  { value: "first", label: "First page only" },
  { value: "every", label: "Every page" },
];

function FieldList({ area, options, customDetails, onToggle, onReorder }) {
  const [draggedKey, setDraggedKey] = useState(null);
  const fieldState = {
    header: options.headerFields,
    footer: options.footerFields,
    table: options.tableFields,
  }[area];
  const order = {
    header: options.headerFieldOrder,
    footer: options.footerFieldOrder,
    table: options.tableFieldOrder,
  }[area];
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
  const orderedKeys = [...(order || []), ...availableFields].filter(
    (key, index, list) =>
      availableFields.includes(key) && list.indexOf(key) === index,
  );

  const move = (key, direction) => {
    const index = orderedKeys.indexOf(key);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= orderedKeys.length) return;
    const nextOrder = [...orderedKeys];
    [nextOrder[index], nextOrder[next]] = [nextOrder[next], nextOrder[index]];
    onReorder(nextOrder);
  };

  const drop = (targetKey) => {
    if (!draggedKey || draggedKey === targetKey) return;
    const nextOrder = [...orderedKeys];
    const from = nextOrder.indexOf(draggedKey);
    const to = nextOrder.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    nextOrder.splice(from, 1);
    nextOrder.splice(to, 0, draggedKey);
    onReorder(nextOrder);
    setDraggedKey(null);
  };

  return (
    <div className="space-y-2">
      {orderedKeys.map((key) => {
        const field = fieldMap.get(key);
        if (!field) return null;
        return (
          <div
            key={key}
            draggable
            onDragStart={() => setDraggedKey(key)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => drop(key)}
            onDragEnd={() => setDraggedKey(null)}
            className={`flex cursor-grab items-center gap-3 rounded-xl border bg-white p-3 transition active:cursor-grabbing ${draggedKey === key ? "border-indigo-400 opacity-50" : "border-slate-200 hover:border-indigo-200"}`}
          >
            <span className="select-none text-lg text-slate-400">⋮⋮</span>
            <input
              type="checkbox"
              checked={Boolean(fieldState?.[key])}
              onChange={() => onToggle(key)}
              className={`h-4 w-4 ${field.custom ? "accent-violet-600" : "accent-indigo-600"}`}
            />
            <span
              className={`text-sm font-medium ${field.custom ? "text-violet-700" : "text-slate-700"}`}
            >
              {field.label}
            </span>
            {field.custom && (
              <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-600">
                Custom
              </span>
            )}
            <div className="ml-auto flex gap-1">
              <button
                type="button"
                onClick={() => move(key, -1)}
                disabled={orderedKeys.indexOf(key) === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-indigo-50 disabled:opacity-30"
                aria-label={`Move ${field.label} up`}
              >
                <FaArrowUp className="text-xs" />
              </button>
              <button
                type="button"
                onClick={() => move(key, 1)}
                disabled={orderedKeys.indexOf(key) === orderedKeys.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-indigo-50 disabled:opacity-30"
                aria-label={`Move ${field.label} down`}
              >
                <FaArrowDown className="text-xs" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MODE_HINTS = {
  none: "Leave it out of the document.",
  every: "Printed at the top or bottom of every page.",
  first: "Printed on page 1 only.",
};

/** Always-visible choice (instead of a hidden dropdown), keyboard friendly. */
function PlacementSelector({ value, onChange, name }) {
  const current = value || "none";

  return (
    <fieldset className="mb-4">
      <legend className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
        {name} placement
      </legend>

      <div className="grid gap-2 sm:grid-cols-3">
        {DISPLAY_MODES.map((mode) => {
          const selected = current === mode.value;

          return (
            <label
              key={mode.value}
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 text-sm transition focus-within:ring-4 focus-within:ring-indigo-200 ${
                selected
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
              }`}
            >
              <input
                type="radio"
                name={`placement-${name}`}
                value={mode.value}
                checked={selected}
                onChange={() => onChange(mode.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 font-bold">
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-indigo-600" : "border-slate-300"
                  }`}
                >
                  {selected && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  )}
                </span>
                {mode.label}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                {MODE_HINTS[mode.value]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function DocumentOptions({
  options,
  customDetails = [],
  onToggleDetailsTable,
  onToggleTableField,
  onReorderTableField,
  onSetHeaderMode,
  onToggleHeaderField,
  onReorderHeaderField,
  onToggleFooterField,
  onReorderFooterField,
  onSetFooterMode,
  onTogglePageNumbers,
  onToggleCode,
  onToggleOutput,
  onToggleSamples,
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

  // Tell the student when the same detail is printed in more than one place.
  const fieldLabels = new Map([
    ...HEADER_FIELD_OPTIONS.map((field) => [field.key, field.label]),
    ...customDetails.map((field) => [`custom:${field.id}`, field.label]),
  ]);
  const tableShown = options.showDetailsTable !== false;
  const sharedWithTable = (fields, mode) =>
    !tableShown || mode === "none"
      ? []
      : Object.keys(options.tableFields || {}).filter(
          (key) => options.tableFields[key] && fields?.[key],
        );
  const repeated = [
    ...new Set([
      ...sharedWithTable(options.headerFields, options.headerMode),
      ...sharedWithTable(options.footerFields, options.footerMode),
    ]),
  ].map((key) => fieldLabels.get(key) || key);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-600 text-lg font-bold text-white">
          3
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Options</h2>
          <p className="mt-1 text-sm text-slate-500">
            The details table, the header and the footer each have their own
            field list, so choosing a detail for one never changes the others.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900">Details table</h3>
          <p className="text-xs text-slate-500">
            The table under the assignment title at the top of the first page.
          </p>
        </div>
        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <input
            type="checkbox"
            checked={tableShown}
            onChange={onToggleDetailsTable}
            className="h-4 w-4 accent-indigo-600"
          />
          <div>
            <div className="text-sm font-bold text-slate-800">
              Show details table
            </div>
            <div className="text-xs text-slate-500">
              Turn off to start the document with the questions only.
            </div>
          </div>
        </label>
        {tableShown && (
          <FieldList
            area="table"
            options={options}
            customDetails={customDetails}
            onToggle={onToggleTableField}
            onReorder={onReorderTableField}
          />
        )}
      </div>

      {repeated.length > 0 && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {repeated.join(", ")} will be printed in the details table and again
          in the header or footer. Untick it in one of them if you do not want
          it twice.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          id="header-options"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-3">
            <h3 className="font-bold text-slate-900">Header</h3>
            <p className="text-xs text-slate-500">
              Choose which Assignment Details appear in the header.
            </p>
          </div>
          <PlacementSelector
            name="Header"
            value={options.headerMode}
            onChange={onSetHeaderMode}
          />
          {(options.headerMode || "none") === "none" ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
              Choose "Every page" or "First page only" to pick the details.
            </p>
          ) : (
            <FieldList
              area="header"
              options={options}
              customDetails={customDetails}
              onToggle={onToggleHeaderField}
              onReorder={onReorderHeaderField}
            />
          )}
        </div>

        <div
          id="footer-options"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-3">
            <h3 className="font-bold text-slate-900">Footer</h3>
            <p className="text-xs text-slate-500">
              Choose which Assignment Details appear in the footer.
            </p>
          </div>
          <PlacementSelector
            name="Footer"
            value={options.footerMode}
            onChange={onSetFooterMode}
          />
          {(options.footerMode || "none") === "none" ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
              Choose "Every page" or "First page only" to pick the details.
            </p>
          ) : (
            <FieldList
              area="footer"
              options={options}
              customDetails={customDetails}
              onToggle={onToggleFooterField}
              onReorder={onReorderFooterField}
            />
          )}
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <input
              type="checkbox"
              checked={options.showPageNumbers}
              onChange={onTogglePageNumbers}
              className="h-4 w-4 accent-indigo-600"
            />
            <div>
              <div className="text-sm font-bold text-slate-800">
                Page Number
              </div>
              <div className="text-xs text-slate-500">
                Add Page 1, Page 2 and so on.
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-1 text-sm font-bold text-slate-800">Question format</p>
        <p className="mb-4 text-xs text-slate-500">
          Questions are shown as a clear statement, followed by Sample Input and
          Expected Output when the teacher's file contains them.
        </p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <input
            type="checkbox"
            checked={options.includeSamples !== false}
            onChange={onToggleSamples}
            className="mt-0.5 h-5 w-5 accent-indigo-600"
          />
          <div>
            <div className="font-bold text-slate-800">
              Sample Input &amp; Expected Output
            </div>
            <div className="text-xs text-slate-500">
              Keep the sample input and expected output under each question.
              Turn off to print only the question statement.
            </div>
          </div>
        </label>
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
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
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
                  <div className="font-bold text-slate-800">
                    {section.label}
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  Custom blank answer section.
                </div>
              </div>
              {editingId !== section.id && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(section.id);
                      setEditingName(section.label);
                    }}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label={`Edit ${section.label}`}
                  >
                    <FaPen />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomAnswerSection(section.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    aria-label={`Delete ${section.label}`}
                  >
                    <FaTrash />
                  </button>
                </>
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
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
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
            Added sections are selected automatically.
          </p>
        </div>
      </div>
    </section>
  );
}
