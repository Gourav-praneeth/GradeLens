import Link from "next/link";

export function AssignmentNav({
  assignmentId,
  current,
}: {
  assignmentId: string;
  current: "assignment" | "submissions" | "review";
}) {
  return (
    <nav className="flow-nav" aria-label="Assignment sections">
      <Link
        href={`/assignments/${assignmentId}`}
        aria-current={current === "assignment" ? "page" : undefined}
      >
        Assignment
      </Link>
      <Link
        href={`/assignments/${assignmentId}/submissions`}
        aria-current={current === "submissions" ? "page" : undefined}
      >
        Submissions
      </Link>
      <Link
        href={`/assignments/${assignmentId}/review`}
        aria-current={current === "review" ? "page" : undefined}
      >
        Review
      </Link>
    </nav>
  );
}
