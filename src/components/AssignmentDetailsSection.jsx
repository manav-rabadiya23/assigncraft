import { useState } from "react";
import FormInput from "./FormInput";

const EMPTY_CUSTOM_DETAIL = {
  label: "",
  value: "",
};

export default function AssignmentDetailsSection({
  details,
  onChange,
  customDetails = [],
  onAddCustomDetail,
  onUpdateCustomDetail,
  onDeleteCustomDetail,
}) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM_DETAIL);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_CUSTOM_DETAIL);

  const handleAdd = () => {
    const added = onAddCustomDetail?.(customForm);

    if (added) {
      setCustomForm(EMPTY_CUSTOM_DETAIL);
      setShowCustomForm(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      label: item.label,
      value: item.value,
    });
  };

  const saveEdit = () => {
    const updated = onUpdateCustomDetail?.(editingId, editForm);

    if (updated) {
      setEditingId(null);
      setEditForm(EMPTY_CUSTOM_DETAIL);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_CUSTOM_DETAIL);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">
          2
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Assignment Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Course name, your name, ID and division are saved in this browser.
            Add a custom detail if your assignment needs an extra field.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          label="Course Name"
          name="courseName"
          value={details.courseName}
          placeholder="Example: BCA"
          onChange={onChange}
        />
        <FormInput
          label="Full Name"
          name="fullName"
          value={details.fullName}
          placeholder="Enter your full name"
          onChange={onChange}
        />
        <FormInput
          label="Student ID"
          name="studentId"
          value={details.studentId}
          placeholder="Example: 24BCA196"
          onChange={onChange}
        />
        <FormInput
          label="Division"
          name="division"
          value={details.division}
          placeholder="Example: 3"
          onChange={onChange}
        />
        <FormInput
          label="Subject"
          name="subject"
          value={details.subject}
          placeholder="Enter subject name"
          onChange={onChange}
        />
        <FormInput
          label="Subject Code"
          name="subjectCode"
          value={details.subjectCode}
          placeholder="Example: CAUC301"
          onChange={onChange}
        />
        <FormInput
          label="Assignment Number"
          name="assignmentNumber"
          value={details.assignmentNumber}
          placeholder="Example: 1"
          onChange={onChange}
        />
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-slate-900">Custom Details</h3>
            <p className="mt-1 text-sm text-slate-500">
              Add fields such as Semester, Batch, Faculty Name or College Name.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomForm((current) => !current)}
            className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
          >
            {showCustomForm ? "Cancel" : "+ Add Custom Detail"}
          </button>
        </div>

        {showCustomForm && (
          <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Detail Name
                </label>
                <input
                  type="text"
                  value={customForm.label}
                  placeholder="Example: Semester"
                  onChange={(event) =>
                    setCustomForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Value
                </label>
                <input
                  type="text"
                  value={customForm.value}
                  placeholder="Example: Semester 5"
                  onChange={(event) =>
                    setCustomForm((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomForm(EMPTY_CUSTOM_DETAIL);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAdd}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
              >
                Add Detail
              </button>
            </div>
          </div>
        )}

        {customDetails.length > 0 && (
          <div className="mt-4 space-y-3">
            {customDetails.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                {editingId === item.id ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Detail Name
                        </label>
                        <input
                          type="text"
                          value={editForm.label}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Value
                        </label>
                        <input
                          type="text"
                          value={editForm.value}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              value: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700"
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800">
                        {item.label}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-600">
                        {item.value || "No value entered"}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${item.label}" from Assignment Details?`,
                            )
                          ) {
                            onDeleteCustomDetail?.(item.id);
                          }
                        }}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
