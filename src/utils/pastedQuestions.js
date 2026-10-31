import { detectQuestions } from "./questionParser";
import { stripQuestionNumber } from "./questionFormat";

/**
 * Turns pasted text into a list of questions.
 * 1. Numbered / "Q1" style text goes through the full question parser
 *    (including Sample Input / Expected Output blocks).
 * 2. Otherwise blank-line separated paragraphs are used.
 * 3. As a last resort every non-empty line is a question.
 */
export function parsePastedQuestions(text) {
  const normalized = String(text || "").replace(/\r/g, "").trim();
  if (!normalized) return [];

  const detected = detectQuestions(normalized);
  if (detected.questions.length > 1) return detected.questions;

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((value) => stripQuestionNumber(value.replace(/\n+/g, " ")))
    .filter(Boolean);

  if (paragraphs.length > 1) return paragraphs;

  return normalized
    .split("\n")
    .map((line) => stripQuestionNumber(line.replace(/^\s*[-•]\s*/, "")))
    .filter((value) => value.length >= 3);
}
