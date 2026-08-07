export const DETAIL_FIELD_DEFINITIONS = [
  { key: "courseName", label: "Course Name" },
  { key: "fullName", label: "Full Name" },
  { key: "studentId", label: "Student ID" },
  { key: "division", label: "Division" },
  { key: "subject", label: "Subject" },
  { key: "subjectCode", label: "Subject Code" },
  { key: "assignmentNumber", label: "Assignment Number" },
];

export function getSelectedDetailRows(details, options) {
  const fields = options?.headerFields || {};

  return DETAIL_FIELD_DEFINITIONS
    .filter(({ key }) => Boolean(fields[key]))
    .map(({ key, label }) => [label, details?.[key] || ""]);
}

export function getSelectedHeaderParts(details, options) {
  const fields = options?.headerFields || {};
  const parts = [];

  if (fields.fullName && details.fullName) parts.push(details.fullName);
  if (fields.studentId && details.studentId) parts.push(details.studentId);
  if (fields.division && details.division) parts.push(`Division ${details.division}`);
  if (fields.subject && details.subject) parts.push(details.subject);
  if (fields.subjectCode && details.subjectCode) parts.push(details.subjectCode);
  if (fields.courseName && details.courseName) parts.push(details.courseName);
  if (fields.assignmentNumber && details.assignmentNumber) {
    parts.push(`Assignment ${details.assignmentNumber}`);
  }

  return parts;
}
