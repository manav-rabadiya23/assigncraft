import { EMPTY_DETAILS, PROFILE_STORAGE_KEY } from "../constants/defaults";

/**
 * One profile for the whole app, saved in this browser only (localStorage).
 * The assignment generator and the Jupyter tools share it, so the student
 * types name / ID / division / course once.
 */
function readRawProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function writeProfile(partial) {
  try {
    // Merge, so a page that only knows some fields never erases the others.
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ ...readRawProfile(), ...partial }),
    );
  } catch {
    // Storage can be blocked (private mode); the app still works without it.
  }
}

export function getSavedProfile() {
  const saved = readRawProfile();

  return {
    ...EMPTY_DETAILS,
    courseName: saved.courseName || "",
    fullName: saved.fullName || "",
    studentId: saved.studentId || "",
    division: saved.division || "",
  };
}

export function saveProfile(details) {
  writeProfile({
    courseName: details.courseName,
    fullName: details.fullName,
    studentId: details.studentId,
    division: details.division,
  });
}

/** Same profile, in the field names used by the Jupyter tools. */
export function getSavedNotebookProfile() {
  const saved = readRawProfile();

  return {
    name: saved.fullName || "",
    id: saved.studentId || "",
    course: saved.courseName || "",
    division: saved.division || "",
    semester: saved.semester || "",
  };
}

export function saveNotebookProfile(details) {
  writeProfile({
    fullName: details.name || "",
    studentId: details.id || "",
    courseName: details.course || "",
    division: details.division || "",
    semester: details.semester || "",
  });
}

export function clearSavedProfile() {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
