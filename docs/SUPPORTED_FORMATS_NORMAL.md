# AssignCraft – Supported Formats

A simple guide to **what files you can upload**, **how your question file should
look**, and **what you get back**. One worked example is in section 3.

---

## 1. What can I upload?

| File type                              | Works?         | What to know                                               |
| -------------------------------------- | -------------- | ---------------------------------------------------------- |
| **PDF** (normal, text can be selected) | ✅ Yes         | Best result. Tables and bold text are kept.                |
| **PDF** (scanned photo / image)        | ✅ Yes, slower | Read with OCR. Tables become plain lines and bold is lost. |
| **DOCX** (Word)                        | ✅ Yes         | Numbering, tables and bold are kept.                       |
| **TXT** (text file)                    | ✅ Yes         | Any common encoding (Notepad files are fine).              |
| **Pasted text**                        | ✅ Yes         | Paste the questions into the box.                          |
| **DOC** (old Word, 2003)               | ❌ No          | Open it in Word and use _Save As → DOCX_, or save as PDF.  |
| ODT, RTF, images, PowerPoint           | ❌ No          | Convert to PDF or DOCX first.                              |

You can pick **several files at once**. All questions are collected into one list.

> Python tools: the notebook tools also need an **`.ipynb`** file, and
> _Continue Assignment_ needs your finished assignment as **`.docx`**.
> See section 6.

---

## 2. How should my question file look?

The app finds questions by their **numbers**. Any of these styles work:

| Style        | Example                                   |
| ------------ | ----------------------------------------- |
| Plain number | `1.` `2)` `10.Write a program`            |
| Q-label      | `Q1` `Q-2` `Question 3` `Que 4`           |
| Activity     | `Exercise 1` `Experiment 2` `Practical 3` |
| Roman        | `I.` `II)` `IV -`                         |
| Bold number  | `**1.**` (a bold number works the same)   |

**Rules the app follows**

- Numbers must go up: 1, 2, 3 …
- A list **inside** a question (like a menu `1. Add  2. Delete  3. Exit`) stays
  inside that question. It is **not** split into new questions.
- If a number is missing (14 → 16) you get a warning.
- If two questions have the same text, both are kept and you get a warning.
- No numbers at all? The app guesses from bullets or lines starting with
  _Write / Create / Explain …_ (less reliable, so please check the result).

**Sample Input and Expected Output** can be written in any of these ways:

| In the teacher's file                                                 | Works?                                             |
| --------------------------------------------------------------------- | -------------------------------------------------- |
| Two-column table: `Sample Input` &#124; `Expected Output`             | ✅                                                 |
| Same table with `Sample Output`, or `Sample Input / Call`, `/ Action` | ✅                                                 |
| A table that continues on the next page                               | ✅                                                 |
| Headings: `Sample Input:` then `Sample Output:` / `Expected Output:`  | ✅                                                 |
| Lines starting `Input:` and `Output:`                                 | ✅                                                 |
| Other names like `Example`, `Test Case`, `Input Format`               | ⚠️ Kept as part of the question text, not as boxes |

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
- Turn **Sample Input & Expected Output** off in _Document Options_ to print only the statement.
- Questions 2 and 3 get the same layout (question 3 has no sample box).

---

## 4. Bold text

- Bold in the teacher's **PDF or DOCX** is kept and printed bold.
- In a **TXT** file, type `**bold**` yourself.
- Bold inside Sample Input / Output is ignored (they are printed in a typewriter font).
- **Scanned** PDFs lose bold (OCR cannot see it).

---

## 5. What the generator makes

| Output           | Notes                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| **Word (.docx)** | Question table with _Code_ and _Output_ rows. You can add your own answer rows. |
| **PDF**          | Same layout. A long question continues on the next page.                        |
| **Preview**      | Shows the same layout before you download.                                      |

**Details table, header and footer** are three separate things. Each has its own
details and order:

| Part                          | Choices                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| Details table (top of page 1) | On / Off                                                   |
| Header                        | Don't show · First page only · Every page                  |
| Footer                        | Don't show · First page only · Every page (+ page numbers) |

If the same detail is chosen in two places, a yellow note tells you it will be
printed twice.

**Saved details:** name, ID, division and course are remembered **in your own
browser only** and filled in next time. Nothing is uploaded.

**Missing something?** If a detail, the questions, or the header / footer choice is
missing, you see the error and the page **scrolls to the place to fix it**.

---

## 6. Python tools (Jupyter and Continue Assignment)

| Tool                    | You give it                                            | You get                                                              |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| **Create notebook**     | Question file (PDF / DOCX / TXT) + your details        | `.ipynb` with one Markdown cell and one empty code cell per question |
| **Continue notebook**   | Old `.ipynb` + new question file                       | Same notebook with only the **new** questions added                  |
| **Notebook → PDF**      | Finished `.ipynb`                                      | PDF with a details table, coloured code, outputs and images          |
| **Continue Assignment** | Finished assignment as **`.docx`** + new question file | Same Word file with only the new questions added at the end          |

**Notebook → PDF** shows: title and a details table (Name, ID, Course, Semester,
Division, Subject), each question in bold, Sample boxes (optional), code with
Python colours (optional), text outputs, error messages, and PNG / JPEG images.
The footer shows your name, ID and _Page x of y_.

**Continue Assignment** needs your finished Word file to contain labels like
`Q-1`, `Q-12` or `Question 12`, so it can find the last question.

---

## 7. Good to know

- A long line of expected output that wraps in the PDF may be split into two lines.
  Fix it in the question box if needed.
- Pages with two columns, or tables with three columns, can mix up the text.
- Decorative text boxes and unusual layouts may need a manual fix.
- Not recognised as numbering: `(1)`, `a)`, `A.`, non-English digits.
- In PDF output, symbols the PDF fonts cannot draw are replaced
  (for example `₹` becomes `Rs.`). Gujarati / Hindi letters in code or output show as `?`.
- Notebook → PDF shows bold only for the first line of each question.
