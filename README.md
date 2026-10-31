# AssignCraft

Turn a teacher's question file (PDF / DOCX / pasted text) into a formatted
assignment (Word or PDF), a Jupyter notebook, or a continuation of an
assignment you already completed. Everything runs in the browser.

## Structure

```
src/
  pages/            generic pages (Home, About, Features, ...)
  components/       shared UI
  utils/            generic logic
    pdfLayout.js      PDF text layout: splits Sample Input | Expected Output
                      tables by column, removes repeated page headers
    pdfExtractor.js   pdf.js + OCR fallback (uses pdfLayout)
    docxExtractor.js  DOCX -> text, keeps list numbers and sample tables
    questionParser.js finds the questions (validates the 1,2,3... sequence)
    questionFormat.js one place that defines how a question is written
                      (statement + "Sample Input:" / "Expected Output:")
    wordGenerator.js / pdfGenerator.js
  python/           everything specific to the Python course
    parserConfig.js   course headings / page-header noise for the parser
    constants.js      defaults (subject = PYTHON)
    pages/            Continue Assignment, Jupyter Tools
    utils/            continueAssignmentGenerator, jupyterNotebook, notebookPdf
scripts/            dev helpers (see below)
```

## Supported formats

- [Normal side (assignment generator)](docs/SUPPORTED_FORMATS_NORMAL.md)
- [Python side (Jupyter tools, Continue Assignment)](docs/SUPPORTED_FORMATS_PYTHON.md)

## Saved details (autofill)

Name, student ID, division and course are saved in this browser only
(`localStorage`, see `utils/profileStorage.js`) and shared by the assignment
generator and the Jupyter tools, so they are typed once. "Clear saved details"
on the Jupyter page removes them.

## Details table, header and footer

These are three independent places in the Word / PDF output. Each has its own
field list (`tableFields`, `headerFields`, `footerFields`), so choosing a detail
for one never changes the others. The options panel warns when the same detail
is selected in the table and in the header or footer.

## Question format

Each question is stored as editable text:

```
<statement lines, bullets, numbered steps>

Sample Input:
...

Expected Output:
...
```

"Show Sample Input & Expected Output" in Document Options controls whether the
samples are printed (Word, PDF, preview). Jupyter and Continue tools include them
as code blocks / monospaced blocks.

## Development

```
npm install
npm run dev
npm run build
npm run test:parser -- path/to/Assignment.pdf   # prints question count + warnings
SHOW=1 npm run test:parser -- file.pdf          # prints every parsed question
```
