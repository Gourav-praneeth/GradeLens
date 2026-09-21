export type RosterStudent = {
  id: string;
  name: string;
  email?: string | null;
  studentNumber?: string | null;
  sisLoginId?: string | null;
  canvasUserId?: string | null;
};

export type SubmissionMatchMethod =
  | "manifest_sis_login"
  | "manifest_canvas_id"
  | "manifest_student_id"
  | "manifest_email"
  | "sis_login"
  | "canvas_id"
  | "student_id"
  | "email"
  | "name";

export type SubmissionMatch =
  | { status: "matched"; student: RosterStudent; method: SubmissionMatchMethod }
  | {
      status: "ambiguous";
      candidates: RosterStudent[];
      method: SubmissionMatchMethod;
    }
  | { status: "unmatched"; candidates: [] };

export type ExplicitSubmissionIdentity = {
  kind: "sisLoginId" | "canvasUserId" | "studentNumber" | "email";
  value: string;
};

export function studentDisplayName(submission: {
  studentLabel: string;
  student?: { name: string } | null;
}): string {
  return submission.student?.name?.trim() || submission.studentLabel;
}

export function matchRosterStudent(label: string, roster: RosterStudent[]): RosterStudent | null {
  const result = matchSubmissionToRoster({ filename: label }, roster);
  return result.status === "matched" ? result.student : null;
}

export function matchSubmissionToRoster(
  input: { filename: string; explicit?: ExplicitSubmissionIdentity | null },
  roster: RosterStudent[],
): SubmissionMatch {
  if (input.explicit) {
    const method: SubmissionMatchMethod =
      input.explicit.kind === "sisLoginId"
        ? "manifest_sis_login"
        : input.explicit.kind === "canvasUserId"
          ? "manifest_canvas_id"
          : input.explicit.kind === "studentNumber"
            ? "manifest_student_id"
            : "manifest_email";
    return resultFor(
      roster.filter(
        (student) =>
          Boolean(normalizeIdentifier(input.explicit!.value)) &&
          Boolean(normalizeIdentifier(student[input.explicit!.kind])) &&
          normalizeIdentifier(student[input.explicit!.kind]) ===
          normalizeIdentifier(input.explicit!.value),
      ),
      method,
    );
  }

  const base = input.filename.replace(/\.[^.]+$/, "").trim();
  const delimiter = base.indexOf("__");
  const identifier = delimiter >= 0 ? base.slice(0, delimiter) : base;
  const identifierChecks: Array<{
    field: "sisLoginId" | "canvasUserId" | "studentNumber" | "email";
    method: SubmissionMatchMethod;
  }> = [
    { field: "sisLoginId", method: "sis_login" },
    { field: "canvasUserId", method: "canvas_id" },
    { field: "studentNumber", method: "student_id" },
    { field: "email", method: "email" },
  ];

  if (normalizeIdentifier(identifier)) {
    for (const check of identifierChecks) {
      const candidates = roster.filter(
        (student) =>
          Boolean(normalizeIdentifier(student[check.field])) &&
          normalizeIdentifier(student[check.field]) === normalizeIdentifier(identifier),
      );
      if (candidates.length > 0) return resultFor(candidates, check.method);
    }
  }

  const normalizedName = normalizeLoose(base);
  if (!normalizedName) return { status: "unmatched", candidates: [] };
  const nameCandidates = roster.filter(
    (student) => normalizeLoose(student.name) === normalizedName,
  );
  return nameCandidates.length > 0
    ? resultFor(nameCandidates, "name")
    : { status: "unmatched", candidates: [] };
}

function normalizeLoose(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeIdentifier(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function resultFor(
  candidates: RosterStudent[],
  method: SubmissionMatchMethod,
): SubmissionMatch {
  if (candidates.length === 0) {
    return { status: "unmatched", candidates: [] };
  }
  if (candidates.length === 1) {
    return { status: "matched", student: candidates[0], method };
  }
  return { status: "ambiguous", candidates, method };
}
