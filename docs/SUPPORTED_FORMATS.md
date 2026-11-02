# AssignCraft – Supported Formats

A simple guide to **what files you can upload**, **how your question file should
look**, and **what you get back**. One worked example is in section 3.

---

## 1. What can I upload?

| File type | Works? | What to know |
|---|---|---|
| **PDF** (normal, text can be selected) | ✅ Yes | Best result. Tables and bold text are kept. |
| **PDF** (scanned photo / image) | ✅ Yes, slower | Read with OCR. Tables become plain lines and bold is lost. |
| **DOCX** (Word) | ✅ Yes | Numbering, tables and bold are kept. |
| **TXT** (text file) | ✅ Yes | Any common encoding (Notepad files are fine). |
| **Pasted text** | ✅ Yes | Paste the questions into the box. |
| **DOC** (old Word, 2003) | ❌ No | Open it in Word and use *Save As → DOCX*, or save as PDF. |
| ODT, RTF, images, PowerPoint | ❌ No | Convert to PDF or DOCX first. |

You can pick **several files at once**. All questions are collected into one list.

> Python tools: the notebook tools also need an **`.ipynb`** file, and
> *Continue Assignment* needs your finished assignment as **`.docx`**.
> See section 7.

---

## 2. How should my question file look?

The app finds questions by their **numbers**. Any of these styles work:

| Style | Example |
|---|---|
| Plain number | `1.`   `2)`   `10.Write a program` |
| Q-label | `Q1`   `Q-2`   `Question 3`   `Que 4` |
| Activity | `Exercise 1`   `Experiment 2`   `Practical 3` |
| Roman | `I.`   `II)`   `IV -` |
| Bold number | `**1.**` (a bold number works the same) |
| Brackets | `(1)`   `[2]`   `(3.)` |
| Letters | `a)`   `(b)`   `C.`   `D)` (counting a, b, c ...) |

**It picks the style that fits your file.** The app tries each numbering style
and uses the first one that forms a real run (1, 2, 3 ... or a, b, c ...). So a
file that uses `(1)`, `[1]` or `a)` for its questions works without any setting.
Letters and brackets inside a question (`a) read  b) print`) stay inside it.

**Rules the app follows**

- Numbers must go up: 1, 2, 3 …
- A list **inside** a question (like a menu `1. Add  2. Delete  3. Exit`) stays
  inside that question. It is **not** split into new questions.
- If a number is missing (14 → 16) you get a warning.
- If two questions have the same text, both are kept and you get a warning.
- No numbers at all? The app guesses from bullets or lines starting with
  *Write / Create / Explain …* (less reliable, so please check the result).

**Sample Input and Expected Output** can be written in any of these ways:

| In the teacher's file | Works? |
|---|---|
| Two-column table: `Sample Input` &#124; `Expected Output` | ✅ |
| Same table with `Sample Output`, or `Sample Input / Call`, `/ Action` | ✅ |
| A table that continues on the next page | ✅ |
| Headings: `Sample Input:` then `Sample Output:` / `Expected Output:` | ✅ |
| Lines starting `Input:` and `Output:` | ✅ |
| `Example Input` / `Example Output`, `Test Input` / `Test Output`, `Expected Result` | ✅ |
| Table headed only `Input` &#124; `Output` (or `Example`, `Test`, `Result` words) | ✅ |
| `Example:` or `Test Case 1:` on a line of its own, then the lines | ✅ Kept as one block |
| Other names like `Input Format` | ⚠️ Kept as part of the question text, not as boxes |

---

## 3. Example

### The teacher's file (`questions.txt`)

```text
Assignment-1
Instructions: Write and execute the following programs.

1. **Accept a string** from the user and convert it into Uppercase and Lowercase.
Sample Input:
Enter string: python
Expected Output:
Uppercase: PYTHON
Lowercase: python

2. Write a menu-driven program with these options:
1. Add contact
2. Delete contact
3. Exit
Sample Input:
Choice: 1
Sample Output:
Contact added.

3) Check whether a number is Prime.
```

### What the app detects (3 questions)

The title and instructions are ignored. The menu stays **inside** question 2.
Each question is shown in the question box as editable text:

```text
Question 1
**Accept a string** from the user and convert it into Uppercase and Lowercase.

Sample Input:
Enter string: python

Expected Output:
Uppercase: PYTHON
Lowercase: python
```

```text
Question 2
Write a menu-driven program with these options:
1. Add contact
2. Delete contact
3. Exit

Sample Input:
Choice: 1

Sample Output:
Contact added.
```

```text
Question 3
Check whether a number is Prime.
```

`**text**` means bold. You can add or remove the `**` yourself in the question box.

### What you get (Word / PDF)

```text
 Question 1
 +------+--------------------------------------------------------+
 | Q-1  | Accept a string from the user and convert it into      |
 |      | Uppercase and Lowercase.      ("Accept a string" is    |
 |      |                                printed in bold)        |
 |      | Sample Input:                                          |
 |      |   Enter string: python                                 |
 |      | Expected Output:                                       |
 |      |   Uppercase: PYTHON                                    |
 |      |   Lowercase: python                                    |
 +------+--------------------------------------------------------+
 | Code |                                                        |
 +------+--------------------------------------------------------+
 | Output |                                                      |
 +------+--------------------------------------------------------+
```

- The statement is in the normal font, samples are in a typewriter font.
- Turn **Sample Input & Expected Output** off in *Document Options* to print only the statement.
- Questions 2 and 3 get the same layout (question 3 has no sample box).

---

## 4. Bold text

- Bold in the teacher's **PDF or DOCX** is kept and printed bold.
- In a **TXT** file, type `**bold**` yourself.
- Bold inside Sample Input / Output is ignored (they are printed in a typewriter font).
- **Scanned** PDFs lose bold (OCR cannot see it).

---

## 5. What the generator makes

The Home page is a four-step wizard, one short screen at a time:

| Step | What you do |
|---|---|
| 1. Add questions | Upload or paste, then review and edit the questions |
| 2. Your details | Name, ID, division, course, subject (filled in from last time) |
| 3. Layout and style | Details table, header, footer, Code / Output rows, text style |
| 4. Preview and download | A recap with Edit links, then Preview, Word, PDF or Print |

**Next** checks that step (for example, it jumps to a missing field), **Back** keeps
everything you typed, and you can click a step at the top to go back. The browser's
Back and Forward buttons also move between steps. Reloading the page starts again at step 1.


| Output | Notes |
|---|---|
| **Word (.docx)** | Question table with *Code* and *Output* rows. You can add your own answer rows. |
| **PDF** | Same layout. A long question continues on the next page. |
| **Preview** | Shows the same layout before you download. |

**Details table, header and footer** are three separate things. Each has its own
details and order:

| Part | Choices |
|---|---|
| Details table (top of page 1) | On / Off |
| Header | Don't show · First page only · Every page |
| Footer | Don't show · First page only · Every page (+ page numbers) |

If the same detail is chosen in two places, a yellow note tells you it will be
printed twice.

**Saved details:** name, ID, division and course are remembered **in your own
browser only** and filled in next time. Nothing is uploaded.

**Missing something?** If a detail, the questions, or the header / footer choice is
missing, you see the error and the page **scrolls to the place to fix it**.

---

## 6. Text style (font, size, colour)

Open the **Text style** card on the Home page. It works like Word's font controls
and is applied to the Word file, the PDF and the preview. Your choice is
remembered on this device.

| You can change | Options |
|---|---|
| **Ready-made style** | Classic (Times New Roman), Modern (Calibri, blue headings), Compact (Arial, smaller) |
| **Font** | Times New Roman, Georgia, Cambria, Arial, Calibri, Verdana, Tahoma, Trebuchet MS, Courier New, Consolas, Lucida Console |
| **Size** | 8 to 32 pt (half-points allowed, e.g. 10.5) |
| **Style** | Bold, Italic, Underline |
| **Colour** | Colour picker, 9 quick colours, or any hex code |
| **Alignment** | Left, Centre, Right, Justify (title and question text) |
| **Line spacing** | Tight, Normal, Relaxed |

You set these **separately for each part**:

| Part | What it controls |
|---|---|
| Title & subject | `ASSIGNMENT 1` and the subject line |
| Details table | Name, ID, division ... in the table |
| Labels | `Question 1`, `Q-1`, `Code`, `Output`, your own answer rows |
| Question text | The question statement |
| Sample headings | `Sample Input:` / `Expected Output:` |
| Sample text | The sample lines themselves |
| Header & footer | Page header, footer and page number |

A **live preview** inside the card shows every part as you change it.
**Reset this part** and **Reset to default** undo changes.

Things to know:

- **Word** uses the exact font name. If the person opening the file does not have
  that font, Word replaces it with a similar one. Arial, Times New Roman, Calibri
  and Courier New are on almost every computer.
- **PDF** can only draw Times, Helvetica (Arial-like) and Courier. Each font is
  matched to the closest of these; the card shows which one will be used.
- Text from the teacher's file that was bold stays bold on top of your style.
- Sizes are real points in both Word and PDF, so the same size looks the same.

---

## 7. Python tools (Jupyter and Continue Assignment)

| Tool | You give it | You get |
|---|---|---|
| **Create notebook** | Question file (PDF / DOCX / TXT) + your details | `.ipynb` with one Markdown cell and one empty code cell per question |
| **Continue notebook** | Old `.ipynb` + new question file | Same notebook with only the **new** questions added |
| **Notebook → PDF** | Finished `.ipynb` | PDF with a details table, coloured code, outputs and images |
| **Continue Assignment** | Finished assignment as **`.docx`** + new question file | Same Word file with only the new questions added at the end |

**Notebook → PDF** shows: title and a details table (Name, ID, Course, Semester,
Division, Subject), each question in bold, Sample boxes (optional), code with
Python colours (optional), text outputs, error messages, and PNG / JPEG images.
The footer shows your name, ID and *Page x of y*.

**Continue Assignment** needs your finished Word file to contain labels like
`Q-1`, `Q-12` or `Question 12`, so it can find the last question.

---

## 8. A new or unusual format? Tell me

No program can learn a brand-new layout by itself, so the app does two things:

1. **It adapts where it can.** It chooses the numbering style that fits each
   file and recognises many names for the sample sections (section 2).
2. **It lets you report the rest in one click.** When a file gives no questions,
   a low-confidence result or warnings, a **Report this file format** button
   appears. It opens the contact form with the file type, how many questions were
   found, and the warnings already filled in. You can also tick a box to send the
   first lines of the file so the layout can be seen (off by default, because the
   file may contain private information). File names are never sent.

Support for that format is then added in the next update.

**Contact form** (About page, or *Report a problem* in the footer): pick a topic from the
dropdown and fill in name, mobile number, email (all required) and the message. Then choose
**Send to Email** or **Send to WhatsApp**. Your email app or WhatsApp opens with the message
already written, and you only press Send. If it does not open, you can copy the message.

For the site owner: type your WhatsApp number, email and display phone number in
`src/constants/contact.js`. The phone number on the About page is a placeholder until you do.
See the README.

---

## 9. Good to know

- A long line of expected output that wraps in the PDF may be split into two lines.
  Fix it in the question box if needed.
- Pages with two columns, or tables with three columns, can mix up the text.
- Decorative text boxes and unusual layouts may need a manual fix.
- Not recognised as numbering: `(1)`, `a)`, `A.`, non-English digits.
- In PDF output, symbols the PDF fonts cannot draw are replaced
  (for example `₹` becomes `Rs.`). Gujarati / Hindi letters in code or output show as `?`.
- Notebook → PDF shows bold only for the first line of each question.
