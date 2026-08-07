import { EMPTY_DETAILS, PROFILE_STORAGE_KEY } from "../constants/defaults";

export function getSavedProfile() {
  try {
    const savedProfile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));

    return {
      ...EMPTY_DETAILS,
      courseName: savedProfile?.courseName || "",
      fullName: savedProfile?.fullName || "",
      studentId: savedProfile?.studentId || "",
      division: savedProfile?.division || "",
    };
  } catch {
    return { ...EMPTY_DETAILS };
  }
}

export function saveProfile(details) {
  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify({
      courseName: details.courseName,
      fullName: details.fullName,
      studentId: details.studentId,
      division: details.division,
    }),
  );
}
