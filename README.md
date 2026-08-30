# GradeLens

A local autograder for TAs and professors. Create a course, add a roster, generate a rubric from official solutions, then grade student PDFs or text with an explanation for every deduction.

See [FEATURES.md](FEATURES.md) for what is shipped and what comes next.

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

Open [http://localhost:3000](http://localhost:3000) and create an instructor account.

## How it works

1. Sign up, then create a course (and optionally a student roster).
2. Create an assignment in that course and add questions plus official solutions (paste or PDF).
3. Generate a rubric, then edit criteria and point values.
4. Upload student work as PDF or `.txt`. Filenames like `alex-chen.pdf` match roster names.
5. Grade one paper or the whole stack. Each mark includes why points were taken off.

Invite other TAs from the course page. Scanned PDFs with no selectable text will show a warning. Image / handwriting support is planned for a later phase.
