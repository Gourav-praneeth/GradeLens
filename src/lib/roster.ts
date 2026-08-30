export type RosterStudent = { id: string; name: string };

export function studentDisplayName(submission: {
  studentLabel: string;
  student?: { name: string } | null;
}): string {
  return submission.student?.name?.trim() || submission.studentLabel;
}

export function matchRosterStudent(label: string, roster: RosterStudent[]): RosterStudent | null {
  const needle = normalizeLoose(label);
  if (!needle) return null;
  return roster.find((student) => normalizeLoose(student.name) === needle) ?? null;
}

function normalizeLoose(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}
