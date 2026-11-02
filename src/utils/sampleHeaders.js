/**
 * Recognises the column / section titles used for sample data, whatever the
 * teacher calls them: "Sample Input", "Example Output", "Test Input",
 * "Expected Result", or just "Input" / "Output".
 */
const squash = (text) =>
  String(text).replace(/\*\*/g, "").replace(/\s+/g, "").toLowerCase();

const PREFIX_LABEL = {
  sample: "Sample",
  example: "Example",
  test: "Test",
  expected: "Expected",
};

/** "Sample Input / Call" -> label, or null when the text is not an input header. */
export function inputHeaderLabel(text) {
  const match = squash(text).match(
    /^(sample|example|test)?input(?:\/(call|action))?$/,
  );
  if (!match) return null;

  const prefix = match[1] ? `${PREFIX_LABEL[match[1]]} ` : "";
  const suffix = match[2]
    ? ` / ${match[2][0].toUpperCase()}${match[2].slice(1)}`
    : "";
  return `${prefix}Input${suffix}`;
}

/** "Expected Output" / "Sample Output" / "Result" ... -> label, or null. */
export function outputHeaderLabel(text) {
  const match = squash(text).match(
    /^(expected|sample|example|test)?(output|result)$/,
  );
  if (!match) return null;

  const prefix = match[1] ? `${PREFIX_LABEL[match[1]]} ` : "";
  return `${prefix}${match[2][0].toUpperCase()}${match[2].slice(1)}`;
}
