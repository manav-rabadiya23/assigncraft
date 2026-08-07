export function sanitizeFilePart(value, fallback = "assignment") {
  const cleaned = String(value || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  return cleaned || fallback;
}

export function createAssignmentBaseName(details) {
  const student = sanitizeFilePart(details.studentId, "student");
  const subject = sanitizeFilePart(details.subjectCode, "subject");
  const assignment = sanitizeFilePart(details.assignmentNumber, "1");
  return `${student}-${subject}-Assignment-${assignment}`;
}
