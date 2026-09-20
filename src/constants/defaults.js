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

export const HEADER_FIELD_OPTIONS = [
  { key: "fullName", label: "Full Name" },
  { key: "studentId", label: "Student ID" },
  { key: "division", label: "Division" },
  { key: "subject", label: "Subject" },
  { key: "subjectCode", label: "Subject Code" },
  { key: "courseName", label: "Course Name" },
  { key: "assignmentNumber", label: "Assignment Number" },
];

export const DEFAULT_DOCUMENT_OPTIONS = {
  headerMode: "none",
  footerMode: "none",
  showPageNumbers: false,
  includeCode: true,
  includeOutput: true,
  customAnswerSections: [],
  headerFieldOrder: [
    "fullName",
    "studentId",
    "division",
    "subject",
    "subjectCode",
    "courseName",
    "assignmentNumber",
  ],
  footerFieldOrder: [
    "courseName",
    "subject",
    "assignmentNumber",
    "fullName",
    "studentId",
    "division",
    "subjectCode",
  ],
  headerFields: {
    fullName: true,
    studentId: true,
    division: true,
    subject: true,
    subjectCode: true,
    courseName: false,
    assignmentNumber: false,
  },
  footerFields: {
    fullName: false,
    studentId: false,
    division: false,
    subject: false,
    subjectCode: false,
    courseName: false,
    assignmentNumber: false,
  },
};
