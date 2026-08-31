# GradeLens features

Living list of what is built and what should come next. Update this file whenever a feature ships or a strong idea appears.

## Shipped

- Create an assignment with a title inside a course
- Upload or paste assignment questions (PDF or text)
- Upload or paste official solutions (PDF or text)
- Extract text from PDFs and warn when a file has no extractable text
- Generate a rubric from the official solutions
- Edit rubric criteria, point values, and full-credit descriptions
- Upload student submissions as PDF or text
- Grade one submission or all ungraded submissions
- Show total score, per-criterion marks, and an explanation for every deduction
- Quote evidence from the student work next to each mark
- Sidebar navigation across courses, assignments, overview, and submissions
- Rubric generation uses point values stated on the questions
- Instructor override of any criterion score, with a required note
- Re-run grading on a single submission after rubric edits
- Export the assignment roster as CSV (student, score, per-criterion)
- Stronger empty and error states when PDFs are scans or the model is unavailable
- Instructor accounts (email and password)
- Courses as first-class objects, with a roster of student names
- Shared TA access on the same course and assignments
- Submission names match the course roster when filenames look like student names
- Class-wide review of similar deductions and a score distribution
- Export for Canvas and Gradescope in addition to the GradeLens roster CSV
- Courses dashboard as the post-login home, with a course workspace sidebar
- Course overview, gradebook, roster profiles, calendar, and analytics
- Login branding, remember me, email verification, and password reset by email
- Production hosting with persistent SQLite and uploads, plus invite-only signup on a public URL
- Personal Groq, OpenAI, or Anthropic API keys in Account settings (encrypted at rest; server .env is a fallback)

## Later

- Photo and scan upload with handwriting OCR

## Ideas

Additions that would make a real autograder useful in a course:

- **Rubric versioning** — keep the rubric that produced each grade when criteria change mid-stack
- **Gold-submission calibration** — grade a few known papers first and lock the style before the rest of the class
- **Regrade requests** — student-facing note + instructor accept/reject
- **Similarity flags** — warn when two submissions share unusual phrasing (not a plagiarism verdict)
- **Partial-credit ladders** — each criterion lists 0 / half / full with example answers
- **Question grouping** — nest criteria under Q1, Q2 so a 50-point exam stays readable
- **Blind grading mode** — hide student labels until marks are saved
- **Comment bank** — reuse frequent deduction notes across the stack
- **Late / completeness checks** — flag missing pages or unanswered questions before scoring
- **Math-aware grading** — accept equivalent algebraic forms, not just string match
- **Code assignments** — compile/run hidden tests, then explain failing cases in prose
- **Audit trail** — who changed a score and when
- **Announcement of cutoffs** — preview letter-grade distribution before release
- **Release to students** — share the marked booklet without the official solution
