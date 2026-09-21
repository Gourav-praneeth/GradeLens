import type { ExplicitSubmissionIdentity } from "./roster";

export function parseSubmissionManifest(
  text: string,
): Map<string, ExplicitSubmissionIdentity> {
  if (text.length > 1_000_000) {
    throw new Error("Submission manifest must be smaller than 1 MB.");
  }
  const rows = parseCsvRows(text.replace(/^\uFEFF/, "")).filter((row) =>
    row.some((cell) => cell.trim()),
  );
  if (rows.length < 2) {
    throw new Error("The manifest must include a header and at least one file.");
  }

  const headers = rows[0].map(normalizeHeader);
  const filenameIndex = headers.findIndex((header) =>
    ["filename", "file", "file name"].includes(header),
  );
  const identityOptions: Array<{
    kind: ExplicitSubmissionIdentity["kind"];
    aliases: string[];
  }> = [
    {
      kind: "sisLoginId",
      aliases: ["sis login id", "sis login", "login id", "login"],
    },
    {
      kind: "studentNumber",
      aliases: ["student id", "student number", "sis user id"],
    },
    {
      kind: "email",
      aliases: ["email", "email address"],
    },
  ];
  const identity = identityOptions
    .map((option) => ({
      kind: option.kind,
      index: headers.findIndex((header) => option.aliases.includes(header)),
    }))
    .find((option) => option.index >= 0);

  if (filenameIndex < 0 || !identity) {
    throw new Error(
      'Manifest headers must include "filename" and one of "sis_login_id", "student_id", or "email".',
    );
  }

  const result = new Map<string, ExplicitSubmissionIdentity>();
  rows.slice(1).forEach((row, index) => {
    const filename = String(row[filenameIndex] ?? "").trim();
    const value = String(row[identity.index] ?? "").trim();
    if (!filename || !value) {
      throw new Error(`Manifest row ${index + 2} is missing a filename or identifier.`);
    }
    const key = normalizeFilename(filename);
    if (result.has(key)) {
      throw new Error(`Manifest lists "${filename}" more than once.`);
    }
    result.set(key, { kind: identity.kind, value });
  });
  return result;
}

export function normalizeFilename(filename: string): string {
  return filename.trim().toLowerCase();
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n" || character === "\r") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("The manifest contains an unclosed quoted value.");
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}
