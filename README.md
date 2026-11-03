# GradeLens

**AI-assisted grading for instructors and teaching assistants, with editable rubrics, criterion-level explanations, and a required human review step.**

[Live demo](https://gradelens-j97n.onrender.com/) · [User guide](docs/USER_GUIDE.md) · [Features and roadmap](FEATURES.md) · [Testing guide](docs/TESTING.md)

GradeLens turns an assignment, its official solution, and student submissions into a reviewable grading workflow. Instructors create a course, add a roster, generate and approve a rubric, then grade text-based PDFs or text files using Groq, OpenAI, or Anthropic. Every result includes criterion-level points, a rationale, and supporting evidence that a human grader can inspect or override.

> GradeLens is an instructor-support tool, not an autonomous grade authority. AI-generated scores are drafts and should be reviewed before they are exported or treated as official.

## Why GradeLens

Typical LLM grading demos stop at a single score. GradeLens is built around the work instructors actually need:

- Keep courses, rosters, assignments, submissions, and grades organized.
- Generate a rubric from official solutions, then edit it before grading.
- Explain every deduction at the rubric-criterion level.
- Match uploaded files to students using SIS IDs, Canvas IDs, email, manifests, or unique names.
- Compare deductions across a class before exporting results.
- Override model scores while preserving the original score and an instructor note.
- Keep uploaded files and application data in persistent cloud services rather than an ephemeral web-server disk.

## Core workflow

1. Create an instructor account and save a personal model-provider API key.
2. Create a course and add students manually, from CSV, or through Canvas roster sync.
3. Create an assignment with its questions and official solutions.
4. Generate, inspect, edit, and save the rubric.
5. Import Canvas submissions or upload PDF, TXT, or Markdown files.
6. Resolve any ambiguous student matches.
7. Grade one submission or process the remaining stack in bounded batches.
8. Review criterion-level deductions and override mistakes when necessary.
9. Export GradeLens, Canvas, or Gradescope CSV files.

## Features

### Courses and access

- Instructor and TA accounts with course-scoped permissions
- Invite-by-email TA onboarding and optional deployment-wide signup code
- Email verification and password reset when Resend is configured
- Course dashboard, roster profiles, gradebook, calendar, and analytics

### Assignments and rubrics

- Questions and official solutions from pasted text or text-based PDFs
- AI-generated rubrics that preserve point values stated in the assignment
- Editable criteria, point values, and full-credit descriptions
- Rubric changes deliberately clear old results so papers can be regraded consistently

### Submission handling

- PDF, TXT, and Markdown uploads up to 10 MB
- Generic CSV and Canvas roster imports
- Canvas assignment submission import by exact Canvas identity
- Automatic matching by SIS login, Canvas ID, student ID, email, manifest, or unique roster-name prefix
- Duplicate, ambiguous, unmatched, and non-extractable file warnings

### Grading and review

- Groq, OpenAI, and Anthropic support using encrypted per-user keys
- Criterion-level scores, deduction reasons, and evidence quotes
- Math-aware instructions that accept equivalent formulas and account for flattened PDF exponents
- Bounded concurrent grading batches to reduce hosting request-timeout risk
- Instructor overrides with required notes and preserved model scores
- Class-wide score distribution and repeated-deduction consistency review
- GradeLens, Canvas, and Gradescope CSV exports

## Architecture

| Layer | Technology |
| --- | --- |
| Web application | Next.js 15, React 19, TypeScript |
| Database | PostgreSQL with Prisma |
| Production database | Neon PostgreSQL |
| File storage | S3-compatible object storage; Neon Object Storage is the default production setup |
| Model providers | Groq, OpenAI, or Anthropic |
| Authentication | Application-managed email/password sessions |
| Production host | Render using the included Dockerfile |
| Tests | Vitest and ESLint |

The production web container is stateless. PostgreSQL stores application records and private object storage stores assignment and submission files, so Render restarts do not erase user data.

## Local development

### Requirements

- Node.js 20
- PostgreSQL; Neon works well for development and low-cost deployments
- S3-compatible storage, or local storage for development
- A Groq, OpenAI, or Anthropic API key for rubric generation and grading

### Setup

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create the first instructor account.

For local-only file storage, set:

```text
STORAGE_DRIVER=local
```

Uploads will be written under the ignored `uploads/` directory. Instructors can save a personal model key under **Account**, so a shared provider key in `.env` is optional.

### Useful commands

```bash
npm run dev          # Start the development server
npm run verify       # Run ESLint and all deterministic tests
npm run build        # Create the production build
npm run db:migrate   # Create/apply a development migration
npm run verify:neon  # Run the live Neon database and object-storage check
```

The deterministic test suite does not call a model provider or consume API credits.

## Environment variables

Start with [.env.example](.env.example). The important production settings are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL connection used by the running app |
| `DATABASE_URL_UNPOOLED` | Direct PostgreSQL connection used for migrations |
| `STORAGE_DRIVER` | Set to `s3` in production or `local` for local development |
| `STORAGE_BUCKET` | Private upload bucket; defaults to `uploads` |
| `AWS_REGION` | Object-storage region |
| `AWS_ACCESS_KEY_ID` | Object-storage access key |
| `AWS_SECRET_ACCESS_KEY` | Object-storage secret key |
| `AWS_ENDPOINT_URL_S3` | S3-compatible endpoint |
| `LLM_KEY_SECRET` | Encrypts stored model and Canvas credentials; required in production |
| `PUBLIC_APP_URL` | Public application origin used in email links |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional verification and password-reset email delivery |
| `SIGNUP_INVITE` | Optional shared code for approved independent instructor signup |
| `FEEDBACK_ADMIN_EMAIL` | Account allowed to read the private feedback inbox |

Optional shared provider keys—`GROQ_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`—act only as fallbacks when a user has not saved a personal key.

## Deploy with Render and Neon

The repository includes a production Dockerfile, `render.yaml`, Prisma migrations, and `neon.ts` service declarations.

1. Create a Neon project with PostgreSQL and a private `uploads` object-storage bucket.
2. Create a Render Web Service from this repository using the Docker runtime.
3. Add the pooled and direct Neon database URLs.
4. Add the Neon-provided S3-compatible storage credentials.
5. Generate a long random `LLM_KEY_SECRET` and keep it stable.
6. Configure `PUBLIC_APP_URL` and, if desired, Resend email settings.
7. Set the health-check path to `/api/health` and deploy.
8. Create the first instructor account; later accounts require a course invitation, a valid signup code, or explicitly enabled open signup.

See [docs/RENDER_NEON_DEPLOYMENT.md](docs/RENDER_NEON_DEPLOYMENT.md) for the complete environment checklist and deployment verification procedure.

The same container can run on another Docker host:

```bash
docker build -t gradelens .
docker run --rm -p 3000:3000 --env-file .env gradelens
```

## Privacy and grading safety

Student work may contain educational records and is transmitted to the model provider selected by the grader. Before using GradeLens with real coursework:

- Confirm institutional privacy, data-retention, FERPA, and model-provider requirements.
- Use fictional or institutionally approved data during pilots.
- Review every AI-generated deduction and quoted passage.
- Treat the Review page as an aid, not proof of grading consistency.
- Inspect exported identifiers and scores before importing them into an LMS.
- Keep the deployment invite-only until its operational controls have been reviewed.

Scanned and handwritten submissions are not reliably supported yet. A PDF must contain selectable text to be graded.

## Documentation

- [Complete user guide](docs/USER_GUIDE.md)
- [Feature inventory and roadmap](FEATURES.md)
- [Testing and acceptance guide](docs/TESTING.md)
- [Render and Neon deployment guide](docs/RENDER_NEON_DEPLOYMENT.md)
- [Product review and roadmap](PRODUCT_REVIEW_AND_ROADMAP.md)

User-visible changes should update the applicable guides and `FEATURES.md` in the same commit.
