export function csvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(",");
}

export type RosterCriterion = {
  id: string;
  label: string;
};

export type RosterSubmission = {
  studentLabel: string;
  originalName: string;
  status: string;
  awarded: number | null;
  possible: number | null;
  scores: Array<{ criterionId: string; pointsAwarded: number }>;
};

export function buildRosterCsv(
  criteria: RosterCriterion[],
  submissions: RosterSubmission[],
): string {
  const header = csvRow([
    "Student",
    "File",
    "Status",
    "Awarded",
    "Possible",
    ...criteria.map((criterion) => criterion.label),
  ]);

  const lines = submissions.map((submission) => {
    const byCriterion = new Map(submission.scores.map((score) => [score.criterionId, score.pointsAwarded]));
    return csvRow([
      submission.studentLabel,
      submission.originalName,
      submission.status,
      submission.awarded ?? "",
      submission.possible ?? "",
      ...criteria.map((criterion) => byCriterion.get(criterion.id) ?? ""),
    ]);
  });

  return [header, ...lines].join("\n");
}
