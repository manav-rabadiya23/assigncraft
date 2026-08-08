export const PROFILE_STORAGE_KEY = "assignment-generator-profile";

export const PORTFOLIO_URL = "https://rabadiya-manav.vercel.app";
export const DEVLOKS_URL = "https://devlok-team.vercel.app";

export const EMPTY_DETAILS = {
  courseName: "",
  fullName: "",
  studentId: "",
  division: "",
  subject: "",
  subjectCode: "",
  assignmentNumber: "",
};

export const DEFAULT_DOCUMENT_OPTIONS = {
  showHeaderEveryPage: false,
  showPageNumbers: false,
  includeCode: true,
  includeOutput: true,
  customAnswerSections: [],
  headerFields: {
    fullName: true,
    studentId: true,
    division: true,
    subject: true,
    subjectCode: true,
    courseName: false,
    assignmentNumber: false,
  },
};

export const HEADER_FIELD_OPTIONS = [
  { key: "fullName", label: "Full Name" },
  { key: "studentId", label: "Student ID" },
  { key: "division", label: "Division" },
  { key: "subject", label: "Subject" },
  { key: "subjectCode", label: "Subject Code" },
  { key: "courseName", label: "Course Name" },
  { key: "assignmentNumber", label: "Assignment Number" },
];
