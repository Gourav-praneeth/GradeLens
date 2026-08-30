export function courseDisplayName(input: {
  course?: { name: string; code: string | null } | null;
  courseLabel?: string | null;
}): string {
  return input.course?.code || input.course?.name || input.courseLabel || "No course";
}
