export const COURSE_ACCENTS = [
  { name: "Pacific", value: "#007C83", description: "Clear teal" },
  { name: "Cobalt", value: "#2457D6", description: "Electric blue" },
  { name: "Ember", value: "#B34A00", description: "Burnt orange" },
  { name: "Berry", value: "#B51F5D", description: "Deep magenta" },
  { name: "Iris", value: "#6D3AC1", description: "Strong violet" },
  { name: "Forest", value: "#2E7D32", description: "Evergreen" },
] as const;

export const COURSE_TERMS = ["Spring", "Summer", "Fall", "Winter"] as const;

export function courseRoleLabel(role: string): string {
  return role === "owner" ? "Instructor" : role === "ta" ? "TA" : "Course member";
}

export function courseRoleSummary(roles: string[]): string | null {
  if (roles.length === 0) return null;
  const instructors = roles.filter((role) => role === "owner").length;
  const tas = roles.filter((role) => role === "ta").length;
  if (roles.length === 1) return `Your role: ${courseRoleLabel(roles[0])}`;
  if (instructors === roles.length) return `Your role: Instructor in ${instructors} courses`;
  if (tas === roles.length) return `Your role: TA in ${tas} courses`;
  return `Your roles: Instructor in ${instructors} ${courseWord(instructors)} · TA in ${tas} ${courseWord(tas)}`;
}

export function courseMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CO";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function semesterOptions(referenceDate: Date = new Date()): string[] {
  const firstYear = referenceDate.getFullYear() - 1;
  return Array.from({ length: 6 }, (_, offset) => firstYear + offset).flatMap((year) =>
    COURSE_TERMS.map((term) => `${term} ${year}`),
  );
}

export function isValidSemester(value: string): boolean {
  const match = /^(Spring|Summer|Fall|Winter) (\d{4})$/.exec(value.trim());
  if (!match) return false;
  const year = Number(match[2]);
  return year >= 2000 && year <= 2100;
}

export function isValidCourseAccent(value: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(value.trim());
}

function courseWord(count: number): string {
  return count === 1 ? "course" : "courses";
}
