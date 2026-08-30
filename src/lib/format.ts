export function formatPoints(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatScore(awarded: number, possible: number): string {
  return `${formatPoints(awarded)} / ${formatPoints(possible)}`;
}

export function assignmentStatusLabel(status: string, hasRubric: boolean): string {
  if (status === "ready" || hasRubric) return "Rubric ready";
  return "Needs rubric";
}
