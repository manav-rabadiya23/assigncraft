// Small, dependency-free text helpers shared by the extractors and the parser.

// Word/PDF bullets often arrive as Private-Use-Area glyphs (e.g. U+F0B7).
const PRIVATE_USE_BULLETS = /[\uE000-\uF8FF]/g;

export function normalizeLine(line = "") {
  return String(line)
    .replace(PRIVATE_USE_BULLETS, "•")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}
