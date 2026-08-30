# Testing and using GradeLens

This guide walks through every shipped feature the way a TA or instructor would use it. Sample files live in [`sample-work/`](sample-work/).

You need a running local server and at least one LLM key. See the project [README](../README.md) for setup.

## Before you start

1. `npm install`, copy `.env.example` to `.env`, and set `GROQ_API_KEY` (or Anthropic / OpenAI).
2. `npx prisma migrate deploy` then `npm run dev`.
3. Open [http://localhost:3000](http://localhost:3000). You should be redirected to **Sign in**.

Optional: `npm test` runs unit tests (roster matching, CSV export, point parsing, overrides). Those do not replace clicking through the app.

**Limits to keep in mind**

- Files must be PDF or `.txt` / `.md`, max 10 MB.
- Only selectable text is graded. Image scans of handwriting are not supported yet.
- Rubric generation and grading call the LLM and can take 10–60 seconds.

---

## 1. Accounts and sign-in

### Sign up

1. Open `/signup`.
2. Enter a name, a valid email, and a password of at least 8 characters.
3. You land on **Assignments**. The sidebar shows your name and a **Log out** control.

**Checks**

- Short password or invalid email shows an error and you stay on signup.
- Duplicate email: “An account with that email already exists.”
- Logged-in visits to `/login` or `/signup` redirect home.
- Logged-out visits to `/` or `/courses` redirect to login.
- On a production deploy, a second uninvited signup is rejected unless `SIGNUP_INVITE` or `ALLOW_SIGNUP=true` is set. Invited TA emails still work.

### Log in and log out

1. Log out, then sign in at `/login` with the same email and password.
2. Confirm you return to the assignment list.

---

## 2. Courses, roster, and TAs

### Create a course

1. Sidebar → **New course** (or **Courses** → **New course**).
2. Name: `Computer Organization`. Code: `CSE230` (code is optional).
3. Submit. You should be on the course page as **Owner**.

The course appears in the sidebar and on `/courses`.

### Roster

On the course page, add students. Email is optional but is used in Canvas / Gradescope CSV export.

| Name        | Email (optional)     |
|-------------|----------------------|
| Alex Chen   | alex@school.edu      |
| Jordan Lee  | jordan@school.edu    |
| Sam Patel   | sam@school.edu       |

**Checks**

- Names show in the roster list.
- **Remove** drops a student from the roster (existing submissions keep their display name).

### Shared TA access

You need a second browser (or a private window) for this.

1. As the owner, under **Teaching assistants**, invite `ta@school.edu`.
2. The row should say **Invite pending**.
3. In the other browser, sign up as that email (name + password ≥ 8 characters).
4. The TA should see `CSE230` in the sidebar and can open the same assignments.
5. On the course page the TA sees “You are a TA” and **cannot** add or remove TAs.
6. As owner, you can **Remove** a TA or a pending invite.

If the TA already has an account before you invite them, inviting that email adds them immediately (“TA added to the course”) instead of pending.

---

## 3. Create an assignment

From the course page, **New assignment**, or sidebar **New assignment** (pick the course).

1. Title: `Assignment 1`.
2. Course: `CSE230`.
3. Questions: paste or attach [`sample-work/questions.txt`](sample-work/questions.txt).
4. Official solutions: paste or attach [`sample-work/solutions.txt`](sample-work/solutions.txt).
5. **Create assignment**.

You should see the overview: questions and solutions side by side, and an empty rubric.

**Other ways to test**

- Paste text instead of files.
- Attach a text-based PDF of the same content.
- Leave questions or solutions empty → create should fail with a request to add them.
- A scan PDF with no selectable text should fail (or warn) instead of creating a blank assignment.

Sidebar: with the assignment open you get **Overview**, **Submissions**, and **Review**. The same three tabs appear as **Assignment / Submissions / Review** on the page.

---

## 4. Rubric

On the assignment overview:

1. Click **Generate rubric**. Wait for the model.
2. You should get one criterion per stated part, using the point values on the questions:

   - Q1 (a) — 0.5
   - Q1 (b) — 1.5
   - Q2 (a) — 0.5
   - Q2 (b) — 0.5
   - Total **3 pts** (not rounded up to 10 or 100)

3. Edit a label or full-credit description if it looks off. You can **Add criterion** or **Remove**.
4. **Save rubric**. Status on the home list should become **Ready**.

Until you save, **Go to submissions** stays unavailable and grading is blocked.

**After you already have grades:** saving the rubric again **clears existing grades**. The notice tells you to grade submissions again. That is expected.

---

## 5. Submissions

Open **Submissions**.

### Upload and roster matching

Leave **Student on roster** as “Match from filename” and upload all three files at once:

- [`sample-work/alex-chen.txt`](sample-work/alex-chen.txt)
- [`sample-work/jordan-lee.txt`](sample-work/jordan-lee.txt)
- [`sample-work/sam-patel.txt`](sample-work/sam-patel.txt)

Filenames like `alex-chen.txt` or `Alex_Chen.pdf` match roster names (hyphens, underscores, and extension are ignored).

**Checks**

- List shows **Alex Chen**, **Jordan Lee**, **Sam Patel** (roster names, not raw filenames).
- Status is **Uploaded** and score is `—`.
- Uploading a single file with the roster dropdown set attaches that student even if the filename is different.
- Optional **Student name** field overrides the label when the file does not match.

### Scan / empty PDF

Upload a PDF that is only a photograph of a page (no selectable text).

**Checks**

- Banner: files have no selectable text and cannot be graded.
- Row status **No text**.
- **Grade ungraded** stays disabled for those files.
- Opening the paper shows the scan help text. **Grade this submission** is disabled.

Replace with a `.txt` or a text-based PDF when you want that student graded.

---

## 6. Grading

You need a saved rubric and extractable text.

### One paper

1. Open **Alex Chen**.
2. Confirm extracted student work is visible.
3. **Grade this submission**. Wait for the model.
4. Expect a total (for example `3 / 3`), a short summary, and a card per criterion:

   - Points awarded vs max
   - **Full credit** or a deduction like `−0.5`
   - An explanation for the deduction
   - A quoted snippet from the student work when the model found evidence

Alex’s sample is a complete correct write-up, so most criteria should be full credit. Jordan misses the CPI change on Q1(b) and the frequency on Q2(b). Sam is mostly wrong on Q1.

### Whole stack

On **Submissions**, click **Grade ungraded**. It scores every remaining paper that has text (not scans, not already graded).

**Checks**

- Home page progress: `3 of 3 graded` (if you uploaded three text files).
- Failed grading (bad or missing API key) shows **Failed** and a message to check `.env` and retry.
- Rate-limit errors ask you to wait and try again.

### Grade again after rubric edits

1. On overview, change a criterion (points or full-credit text) and **Save rubric**.
2. Grades are cleared. Submissions page may note that ungraded papers are ready.
3. Open one paper → **Grade again**, or **Grade ungraded** for the stack.

---

## 7. Instructor override

On a graded paper, each criterion has **Override points** and **Override note**.

1. Change Jordan’s Q1(b) score (for example from a model deduction to `1.0`).
2. Enter a note of at least 3 characters, e.g. `Partial credit for the 12% time target.`
3. **Save override**.

**Checks**

- Total score updates.
- Header can show **Override**.
- “Model had X. Instructor override is in effect.”
- Changing the score with no note (or a 1–2 character note) is rejected.
- Points outside `0` … max for that criterion are rejected.
- Setting the score back to the model value clears the override note.

---

## 8. Class-wide review

Open **Review** after at least two papers are graded.

**Checks**

- With fewer than two graded papers: “Need more graded papers.”
- **Score distribution** buckets: Under 50%, 50–70%, 70–90%, 90–100%. Counts should add up to the number of graded submissions.
- Deduction clusters group similar reasons. **Same mark** means those students received the same points for that mistake. A range like `0–0.5 pts` with a warning means similar reasons got different scores — open those papers and override if needed.
- Full-credit papers do not appear in deduction clusters.
- Student names in a cluster link to that submission.

The sample set is small; you may see one cluster around Q1(b) (Jordan and Sam) and another around Q2.

---

## 9. Export

From overview, submissions, or review, download:

| Button           | File name pattern              | Contents |
|------------------|--------------------------------|----------|
| **GradeLens CSV**    | `{title}.csv`                  | Student, file, status, awarded, possible, one column per criterion |
| **Canvas CSV**       | `{title}-canvas.csv`           | Canvas-style header + Points Possible row; score in a column named `{Assignment} ({possible})`; email in SIS Login ID when the roster has email |
| **Gradescope CSV**   | `{title}-gradescope.csv`       | First / last name split, email, total score, status |

Open each file in a spreadsheet.

**Checks**

- Roster names, not filenames, in the Student column when matching worked.
- Per-criterion columns exist only on the GradeLens CSV.
- Ungraded rows have empty scores.
- Overrides are reflected in the exported totals (and GradeLens per-criterion cells).

---

## 10. Navigation and cleanup

**Checks**

- Sidebar: Assignments, Courses, New course, New assignment, then each course and its assignments.
- Nested **Overview / Submissions / Review** only when that assignment is selected.
- Home list: title, course, rubric ready vs needs rubric, `n of m graded`, point total.
- **Delete** on the assignment overview asks for confirmation, then returns home. The assignment is gone from the sidebar.

TAs see the same grading UI. Only the course owner manages TA invites.

---

## Suggested happy-path script (about 15 minutes)

Use this if you want one pass that hits almost every feature:

1. Sign up → new course `CSE230` → add Alex, Jordan, Sam (with emails).
2. New assignment with the sample questions and solutions.
3. Generate rubric → confirm 3-point split → save.
4. Upload the three sample `.txt` files together → names match the roster.
5. Grade ungraded → open each paper and read one deduction + quote.
6. Override one score with a note → total updates.
7. Review: distribution counts and at least one deduction cluster.
8. Download all three CSVs.
9. (Optional second browser) Invite a TA and confirm they can open the assignment.
10. Log out and log back in.

---

## Automated tests

From the repo root:

```bash
npm test
```

These cover parsing, CSV shapes, roster filename matching, override rules, and related helpers. They do not call the LLM or the browser.

---

## Known gaps (do not treat as bugs)

See [FEATURES.md](../FEATURES.md) **Later** and **Ideas**. In particular:

- Photo / scan / handwriting OCR is not implemented. Scan PDFs should warn, not grade.
- There is no student-facing release or regrade-request UI.
- Production hosting and cloud file storage are not set up; this is a local app.
