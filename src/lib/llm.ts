import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { parseJsonObject } from "./json";
import { applyStatedPoints, parseStatedPoints, statedPointsPromptBlock } from "./points";
import { assembleGradeScores, cleanRubricCriteria } from "./rubricDraft";
import type { LlmCredentials } from "./llmProviders";
import type { GradeDraftScore, RubricDraftCriterion } from "./types";

export type { GradeDraftScore, RubricDraftCriterion };

async function completeJson(
  credentials: LlmCredentials,
  system: string,
  user: string,
): Promise<Record<string, unknown>> {
  const { provider, apiKey } = credentials;

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    return parseJsonObject(text);
  }

  const client =
    provider === "groq"
      ? new OpenAI({
          apiKey,
          baseURL: "https://api.groq.com/openai/v1",
        })
      : new OpenAI({ apiKey });
  const model =
    provider === "groq"
      ? (process.env.GROQ_MODEL ?? "openai/gpt-oss-120b")
      : (process.env.OPENAI_MODEL ?? "gpt-4o-mini");
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = response.choices[0]?.message?.content ?? "";
  return parseJsonObject(text);
}

export async function generateRubric(
  input: {
    title: string;
    questionsText: string;
    solutionsText: string;
  },
  credentials: LlmCredentials,
): Promise<RubricDraftCriterion[]> {
  const stated = parseStatedPoints(input.questionsText);
  const data = await completeJson(
    credentials,
    `You write grading rubrics for college courses. Return JSON only.
Shape: {"criteria":[{"label":"short name","maxPoints":number,"fullCreditDescription":"what full credit requires"}]}
Rules:
- Cover every scored part of the assignment
- Criteria must be independently gradable
- If the questions state point values, copy those numbers exactly. Never invent a 10/20/50/100 total when points are already listed
- Be specific enough that two TAs would award the same points
${statedPointsPromptBlock(stated)}`,
    `Assignment: ${input.title}

Questions:
${input.questionsText}

Official solutions:
${input.solutionsText}

Stated point values:
${statedPointsPromptBlock(stated)}`,
  );

  const cleaned = applyStatedPoints(cleanRubricCriteria(data.criteria), stated);

  if (cleaned.length === 0) {
    throw new Error("The model did not produce a usable rubric. Try again.");
  }

  return cleaned;
}

export async function gradeSubmission(
  input: {
    title: string;
    questionsText: string;
    solutionsText: string;
    studentText: string;
    criteria: Array<{
      id: string;
      label: string;
      maxPoints: number;
      fullCreditDescription: string;
    }>;
  },
  credentials: LlmCredentials,
): Promise<{ summary: string; scores: GradeDraftScore[] }> {
  const rubricBlock = input.criteria
    .map(
      (criterion, index) =>
        `${index + 1}. id=${criterion.id} | ${criterion.label} (${criterion.maxPoints} pts)\n   Full credit: ${criterion.fullCreditDescription}`,
    )
    .join("\n");

  const data = await completeJson(
    credentials,
    `You are a careful teaching assistant. Grade only against the given rubric. Be fair and consistent.
Deduct only for missing or incorrect work. Do not invent criteria.
If the student earns full credit on a criterion, still write a short note saying why.
Return JSON only:
{"summary":"one sentence","scores":[{"criterionId":"id","pointsAwarded":number,"deductionReason":"why points changed","evidenceQuote":"short quote from the student or empty"}]}
pointsAwarded must be between 0 and that criterion's maxPoints.`,
    `Assignment: ${input.title}

Questions:
${input.questionsText}

Official solutions:
${input.solutionsText}

Rubric:
${rubricBlock}

Student submission:
${input.studentText || "(no extractable text)"}`,
  );

  const scores = assembleGradeScores(input.criteria, data.scores);

  if (scores.length !== input.criteria.length) {
    throw new Error("Grading missed one or more rubric criteria.");
  }

  return {
    summary: String(data.summary ?? "").trim(),
    scores,
  };
}
