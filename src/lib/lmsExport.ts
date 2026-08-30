import { csvRow } from "./csv";

export type ExportFormat = "gradelens" | "canvas" | "gradescope";

export function parseExportFormat(value: string | null | undefined): ExportFormat {
  if (value === "canvas" || value === "gradescope") return value;
  return "gradelens";
}

export function splitPersonName(name: string): { first: string; last: string } {
  const trimmed = name.trim();
  const space = trimmed.lastIndexOf(" ");
  if (space <= 0) return { first: trimmed, last: "" };
  return { first: trimmed.slice(0, space), last: trimmed.slice(space + 1) };
}

export type LmsRow = {
  name: string;
  email: string | null;
  awarded: number | null;
  possible: number | null;
  status: string;
};

export function buildCanvasCsv(assignmentTitle: string, possible: number, rows: LmsRow[]): string {
  const column = `${assignmentTitle} (${possible})`;
  const header = csvRow(["Student", "ID", "SIS User ID", "SIS Login ID", "Section", column]);
  const points = csvRow(["Points Possible", "", "", "", "", possible]);
  const body = rows.map((row) =>
    csvRow([row.name, "", "", row.email ?? "", "", row.awarded ?? ""]),
  );
  return [header, points, ...body].join("\n");
}

export function buildGradescopeCsv(rows: LmsRow[]): string {
  const header = csvRow(["First Name", "Last Name", "SID", "Email", "Total Score", "Status"]);
  const body = rows.map((row) => {
    const { first, last } = splitPersonName(row.name);
    return csvRow([first, last, "", row.email ?? "", row.awarded ?? "", row.status]);
  });
  return [header, ...body].join("\n");
}

export function exportFilename(title: string, format: ExportFormat): string {
  const base = title.replace(/[^a-zA-Z0-9._-]+/g, "_") || "roster";
  if (format === "canvas") return `${base}-canvas.csv`;
  if (format === "gradescope") return `${base}-gradescope.csv`;
  return `${base}.csv`;
}
