import { useState } from "react";
import {
  COLOR_SWATCHES,
  FONT_OPTIONS,
  LINE_SPACINGS,
  PRESETS,
  SIZE_LIMITS,
  STYLE_PARTS,
  cssTextStyle,
  getFontOption,
  isPresetUnchanged,
  normalizeTextStyle,
  presetTextStyle,
} from "../utils/textStyles";

const FONT_GROUPS = [
  { kind: "serif", label: "Serif" },
  { kind: "sans", label: "Sans-serif" },
  { kind: "mono", label: "Monospaced" },
];

const ALIGNMENTS = [
  { value: "left", label: "Left", icon: "≡" },
  { value: "center", label: "Centre", icon: "☰" },
  { value: "right", label: "Right", icon: "≣" },
  { value: "justify", label: "Justify", icon: "▤" },
];

const pdfFamilyName = (fontName) => {
  const kind = getFontOption(fontName).kind;
  return kind === "mono"
    ? "Courier"
    : kind === "sans"
      ? "Helvetica (Arial-like)"
      : "Times";
};

function ToggleButton({ pressed, onClick, label, children, className = "" }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-base transition focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
        pressed
          ? "border-indigo-600 bg-indigo-50 text-indigo-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function LivePreview({ style }) {
  const { parts, lineSpacing } = style;
  const lineHeight = 1.25 * lineSpacing;

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-inner">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Live preview
      </p>

      <div style={cssTextStyle(parts.title)}>
        <div>ASSIGNMENT 1</div>
        <div style={{ fontSize: `${Math.max(10, parts.title.size - 4)}pt` }}>
          PYTHON
        </div>
      </div>

      <div
        className="mt-3 border border-slate-400"
        style={{ ...cssTextStyle(parts.details), textAlign: "left" }}
      >
        <div className="grid grid-cols-[110px_1fr]">
          <div className="border-r border-slate-400 px-2 py-1 font-bold">
            Name
          </div>
          <div className="px-2 py-1">Rabadiya Manav</div>
        </div>
      </div>

      <div
        className="mt-3"
        style={{ ...cssTextStyle(parts.labels), textAlign: "left" }}
      >
        Question 1
      </div>
      <div className="mt-1 grid grid-cols-[70px_1fr] border border-slate-400">
        <div
          className="border-r border-slate-400 p-2"
          style={{ ...cssTextStyle(parts.labels), textAlign: "left" }}
        >
          Q-1
        </div>
        <div className="p-2">
          <p style={{ ...cssTextStyle(parts.question), lineHeight }}>
            Accept a string from the user and convert it into{" "}
            <strong>Uppercase</strong> and Lowercase. This sentence is a little
            longer so you can see how the alignment and spacing look.
          </p>
          <p
            className="mt-2"
            style={{ ...cssTextStyle(parts.sampleLabel), textAlign: "left" }}
          >
            Sample Input:
          </p>
          <pre
            className="ml-2 whitespace-pre-wrap"
            style={{
              ...cssTextStyle(parts.sample),
              textAlign: "left",
              lineHeight,
            }}
          >
            Enter string: python
          </pre>
          <p style={{ ...cssTextStyle(parts.sampleLabel), textAlign: "left" }}>
            Expected Output:
          </p>
          <pre
            className="ml-2 whitespace-pre-wrap"
            style={{
              ...cssTextStyle(parts.sample),
              textAlign: "left",
              lineHeight,
            }}
          >
            PYTHON
          </pre>
        </div>
      </div>

      <div
        className="mt-3 border-t border-slate-300 pt-1"
        style={cssTextStyle(parts.headerFooter)}
      >
        Rabadiya Manav | 24BCA196 | Page 1
      </div>
    </div>
  );
}

export default function TextStyleSection({ options, onChange }) {
  const [selectedKey, setSelectedKey] = useState("question");

  const style = normalizeTextStyle(options.textStyle);
  const part = style.parts[selectedKey];
  const partInfo = STYLE_PARTS.find((item) => item.key === selectedKey);
  const customised = !isPresetUnchanged(style);

  const updatePart = (changes) =>
    onChange({
      ...style,
      parts: { ...style.parts, [selectedKey]: { ...part, ...changes } },
    });

  const resetPart = () => updatePart(PRESETS[style.preset].parts[selectedKey]);

  const setSize = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    updatePart({
      size: Math.min(SIZE_LIMITS.max, Math.max(SIZE_LIMITS.min, number)),
    });
  };

  return (
    <section
      id="text-style-options"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-300/30 sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Text style</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Choose the font, size, colour and alignment, like in Word. It is
            applied to the Word file, the PDF and the preview, and remembered on
            this device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(presetTextStyle("classic"))}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
        >
          Reset to default
        </button>
      </div>

      <fieldset className="mb-5">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Ready-made styles{" "}
          {customised && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] normal-case text-amber-800">
              customised
            </span>
          )}
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const selected = style.preset === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(presetTextStyle(key))}
                className={`rounded-xl border-2 p-3 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
                  selected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-300"
                }`}
              >
                <span
                  className="block text-xl font-bold"
                  style={{
                    fontFamily: getFontOption(preset.parts.question.font).css,
                    color: preset.parts.title.color,
                  }}
                >
                  Aa Bb 123
                </span>
                <span className="mt-1 block text-sm font-bold text-slate-900">
                  {preset.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
          Line spacing
        </legend>
        <div className="inline-flex flex-wrap gap-2">
          {LINE_SPACINGS.map((item) => (
            <label
              key={item.value}
              className={`cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-bold transition focus-within:ring-4 focus-within:ring-indigo-200 ${
                style.lineSpacing === item.value
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
              }`}
            >
              <input
                type="radio"
                name="line-spacing"
                className="sr-only"
                checked={style.lineSpacing === item.value}
                onChange={() => onChange({ ...style, lineSpacing: item.value })}
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
        <div
          role="tablist"
          aria-label="Part of the document"
          className="flex flex-row gap-2 overflow-x-auto lg:flex-col"
        >
          {STYLE_PARTS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selectedKey === item.key}
              onClick={() => setSelectedKey(item.key)}
              className={`shrink-0 rounded-xl border-2 px-3 py-2 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
                selectedKey === item.key
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
              }`}
            >
              <span className="block text-sm font-bold">{item.label}</span>
              <span className="hidden text-xs text-slate-500 lg:block">
                {item.hint}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">{partInfo.label}</h3>
              <p className="text-xs text-slate-500">{partInfo.hint}</p>
            </div>
            <button
              type="button"
              onClick={resetPart}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              Reset this part
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Font
              </span>
              <select
                value={part.font}
                onChange={(event) => updatePart({ font: event.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                style={{ fontFamily: getFontOption(part.font).css }}
              >
                {FONT_GROUPS.map((group) => (
                  <optgroup key={group.kind} label={group.label}>
                    {FONT_OPTIONS.filter(
                      (font) => font.kind === group.kind,
                    ).map((font) => (
                      <option
                        key={font.name}
                        value={font.name}
                        style={{ fontFamily: font.css }}
                      >
                        {font.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-slate-500">
                PDF uses {pdfFamilyName(part.font)} for this font.
              </span>
            </label>

            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Size (pt)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Smaller"
                  onClick={() => setSize(part.size - SIZE_LIMITS.step)}
                  className="h-10 w-10 rounded-lg border-2 border-slate-200 bg-white text-lg font-bold hover:border-indigo-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                >
                  −
                </button>
                <input
                  type="number"
                  min={SIZE_LIMITS.min}
                  max={SIZE_LIMITS.max}
                  step={SIZE_LIMITS.step}
                  value={part.size}
                  onChange={(event) => setSize(event.target.value)}
                  aria-label="Font size in points"
                  className="h-10 w-20 rounded-lg border-2 border-slate-200 bg-white px-2 text-center text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  aria-label="Larger"
                  onClick={() => setSize(part.size + SIZE_LIMITS.step)}
                  className="h-10 w-10 rounded-lg border-2 border-slate-200 bg-white text-lg font-bold hover:border-indigo-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Style
              </span>
              <div className="flex gap-2">
                <ToggleButton
                  label="Bold"
                  pressed={part.bold}
                  onClick={() => updatePart({ bold: !part.bold })}
                  className="font-bold"
                >
                  B
                </ToggleButton>
                <ToggleButton
                  label="Italic"
                  pressed={part.italic}
                  onClick={() => updatePart({ italic: !part.italic })}
                  className="italic"
                >
                  I
                </ToggleButton>
                <ToggleButton
                  label="Underline"
                  pressed={part.underline}
                  onClick={() => updatePart({ underline: !part.underline })}
                  className="underline"
                >
                  U
                </ToggleButton>
              </div>
            </div>

            {partInfo.align && (
              <div>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Alignment
                </span>
                <div className="flex gap-2">
                  {ALIGNMENTS.map((item) => (
                    <ToggleButton
                      key={item.value}
                      label={item.label}
                      pressed={part.align === item.value}
                      onClick={() => updatePart({ align: item.value })}
                    >
                      {item.icon}
                    </ToggleButton>
                  ))}
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Colour
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={part.color}
                  onChange={(event) =>
                    updatePart({ color: event.target.value })
                  }
                  aria-label="Pick a colour"
                  className="h-10 w-12 cursor-pointer rounded-lg border-2 border-slate-200 bg-white p-1"
                />
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Colour ${color}`}
                    aria-pressed={part.color === color}
                    onClick={() => updatePart({ color })}
                    className={`h-8 w-8 rounded-full border-2 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 ${
                      part.color === color
                        ? "border-indigo-600 ring-2 ring-indigo-200"
                        : "border-white shadow ring-1 ring-slate-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <span className="ml-1 font-mono text-xs text-slate-500">
                  {part.color.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <LivePreview style={style} />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Word uses the exact font name, so the person opening the file needs that
        font installed (Arial, Times New Roman, Calibri and Courier New are on
        almost every computer). The PDF can only draw Times, Helvetica and
        Courier, so each font is matched to the closest of these.
      </p>
    </section>
  );
}
