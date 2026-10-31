# Supported formats – Python side (Jupyter tools and Continue Assignment)

This file lists what the **Python tools** can read and produce. The Home page has
its own file: [`SUPPORTED_FORMATS_NORMAL.md`](./SUPPORTED_FORMATS_NORMAL.md).

The Python code lives in `src/python/`. The question detection itself is the same
shared code as the normal side, plus the course settings in
`src/python/parserConfig.js`.

---

## 1. Teacher's question file

| Format | Supported |
|---|---|
| PDF (text), PDF (scanned, OCR) | Yes |
| DOCX | Yes |
| TXT | Yes |
| DOC and other formats | No |

Numbering styles, Sample Input / Expected Output tables and bold work exactly as
described in the normal-side file. In addition, the Python course settings:

- ignore section titles that sit between question groups (for example
  `Operators`, `Identifiers and Naming Rules`), and
- ignore the department's page-header lines (`Smt. Chandaben ...`,
  `BCA Semester-V ...`, `Practice Questions`).

Another course can be added with its own settings file of the same shape.

---

## 2. Jupyter Tools page

### Create a new notebook (.ipynb)

Input: a question file (section 1) plus the student details.

Output: a Python notebook with
- a header cell (title, name, ID, subject, course, division, semester),
- one Markdown cell per question: bold numbered statement, bullets / steps, and
  Sample Input / Expected Output as code blocks (can be left out),
- one empty code cell under each question.

Notes:
- Question text is escaped, so names such as `__init__` or `send_message` are not
  turned into bold or italic by Markdown.
- Bold from the teacher's file is kept in the Markdown cells.

### Continue an existing notebook

Input: an old `.ipynb` file and a newer teacher file.

- Questions already in the notebook are detected by comparing text (samples and
  punctuation are ignored) and are not added again.
- Only the new questions are appended, numbering continues.
- The old notebook must have question Markdown cells that start with a number
  (`1.`, `2.`, `<b>3.</b>`), otherwise the last number cannot be found.

Only `.ipynb` files are accepted for notebooks.

---

## 3. Notebook to PDF

Input: a completed `.ipynb` file.

| Part of the notebook | In the PDF |
|---|---|
| Title / student details cell | Heading plus one bordered table (Name, ID, Course, Semester, Division, Subject). A free-text line such as `BCA-SEM-5 DIV-3` is split into Course / Semester / Division. |
| Question Markdown cells | Bold question, bullets, Sample Input / Expected Output boxes (optional) |
| Other Markdown cells | Headings, paragraphs, bullets, fenced code blocks |
| Code cells | Boxed code, indentation kept, optional Python colouring; empty cells are hidden |
| Outputs: stream, execute_result, display_data (text) | Boxed text |
| Outputs: errors | Traceback with colour codes removed |
| Outputs: images (PNG, JPEG) | Scaled to the page |
| Footer | Name and ID on the left, "Page x of y" on the right |

Options on the page:
- **Sample Input & Expected Output** – show or hide the teacher's samples.
- **Colour Python code** – highlight keywords, built-ins, strings, numbers, comments.

Colouring is a light highlighter, not a full Python parser.

Not supported: HTML or LaTeX outputs (only their plain-text form), non-Latin
characters such as Gujarati or Hindi (shown as `?`), notebooks in other formats.

---

## 4. Continue Assignment page (Word)

Input:
1. Your **completed assignment as `.docx`**. It must contain labels such as `Q-1`,
   `Q-12` or `Question 12`, so the last question number can be found.
2. The teacher's latest question file (PDF, DOCX or TXT).

What happens:
- New questions are found by comparing with the questions already in your file.
- Only the new questions are appended at the end of the Word file. The old
  content (tables, code, images, outputs) is not rebuilt.
- New questions use the same layout: question cell with bold, bullets and
  Sample Input / Expected Output, then Code and Output rows.

Not supported: a completed assignment saved as `.doc`, PDF or Google Doc link.

---

## 5. Saved details (autofill)

Name, ID, division, course and semester are saved in this browser only and shared
with the normal side. **Clear saved details** on the Jupyter page removes them.

---

## 6. Known limits

- The same limits as the normal side apply to reading question files.
- A completed Word file with a very different layout may not be recognised.
- Notebook PDFs keep bold only for the question statement line, other Markdown
  bold is printed as normal text.
