export type ImportedRosterStudent = {
  name: string;
  studentNumber: string | null;
  sisLoginId: string | null;
  canvasUserId: string | null;
  email: string | null;
};

const headerAliases = {
  name: ["name", "student", "student name", "full name"],
  firstName: ["first name", "firstname", "given name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  studentNumber: ["student id", "student number", "sis id", "sis user id"],
  sisLoginId: ["sis login id", "sis login", "login id"],
  canvasUserId: ["canvas id", "canvas user id"],
  email: ["email", "email address", "student email"],
};

export function parseRosterCsv(text: string): ImportedRosterStudent[] {
  if (text.length > 2_000_000) {
    throw new Error("Roster CSV must be smaller than 2 MB.");
  }

  const rows = parseCsvRows(text.replace(/^\uFEFF/, "")).filter((row) =>
    row.some((cell) => cell.trim()),
  );
  if (rows.length < 2) {
    throw new Error("The CSV must include a header row and at least one student.");
  }

  const headers = rows[0].map(normalizeHeader);
  const nameIndex = findHeader(headers, headerAliases.name);
  const firstNameIndex = findHeader(headers, headerAliases.firstName);
  const lastNameIndex = findHeader(headers, headerAliases.lastName);
  const studentNumberIndex = findHeader(headers, headerAliases.studentNumber);
  const sisLoginIdIndex = findHeader(headers, headerAliases.sisLoginId);
  const canvasGradebook =
    headers.includes("student") &&
    headers.includes("id") &&
    headers.includes("sis login id");
  const canvasUserIdIndex = canvasGradebook
    ? headers.indexOf("id")
    : findHeader(headers, headerAliases.canvasUserId);
  const emailIndex = findHeader(headers, headerAliases.email);

  if (nameIndex < 0 && (firstNameIndex < 0 || lastNameIndex < 0)) {
    throw new Error(
      'CSV headers must include "Name" or both "First Name" and "Last Name".',
    );
  }

  const seenCanvasIds = new Set<string>();
  const students: ImportedRosterStudent[] = [];
  rows.slice(1).forEach((row, index) => {
    const rawName =
      nameIndex >= 0
        ? cell(row, nameIndex)
        : [cell(row, firstNameIndex), cell(row, lastNameIndex)].filter(Boolean).join(" ");
    if (normalizeHeader(rawName) === "points possible") return;
    const name = canvasGradebook ? displayCanvasName(rawName) : rawName;

    if (!name) {
      throw new Error(`Student name is missing on CSV row ${index + 2}.`);
    }
    const canvasUserId = nullableCell(row, canvasUserIdIndex);
    if (canvasGradebook && !canvasUserId) {
      throw new Error(`Canvas ID is missing on CSV row ${index + 2}.`);
    }
    if (canvasUserId) {
      if (seenCanvasIds.has(canvasUserId)) {
        throw new Error(`Canvas ID "${canvasUserId}" appears more than once.`);
      }
      seenCanvasIds.add(canvasUserId);
    }

    students.push({
      name,
      studentNumber: nullableCell(row, studentNumberIndex),
      sisLoginId: nullableCell(row, sisLoginIdIndex),
      canvasUserId,
      email: nullableCell(row, emailIndex),
    });
  });
  if (students.length === 0) {
    throw new Error("The CSV does not contain any student rows.");
  }
  return students;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cellValue = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cellValue += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cellValue += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cellValue);
      cellValue = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cellValue);
      rows.push(row);
      row = [];
      cellValue = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      cellValue += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  if (cellValue || row.length) {
    row.push(cellValue);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function findHeader(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function cell(row: string[], index: number): string {
  return index < 0 ? "" : String(row[index] ?? "").trim();
}

function nullableCell(row: string[], index: number): string | null {
  return cell(row, index) || null;
}

function displayCanvasName(value: string): string {
  const comma = value.indexOf(",");
  if (comma < 0) return value.trim();
  const last = value.slice(0, comma).trim();
  const first = value.slice(comma + 1).trim();
  return [first, last].filter(Boolean).join(" ");
}
