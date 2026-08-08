import { detectQuestions } from "./questionParser";

function stripQuestionPrefix(value) {
  return value
    .replace(/^\s*(?:q(?:uestion)?\s*(?:no\.?\s*)?[-.:]?\s*)?\d{1,3}\s*[.)\-:]\s*/i, "")
    .replace(/^\s*[-•]\s*/, "")
    .trim();
}

export function parsePastedQuestions(text) {
  const normalized = String(text || "").replace(/\r/g, "").trim();
  if (!normalized) return [];

  const detected = detectQuestions(normalized);
  if (detected.questions.length > 1) return detected.questions;

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((value) => stripQuestionPrefix(value.replace(/\n+/g, " ")))
    .filter(Boolean);

  if (paragraphs.length > 1) return paragraphs;

  return normalized
    .split("\n")
    .map(stripQuestionPrefix)
    .filter((value) => value.length >= 3);
}
