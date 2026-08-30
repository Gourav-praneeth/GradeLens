# GradeLens

A local autograder for TAs and professors. Create a course, add a roster, generate a rubric from official solutions, then grade student PDFs or text with an explanation for every deduction.

See [FEATURES.md](FEATURES.md) for what is shipped and what comes next. For a click-through of every feature, including sample files, see [docs/TESTING.md](docs/TESTING.md).

## Requirements

- Node.js 20+
- One LLM API key: `GROQ_API_KEY` (free), `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`

## Run locally

```bash
npm install
cp .env.example .env
```

Put your API key in `.env`. For local testing, create a free key at [console.groq.com](https://console.groq.com) and set `GROQ_API_KEY`. Then:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an instructor account. After sign-in you land on the courses dashboard.

## Deploy

The app is a long-running Node server with SQLite and uploaded files on disk. **Railway** (or any host that can run the Dockerfile with a persistent volume) is the intended production setup. Do not use a serverless host with an ephemeral filesystem.

1. Create a Railway project from this repo. It will build the `Dockerfile`.
2. Add a volume and mount it at `/data`.
3. Set `GROQ_API_KEY` (or another LLM key). The container defaults `DATABASE_URL` and `UPLOAD_DIR` under `/data`.
4. Optional: `SIGNUP_INVITE` so extra instructors can join without a course staff invite. `ALLOW_SIGNUP=true` opens signup to anyone with the URL (they can create courses and use your API key).
5. Deploy, open the HTTPS URL, and create the **first** account. After that, production signup is limited to invited staff emails, a matching invite code, or `ALLOW_SIGNUP=true`.

Use **fake student work** on a public URL. The model is a first pass; keep a human in the loop before scores are official.

A container with a volume at `/data` also works on Fly.io, Render, or a VPS:

```bash
docker build -t gradelens .
docker run --rm -p 3000:3000 -v gradelens-data:/data -e GROQ_API_KEY=... gradelens
```

## How it works

1. Sign up, then create a course (and optionally a student roster).
2. Create an assignment in that course and add questions plus official solutions (paste or PDF).
3. Generate a rubric, then edit criteria and point values.
4. Upload student work as PDF or `.txt`. Filenames like `alex-chen.pdf` match roster names.
5. Grade one paper or the whole stack. Each mark includes why points were taken off.
6. Open **Review** to compare similar deductions, then export a Canvas or Gradescope CSV.

Invite other TAs from the course page. Scanned PDFs with no selectable text will show a warning. Image / handwriting support is planned for a later phase.
