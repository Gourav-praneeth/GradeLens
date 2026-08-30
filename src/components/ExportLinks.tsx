export function ExportLinks({ assignmentId }: { assignmentId: string }) {
  const base = `/api/assignments/${assignmentId}/export`;
  return (
    <div className="flex flex-wrap gap-2">
      <a href={base} className="btn btn-ghost">
        GradeLens CSV
      </a>
      <a href={`${base}?format=canvas`} className="btn btn-ghost">
        Canvas CSV
      </a>
      <a href={`${base}?format=gradescope`} className="btn btn-ghost">
        Gradescope CSV
      </a>
    </div>
  );
}
