# GradeLens user guide

This is the living operating guide for instructors, graders, and teaching assistants using GradeLens. Update this file whenever a shipped feature changes, a field is renamed, or a new workflow is added. Update [`FEATURES.md`](../FEATURES.md) at the same time so the feature inventory and instructions stay aligned.

GradeLens is an instructor-support tool. AI-generated scores are drafts: an instructor or authorized grader should review results before using them as official grades.

## 1. Roles and access

GradeLens currently has two course roles:

- **Instructor** — the course owner. Instructors can create and delete the course, manage course settings, invite or remove graders, manage the roster, create assignments, grade work, override scores, and export results.
- **TA** — the grader role. TAs can access shared course content and grading workflows but cannot manage instructor-only settings or staff access.

There is no separate role named “grader”; invite graders as TAs.

### Create the first account

On a new deployment, the first account can register without an invitation or invite code:

1. Open the GradeLens deployment URL.
2. Select **Create one** on the sign-in page.
3. Enter your name, email, and a password of at least eight characters.
4. Leave **Invite code** blank.
5. Select **Create account**.

If outbound email is configured, open the verification message before signing in. If email is not configured, the account is verified automatically, but email verification and password-reset messages are unavailable.

The first account is also the fallback feedback administrator unless `FEEDBACK_ADMIN_EMAIL` is configured.

### Invite a grader or TA by email — recommended

This is the safest normal onboarding method. A shared invite code is not required.

1. Sign in as the course instructor.
2. Open the course and select **Staff**.
3. Enter the grader's exact email address under **TA email**.
4. Select **Add TA**.

If that email already has a GradeLens account, the user is added immediately. Otherwise the Staff page shows **Invite pending**. The grader then:

1. Opens the same GradeLens deployment URL.
2. Selects **Create one**.
3. Registers with the exact email address the instructor invited.
4. Leaves **Invite code** blank.

The pending invitation authorizes signup and adds the new account to the course. This authorization works even when email delivery is not configured; in that case, send the deployment URL to the grader yourself.

Only instructors can add or remove TAs. An instructor can remove either an active TA or a pending invitation from **Staff**.

### Optional server-wide invite code

`SIGNUP_INVITE` is an optional deployment environment variable. It is one shared code for the entire GradeLens deployment; GradeLens does not generate individual codes automatically.

Use it only when administrators need to let approved instructors create accounts before they have a course invitation:

1. Generate a long random value outside GradeLens.
2. Store it as `SIGNUP_INVITE` in the hosting provider's secret environment variables.
3. Privately share it with the intended instructor.
4. Rotate or remove it after onboarding is complete.

Do not put the code in GitHub, documentation, screenshots, chat, or a public URL. Anyone who knows it can create an account. Email-specific Staff invitations are preferable for graders.

Keep `ALLOW_SIGNUP` unset or `false` on a public deployment. Setting `ALLOW_SIGNUP=true` permits anyone with the URL to register.

## 2. Account settings

Open **Account** from the application navigation.

### Grading provider key

Each instructor or TA can save a personal Groq, OpenAI, or Anthropic API key:

1. Choose the provider.
2. Paste the API key.
3. Select **Save API key**.

GradeLens encrypts the saved key using the server's `LLM_KEY_SECRET` and displays only a masked hint. Never change `LLM_KEY_SECRET` after users have stored keys; changing it makes existing encrypted keys unreadable.

A shared server key can be configured as a fallback, but personal keys keep provider usage attributable to the individual grader.

### Canvas connection

Canvas integration is optional and configured per GradeLens account:

1. In Canvas, create an access token under **Account → Settings → Approved Integrations**.
2. In GradeLens, open **Account → Canvas connection**.
3. Enter the institution's HTTPS Canvas URL and token.
4. Select **Verify and save**.

Only a masked token hint is shown afterward. Remove the connection when it is no longer needed.

### Password recovery

Use **Forgot password?** on the sign-in page. Reset email requires `RESEND_API_KEY`, `EMAIL_FROM`, and the correct `PUBLIC_APP_URL` on the deployment.

## 3. Courses

### Create a course

1. Open the Courses dashboard.
2. Select **Add course**.
3. Enter a course name.
4. Optionally enter a course code and description.
5. Choose the semester and course color.
6. Save the course.

The creator becomes the course instructor. Course navigation includes the overview, assignments, grades, roster, analytics, calendar, staff, and settings areas.

### Course settings

Only the instructor can change instructor-only settings or delete the course. Deleting a course also removes its assignments, submissions, database records, and stored upload objects. Treat deletion as permanent.

## 4. Student roster

Open **Roster** from the course navigation.

### Add students manually

Add the student's name and, when available:

- institutional student ID;
- SIS login ID;
- email address;
- Canvas user ID.

Stable identifiers improve automatic submission matching and export accuracy.

### Import a roster CSV

GradeLens accepts generic roster CSV files and Canvas gradebook exports. Common generic columns include:

```text
Last Name,First Name,Student ID,Email
Chen,Alex,123456,alex@example.edu
```

Canvas imports preserve Canvas ID and SIS Login ID as separate values. Re-importing the same roster updates matching students instead of intentionally creating duplicates.

### Sync a Canvas roster

After saving a personal Canvas connection:

1. Open **Roster → Canvas roster sync**.
2. Enter the Canvas course ID from its URL.
3. Select **Sync Canvas roster**.

Canvas-managed enrollments can be added, updated, or marked inactive. Manual and CSV students are not marked inactive by Canvas sync.

## 5. Assignments

### Create an assignment

1. Open a course and select **New assignment**.
2. Enter the assignment title and optional description or due date.
3. Add the questions by pasting text or attaching a PDF, TXT, or Markdown file.
4. Add official solutions the same way.
5. Select **Create assignment**.

Files must be no larger than 10 MB. PDFs must contain selectable text. Image-only scans and handwriting are not supported yet and may produce an extraction warning.

Use matching question labels in questions and solutions, such as `Q1(a)`, `Q1(b)`, and `Q2`.

### Generate and approve a rubric

1. Open the assignment overview.
2. Select **Generate rubric**.
3. Review every generated criterion, point value, and full-credit description.
4. Add, edit, or remove criteria as needed.
5. Confirm that the total equals the assignment's intended points.
6. Select **Save rubric**.

Grading is unavailable until the rubric is saved. Changing and saving a rubric after grading clears existing grades so submissions can be graded against the updated criteria.

## 6. Submissions

Open **Submissions** within an assignment.

### Upload one submission

1. Choose a student from the roster, or leave matching automatic.
2. Select a PDF, TXT, or Markdown file.
3. Upload the submission.

### Bulk upload and automatic matching

For reliable matching, include a stable student identifier in each filename. The recommended format is:

```text
SIS_LOGIN_ID__submission.pdf
```

Example:

```text
alice01__assignment-1.pdf
```

GradeLens prioritizes SIS Login ID and also supports exact Canvas ID, student ID, email, manifest, and unique-name matching. Ambiguous or unmatched files remain in **Needs match** instead of being assigned silently.

### Submission manifest

For arbitrary filenames, attach a CSV manifest such as:

```text
filename,sis_login_id
paper-001.pdf,alice01
paper-002.pdf,bob02
```

Manifest mappings take priority over filename inference.

### Import submissions from Canvas

With Canvas connected and its roster synced:

1. Copy the Canvas assignment ID from the assignment URL.
2. Open **Import from Canvas** in GradeLens.
3. Enter the Canvas assignment ID and start the import.

Supported attachments are mapped using the exact Canvas user identity. Importing a newer attempt replaces stored work and clears its previous grade for explicit regrading.

## 7. Grading

### Grade one submission

1. Open the submission.
2. Select **Grade submission** or **Regrade**.
3. Wait for the configured model provider.
4. Review the total score, each criterion score, explanation, and quoted evidence.

Never treat quoted evidence as verified automatically. Confirm it exists in the submitted text and that the deduction follows the approved rubric.

### Grade the remaining stack

Select **Grade ungraded** to process submissions without a saved grade. Unresolved submissions are skipped until matched to a student.

Long grading runs can be interrupted by free-host cold starts or restarts. Confirm completion before relying on the class totals.

### Override a score

An instructor or TA can override a criterion score. Enter the corrected score and a required note explaining the change. Review the total after every override.

## 8. Review, analytics, and exports

### Class review

Open **Review** to compare deductions across the class. Look for inconsistent treatment of similar answers before releasing results.

### Gradebook and analytics

Course pages provide roster profiles, gradebook views, score distribution, calendar, and analytics. Treat these as instructor review tools rather than a student-facing release system.

### Export grades

GradeLens supports its roster CSV plus Canvas- and Gradescope-oriented exports. Before importing an export elsewhere:

1. Confirm the assignment points and rubric total.
2. Resolve unmatched submissions.
3. Review overrides and similar deductions.
4. Check several student identifiers and scores manually.
5. Keep a copy of the reviewed export.

GradeLens does not currently release marked work directly to students.

## 9. Feedback and help

- **Help** contains an in-app field guide and is available when signed in or signed out.
- **Feedback** lets signed-in users send a private note to the site administrator.
- **Inbox** is visible only to `FEEDBACK_ADMIN_EMAIL`, or to the first account when that variable is not configured.

Do not include API keys, passwords, access tokens, or unnecessary student information in feedback messages.

## 10. Recommended first test

Use fictional data only:

1. Create the first instructor account.
2. Save a personal model-provider key under **Account**.
3. Create a test course.
4. Add three fictional roster entries with SIS logins `alice01`, `bob02`, and `carol03`.
5. Create an assignment with text-based question and solution PDFs.
6. Generate, inspect, and save its rubric.
7. Upload:
   - `alice01__submission.pdf` with fully correct work;
   - `bob02__submission.pdf` with partial work;
   - `carol03__submission.pdf` with incorrect or incomplete work.
8. Confirm all three files match the intended roster entries.
9. Grade the submissions and compare the explanations with the official solutions.
10. Override one score with a note and confirm the total updates.
11. Export the grades and inspect the CSV.
12. Invite a second fictional/test email as a TA and verify course access in a separate browser session.

## 11. Known limits and safe-use rules

- Maximum uploaded file size is 10 MB.
- Supported grading inputs are text-based PDF, TXT, and Markdown.
- Scanned and handwritten work is not reliably supported.
- AI grading can be wrong, inconsistent, or influenced by text inside submissions.
- Keep a human reviewer in the loop before grades become official.
- Use fake or institutionally approved data during the pilot.
- Do not upload student data until institutional privacy, retention, and vendor requirements are satisfied.
- Render Free and Neon Free are pilot resources, not a promise of classroom-grade availability.

## 12. Troubleshooting

### Signup says accounts are invite-only

Ask the instructor to add the exact signup email under **Course → Staff**, or use an administrator-provided `SIGNUP_INVITE` code. Do not enable open signup merely to bypass an email typo.

### No verification or reset email arrives

The deployment must have valid `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL` values. Check spam and confirm the email address before resending.

### Grading says no provider key is configured

Open **Account**, select a supported provider, and save a valid personal API key. Alternatively, the deployment administrator can configure a shared fallback key.

### A PDF has no usable text

Open the PDF and confirm its text can be selected and copied. Export the source document as a text-based PDF or paste the text into GradeLens. OCR for scans and handwriting is not yet implemented.

### A submission matched the wrong student

Use exact SIS-login filenames or a manifest, review the roster identifiers, and resolve ambiguous uploads before grading.

### The first request is slow

Render Free can sleep while idle. The first request after sleep may take longer while the web service and Neon database resume.

### Health check fails

Open `/api/health`. A healthy deployment reports the database as `ok` and storage as `s3`. Deployment administrators should verify the Neon database and AWS-compatible storage environment variables if either is unavailable.

## Documentation maintenance checklist

Whenever application behavior changes:

1. Update this user guide with the new user-visible workflow.
2. Update [`FEATURES.md`](../FEATURES.md) to reflect shipped and planned behavior.
3. Update [`docs/TESTING.md`](TESTING.md) when the acceptance test changes.
4. Update [`README.md`](../README.md) when setup, deployment, or required environment variables change.
5. Add or update automated tests for the changed behavior.
