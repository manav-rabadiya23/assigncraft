/**
 * Text style (font, size, colour ...) for the assignment document.
 * Pure helpers shared by the Word generator, the PDF generator, the preview and
 * the selection screen, so all of them agree on what a style means.
 */

/* --------------------------------- fonts --------------------------------- */

// `kind` decides which built-in PDF font is used (jsPDF only has Times,
// Helvetica and Courier). Word uses the font by name.
export const FONT_OPTIONS = [
  {
    name: "Times New Roman",
    kind: "serif",
    css: '"Times New Roman", Times, serif',
  },
  { name: "Georgia", kind: "serif", css: 'Georgia, "Times New Roman", serif' },
  {
    name: "Cambria",
    kind: "serif",
    css: 'Cambria, Georgia, "Times New Roman", serif',
  },
  { name: "Arial", kind: "sans", css: "Arial, Helvetica, sans-serif" },
  { name: "Calibri", kind: "sans", css: "Calibri, Carlito, Arial, sans-serif" },
  { name: "Verdana", kind: "sans", css: "Verdana, Geneva, sans-serif" },
  { name: "Tahoma", kind: "sans", css: "Tahoma, Geneva, sans-serif" },
  {
    name: "Trebuchet MS",
    kind: "sans",
    css: '"Trebuchet MS", Arial, sans-serif',
  },
  {
    name: "Courier New",
    kind: "mono",
    css: '"Courier New", Courier, monospace',
  },
  { name: "Consolas", kind: "mono", css: 'Consolas, "Courier New", monospace' },
  {
    name: "Lucida Console",
    kind: "mono",
    css: '"Lucida Console", "Courier New", monospace',
  },
];

const DEFAULT_FONT = FONT_OPTIONS[0];

export function getFontOption(name) {
  return FONT_OPTIONS.find((font) => font.name === name) || DEFAULT_FONT;
}

/* --------------------------------- parts --------------------------------- */

export const STYLE_PARTS = [
  {
    key: "title",
    label: "Title & subject",
    hint: "ASSIGNMENT 1 and the subject line",
    align: true,
  },
  {
    key: "details",
    label: "Details table",
    hint: "Name, ID, division ... in the table",
  },
  { key: "labels", label: "Labels", hint: "Question 1, Q-1, Code, Output" },
  {
    key: "question",
    label: "Question text",
    hint: "The question statement",
    align: true,
  },
  {
    key: "sampleLabel",
    label: "Sample headings",
    hint: "Sample Input: / Expected Output:",
  },
  {
    key: "sample",
    label: "Sample text",
    hint: "The sample input and output lines",
  },
  {
    key: "headerFooter",
    label: "Header & footer",
    hint: "Page header, footer and page number",
  },
];

export const SIZE_LIMITS = { min: 8, max: 32, step: 0.5 };
export const LINE_SPACINGS = [
  { value: 1, label: "Tight" },
  { value: 1.15, label: "Normal" },
  { value: 1.5, label: "Relaxed" },
];
export const COLOR_SWATCHES = [
  "#000000",
  "#374151",
  "#1f3a5f",
  "#1d4ed8",
  "#0f766e",
  "#15803d",
  "#b45309",
  "#b91c1c",
  "#7e22ce",
];

const part = (font, size, extra = {}) => ({
  font,
  size,
  bold: false,
  italic: false,
  underline: false,
  color: "#000000",
  align: "left",
  ...extra,
});

/* -------------------------------- presets -------------------------------- */

export const PRESETS = {
  classic: {
    label: "Classic",
    description: "Times New Roman, black text",
    lineSpacing: 1,
    parts: {
      title: part("Times New Roman", 17, { bold: true, align: "center" }),
      details: part("Times New Roman", 12),
      labels: part("Times New Roman", 12, { bold: true }),
      question: part("Times New Roman", 12),
      sampleLabel: part("Times New Roman", 11, { bold: true }),
      sample: part("Courier New", 10.5),
      headerFooter: part("Times New Roman", 9, { align: "center" }),
    },
  },
  modern: {
    label: "Modern",
    description: "Calibri with blue headings",
    lineSpacing: 1.15,
    parts: {
      title: part("Calibri", 20, {
        bold: true,
        align: "center",
        color: "#1f3a5f",
      }),
      details: part("Calibri", 11.5),
      labels: part("Calibri", 11.5, { bold: true, color: "#1f3a5f" }),
      question: part("Calibri", 11.5, { color: "#111827" }),
      sampleLabel: part("Calibri", 10.5, { bold: true, color: "#1d4ed8" }),
      sample: part("Consolas", 10, { color: "#374151" }),
      headerFooter: part("Calibri", 9, { align: "center", color: "#374151" }),
    },
  },
  compact: {
    label: "Compact",
    description: "Arial, smaller text, fewer pages",
    lineSpacing: 1,
    parts: {
      title: part("Arial", 15, { bold: true, align: "center" }),
      details: part("Arial", 10),
      labels: part("Arial", 10, { bold: true }),
      question: part("Arial", 10),
      sampleLabel: part("Arial", 9.5, { bold: true }),
      sample: part("Courier New", 9),
      headerFooter: part("Arial", 8, { align: "center" }),
    },
  },
};

export const DEFAULT_PRESET = "classic";

/* ------------------------------ normalising ------------------------------ */

const HEX = /^#[0-9a-f]{6}$/i;

function cleanPart(value, fallback) {
  const source = value && typeof value === "object" ? value : {};
  const size = Number(source.size);

  return {
    font: FONT_OPTIONS.some((font) => font.name === source.font)
      ? source.font
      : fallback.font,
    size:
      Number.isFinite(size) && size > 0
        ? Math.min(SIZE_LIMITS.max, Math.max(SIZE_LIMITS.min, size))
        : fallback.size,
    bold: typeof source.bold === "boolean" ? source.bold : fallback.bold,
    italic:
      typeof source.italic === "boolean" ? source.italic : fallback.italic,
    underline:
      typeof source.underline === "boolean"
        ? source.underline
        : fallback.underline,
    color: HEX.test(source.color || "")
      ? source.color.toLowerCase()
      : fallback.color,
    align: ["left", "center", "right", "justify"].includes(source.align)
      ? source.align
      : fallback.align,
  };
}

/** Anything (saved data, partial data, nothing) -> a complete, valid style. */
export function normalizeTextStyle(saved) {
  const presetKey = PRESETS[saved?.preset] ? saved.preset : DEFAULT_PRESET;
  const preset = PRESETS[presetKey];
  const lineSpacing = LINE_SPACINGS.some(
    (item) => item.value === Number(saved?.lineSpacing),
  )
    ? Number(saved.lineSpacing)
    : preset.lineSpacing;

  const parts = {};
  STYLE_PARTS.forEach(({ key }) => {
    parts[key] = cleanPart(saved?.parts?.[key], preset.parts[key]);
  });

  return { preset: presetKey, lineSpacing, parts };
}

export function presetTextStyle(presetKey) {
  const preset = PRESETS[presetKey] || PRESETS[DEFAULT_PRESET];
  return normalizeTextStyle({
    preset: PRESETS[presetKey] ? presetKey : DEFAULT_PRESET,
    lineSpacing: preset.lineSpacing,
    parts: preset.parts,
  });
}

/** True when the current style still equals its preset (no custom edits). */
export function isPresetUnchanged(style) {
  const reference = presetTextStyle(style.preset);
  return (
    reference.lineSpacing === style.lineSpacing &&
    STYLE_PARTS.every(({ key }) =>
      Object.keys(reference.parts[key]).every(
        (field) => reference.parts[key][field] === style.parts[key][field],
      ),
    )
  );
}

export const getPartStyle = (options, key) =>
  normalizeTextStyle(options?.textStyle).parts[key];

export const getLineSpacing = (options) =>
  normalizeTextStyle(options?.textStyle).lineSpacing;

/* --------------------------------- storage --------------------------------- */

const STORAGE_KEY = "assigncraft-text-style";

export function loadSavedTextStyle() {
  try {
    return normalizeTextStyle(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return presetTextStyle(DEFAULT_PRESET);
  }
}

export function saveTextStyle(style) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
  } catch {
    // storage may be blocked; the style still works for this visit
  }
}

/* --------------------------- output-specific helpers --------------------------- */

export const hexToRgb = (hex) => {
  const value = HEX.test(hex || "") ? hex.slice(1) : "000000";
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
};

/** Properties for a docx TextRun. `extra.bold` forces bold (e.g. **bold** text). */
export function wordRunProps(style, extra = {}) {
  return {
    font: style.font,
    size: Math.round(style.size * 2), // Word measures in half-points
    bold: Boolean(style.bold || extra.bold),
    italics: Boolean(style.italic),
    underline: style.underline ? {} : undefined,
    color: style.color.slice(1).toUpperCase(),
  };
}

/** jsPDF only has three families, so each font maps to its closest one. */
export function pdfFontFor(style, extraBold = false) {
  const kind = getFontOption(style.font).kind;
  const family =
    kind === "mono" ? "courier" : kind === "sans" ? "helvetica" : "times";
  const bold = style.bold || extraBold;
  const fontStyle =
    bold && style.italic
      ? "bolditalic"
      : bold
        ? "bold"
        : style.italic
          ? "italic"
          : "normal";
  return { family, fontStyle };
}

export const PT_TO_MM = 0.3528;
/** Height of one text line in millimetres. */
export const lineHeightMm = (size, spacing = 1) =>
  size * PT_TO_MM * 1.2 * spacing;

/** Inline CSS for the preview and the live sample. */
export function cssTextStyle(style, extra = {}) {
  return {
    fontFamily: getFontOption(style.font).css,
    fontSize: `${style.size}pt`,
    fontWeight: style.bold || extra.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    color: style.color,
    textAlign: style.align,
  };
}
