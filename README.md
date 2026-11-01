# GradeLens

A local autograder for TAs and professors. Create a course, add a roster, generate a rubric from official solutions, then grade student PDFs or text with an explanation for every deduction.

See [docs/USER_GUIDE.md](docs/USER_GUIDE.md) for complete instructor and grader instructions, [FEATURES.md](FEATURES.md) for what is shipped and what comes next, and [docs/TESTING.md](docs/TESTING.md) for acceptance tests and sample files. User-visible feature changes should update all applicable guides in the same commit.

## Requirements

- Node.js 20
- PostgreSQL (Neon works well for low-cost deployments)
- S3-compatible object storage (Neon Object Storage, Cloudflare R2, or AWS S3)
- Each instructor or TA can save their own Groq, OpenAI, or Anthropic API key in Account settings. Optionally set `GROQ_API_KEY` (free), `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY` in `.env` as a shared fallback.

## Run locally

```bash
npm install
cp .env.example .env
```

Set the Neon URLs and storage variables in `.env`. For local-only development, set `STORAGE_DRIVER=local`; uploads then go under `uploads/`. Optionally put a fallback API key in `.env`. Instructors can also paste a personal key after sign-in under **Account**. For local testing, create a free key at [console.groq.com](https://console.groq.com). Then:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an instructor account. After sign-in you land on the courses dashboard.

## Deploy on Render with Neon

The production app is stateless: PostgreSQL holds application data and S3-compatible object storage holds submissions. This is compatible with Render's ephemeral filesystem.

1. Create an empty Neon project and a private object-storage bucket.
2. In Render, create a Web Service from this repository and select the Docker runtime and Free instance.
3. Add the pooled Neon URL as `DATABASE_URL` and the direct URL as `DATABASE_URL_UNPOOLED`.
4. Add `STORAGE_DRIVER=s3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_ENDPOINT_URL_S3`. GradeLens defaults to the private `uploads` bucket declared in `neon.ts`; `STORAGE_BUCKET` can override it.
5. Set a long random `LLM_KEY_SECRET`. It is intentionally required by the production entrypoint.
6. Optional: add a shared `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`. Instructors can instead save personal keys under **Account**.
7. Optional: set `SIGNUP_INVITE`; `ALLOW_SIGNUP=true` opens signup to anyone with the URL.
8. Set `RESEND_API_KEY`, `EMAIL_FROM`, and `PUBLIC_APP_URL` for verification and password resets.
9. Set Render's health check path to `/api/health`. The container applies Prisma migrations before starting.
10. Deploy and create the **first** account. Later signup is limited to invited staff, the invite code, or `ALLOW_SIGNUP=true`.

The PostgreSQL migration history is intended for a fresh Neon database. It is not an in-place conversion of an existing SQLite database; export and import old production data separately if you have any that must be retained.

For the exact environment-variable checklist and first-deploy verification steps, see [docs/RENDER_NEON_DEPLOYMENT.md](docs/RENDER_NEON_DEPLOYMENT.md).

Use **fake student work** on a public URL. The model is a first pass; keep a human in the loop before scores are official.

A container also works on another Docker host when the same PostgreSQL and object-storage variables are supplied:

```bash
docker build -t gradelens .
docker run --rm -p 3000:3000 --env-file .env gradelens
```

## How it works

1. Sign up (and verify your email if this server sends mail), save your Groq, OpenAI, or Anthropic key under **Account**, then create a course.
2. Add students manually, import a generic or Canvas gradebook CSV, or connect Canvas under **Account** and sync a Canvas course roster. Canvas `ID` and `SIS Login ID` remain separate.
3. Create an assignment in that course and add questions plus official solutions (paste or PDF).
4. Generate a rubric, then edit criteria and point values.
5. Import submissions from Canvas by exact user ID, or bulk-upload PDF/TXT files named like `SIS_LOGIN_ID__paper.pdf`. Ambiguous files stay in a review queue.
6. Grade one paper or the whole stack. Each mark includes why points were taken off.
7. Open **Review** to compare similar deductions, then export a Canvas or Gradescope CSV.

Invite other TAs from the course page. Scanned PDFs with no selectable text will show a warning. Image / handwriting support is planned for a later phase.
