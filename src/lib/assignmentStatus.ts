export function assignmentLifecycle(input: {
  status?: string | null;
  hasRubric: boolean;
  dueAt?: Date | string | null;
}): "draft" | "published" | "closed" {
  if (input.status === "closed") return "closed";
  if (input.status === "published" || input.hasRubric) {
    if (input.dueAt && new Date(input.dueAt).getTime() < Date.now()) return "closed";
    return "published";
  }
  return "draft";
}

export function assignmentStatusLabel(status: "draft" | "published" | "closed"): string {
  if (status === "closed") return "Closed";
  if (status === "published") return "Published";
  return "Draft";
}
