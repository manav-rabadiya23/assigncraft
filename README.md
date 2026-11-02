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

See [docs/SUPPORTED_FORMATS.md](docs/SUPPORTED_FORMATS.md) for what you can upload, how a question file should look, and a worked example.

## Home page wizard

`pages/HomePage.jsx` shows the tool in four steps (questions, details, layout and style,
preview and download). The step is kept in the address (`#step-2`), so the browser Back and
Forward buttons work. The step bar and the Back / Next buttons are in `components/WizardNav.jsx`,
and the recap on the last step is `components/WizardSummary.jsx`. The sections themselves,
their colours and all handlers are unchanged. Each step's checks (`validateQuestionsStep`,
`validateDetailsStep`, `validateLayoutStep`) run on Next; Preview / Download run all three.

## Contact form

The About page has a contact form (`components/ContactSection.jsx`). The visitor fills in the
topic (dropdown), name, **mobile number**, **email** and message (all required), then chooses:

- **Send to Email** – opens their email app with the message already written to your address.
- **Send to WhatsApp** – opens WhatsApp with the message already written to your number.

They only press Send in that app. Nothing is sent through a server, so no account or password is needed.

Setup: open `src/constants/contact.js` and type your own details:

- `OWNER_WHATSAPP` – country code first, digits only, e.g. `"919876543210"`.
- `OWNER_EMAIL` – your email address.
- `OWNER_PHONE_DISPLAY` – the number shown on the About page and in the contact card.
  **It is a random placeholder (`+91 98765 43210`) until you replace it.**

(`VITE_CONTACT_WHATSAPP` / `VITE_CONTACT_EMAIL` in Vercel also work and win if set.)
If a number or email is not set, that button shows a friendly message and the visitor can copy
their message instead.

When a file is read badly, the Home page shows **Report this file format**, which
opens this form with the file details prefilled.

## Text style

`utils/textStyles.js` defines the fonts, presets and per-part styles (title, details,
labels, question, sample headings, sample text, header/footer). The same style is
read by the Word generator, the PDF generator and the preview, and edited in
`components/TextStyleSection.jsx`. It is saved in the browser (`assigncraft-text-style`).

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
