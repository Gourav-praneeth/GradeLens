import type { RubricDraftCriterion } from "./types";

export type StatedPart = {
  label: string;
  maxPoints: number;
};

export type StatedPoints = {
  parts: StatedPart[];
  statedTotal: number | null;
};

const TOTAL_RE = /(?:worth\s+(?:a\s+)?total\s+of|total(?:\s+of)?)\s+(\d+(?:\.\d+)?)\s*(?:points?|pts)\b/i;
const QUESTION_SPLIT_RE = /(?:^|\n)\s*((?:Question|Q)\s*(\d+))\s*[:.]/gi;
const PART_RE =
  /\(([a-z])\)\s*([\s\S]*?)\((\d+(?:\.\d+)?)\s*(?:points?|pts)\)/gi;
const SINGLE_POINTS_RE = /\((\d+(?:\.\d+)?)\s*(?:points?|pts)\)/i;
const HEADER_POINTS_RE = /(?:Question|Q)\s*\d+[^\n]{0,40}?\((\d+(?:\.\d+)?)\s*(?:points?|pts)\)/i;

export function parseStatedPoints(questionsText: string): StatedPoints {
  const statedTotal = matchNumber(questionsText, TOTAL_RE);
  const sections = splitQuestionSections(questionsText);
  const parts: StatedPart[] = [];

  for (const section of sections) {
    const lettered = [...section.body.matchAll(new RegExp(PART_RE.source, "gi"))];
    if (lettered.length > 0) {
      for (const match of lettered) {
        const letter = match[1].toLowerCase();
        const maxPoints = Number(match[3]);
        if (!Number.isFinite(maxPoints) || maxPoints <= 0) continue;
        parts.push({
          label: `Q${section.number} (${letter})`,
          maxPoints,
        });
      }
      continue;
    }

    const headerPoints = matchNumber(section.heading + "\n" + section.body.slice(0, 200), HEADER_POINTS_RE);
    const bodyPoints = matchNumber(section.body, SINGLE_POINTS_RE);
    const maxPoints = headerPoints ?? bodyPoints;
    if (maxPoints && maxPoints > 0) {
      parts.push({
        label: `Q${section.number}`,
        maxPoints,
      });
    }
  }

  return { parts, statedTotal };
}

export function applyStatedPoints(
  criteria: RubricDraftCriterion[],
  stated: StatedPoints,
): RubricDraftCriterion[] {
  if (stated.parts.length > 0) {
    return stated.parts.map((part, index) => {
      const matched =
        criteria.find((row) => labelsMatch(row.label, part.label)) ?? criteria[index];
      return {
        label: matched?.label?.trim() && labelsMatch(matched.label, part.label) ? matched.label : part.label,
        maxPoints: part.maxPoints,
        fullCreditDescription:
          matched?.fullCreditDescription?.trim() ||
          "Award full credit as described in the official solutions.",
      };
    });
  }

  const currentTotal = criteria.reduce((sum, row) => sum + row.maxPoints, 0);
  if (stated.statedTotal && currentTotal > 0 && Math.abs(currentTotal - stated.statedTotal) > 0.001) {
    const scale = stated.statedTotal / currentTotal;
    return criteria.map((row) => ({
      ...row,
      maxPoints: roundPoints(row.maxPoints * scale),
    }));
  }

  return criteria;
}

export function statedPointsPromptBlock(stated: StatedPoints): string {
  if (stated.parts.length === 0 && stated.statedTotal == null) {
    return "No explicit point values were parsed from the questions. Infer a fair split.";
  }

  const lines = stated.parts.map((part) => `- ${part.label}: ${part.maxPoints} points`);
  if (stated.statedTotal != null) {
    lines.push(`- Assignment total: ${stated.statedTotal} points`);
  }
  return `The questions already state these point values. Use them exactly. Do not round to 10, 20, 50, or 100.
${lines.join("\n")}
Create one criterion per listed part. The rubric total must equal ${stated.statedTotal ?? stated.parts.reduce((sum, part) => sum + part.maxPoints, 0)}.`;
}

export function labelsMatch(left: string, right: string): boolean {
  return normalizeLabel(left) === normalizeLabel(right) ||
    normalizeLabel(left).includes(normalizeLabel(right)) ||
    normalizeLabel(right).includes(normalizeLabel(left));
}

function splitQuestionSections(text: string): Array<{ heading: string; number: string; body: string }> {
  const matches = [...text.matchAll(new RegExp(QUESTION_SPLIT_RE.source, "gi"))];
  if (matches.length === 0) return [];

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
    return {
      heading: match[1].trim(),
      number: match[2],
      body: text.slice(start, end),
    };
  });
}

function matchNumber(text: string, regex: RegExp): number | null {
  const match = text.match(regex);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/question\s*/g, "q")
    .replace(/part\s*/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function roundPoints(value: number): number {
  return Math.round(value * 100) / 100;
}
