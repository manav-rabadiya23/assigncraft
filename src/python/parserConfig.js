/**
 * Course profile for the Python Programming (CAUE302) assignments.
 * Everything that is specific to this course lives in the `python` folder so
 * the generic parser in src/utils stays reusable for other subjects.
 */
export const PYTHON_PARSER_CONFIG = {
  // Section titles that sit between question groups in the teacher's files.
  ignoredHeadings: [
    "Practical Assignment-1",
    "Practical Assignment 1",
    "Data Types, Variables, and Literals",
    "Identifiers and Naming Rules",
    "Operators",
    "Decision Making & Control Flow Statements",
  ],
  // Page headers used by the department (also removed generically when repeated).
  ignoredPatterns: [
    /^smt\.\s+chandaben\b/i,
    /^bca\s+semester[\s-]*[ivxlcdm\d]+/i,
    /^practice\s+questions$/i,
  ],
};
