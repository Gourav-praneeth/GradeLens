import { isIP } from "node:net";

export type CanvasCredentials = {
  baseUrl: string;
  accessToken: string;
};

export type CanvasStudent = {
  canvasUserId: string;
  name: string;
  studentNumber: string | null;
  sisLoginId: string | null;
  email: string | null;
};

export type CanvasSubmissionFile = {
  canvasSubmissionId: string;
  canvasUserId: string;
  submittedAt: string;
  filename: string;
  downloadUrl: string;
};

type CanvasUser = {
  id?: string | number;
  name?: string;
  short_name?: string;
  sortable_name?: string;
  sis_user_id?: string | number | null;
  login_id?: string | null;
  email?: string | null;
};

type CanvasEnrollment = {
  type?: string;
  enrollment_state?: string;
  sis_user_id?: string | number | null;
  user?: CanvasUser;
};

type CanvasSubmission = {
  id?: string | number;
  user_id?: string | number;
  submitted_at?: string | null;
  workflow_state?: string;
  attachments?: Array<{
    display_name?: string;
    filename?: string;
    url?: string;
    content_type?: string;
  }>;
};

export class CanvasApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanvasApiError";
  }
}

export function normalizeCanvasBaseUrl(value: string): string {
  const raw = value.trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid Canvas URL, such as https://school.instructure.com.");
  }

  if (url.protocol !== "https:") {
    throw new Error("Canvas URL must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Canvas URL cannot include a username or password.");
  }
  if (url.port && url.port !== "443") {
    throw new Error("Canvas URL must use the standard HTTPS port.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    isPrivateIp(hostname)
  ) {
    throw new Error("Canvas URL must use a public institution hostname.");
  }

  return url.origin;
}

export async function verifyCanvasCredentials(credentials: CanvasCredentials): Promise<void> {
  await canvasRequest<Record<string, unknown>>(credentials, "/api/v1/users/self/profile");
}

export async function fetchCanvasStudents(
  credentials: CanvasCredentials,
  canvasCourseId: string,
): Promise<CanvasStudent[]> {
  const courseId = canvasCourseId.trim();
  if (!courseId || courseId.length > 200) {
    throw new Error("Enter a valid Canvas course ID.");
  }

  const path =
    `/api/v1/courses/${encodeURIComponent(courseId)}/enrollments` +
    "?type%5B%5D=StudentEnrollment&state%5B%5D=active&per_page=100";
  const enrollments = await canvasPaginatedRequest<CanvasEnrollment>(credentials, path);
  const students = new Map<string, CanvasStudent>();

  for (const enrollment of enrollments) {
    if (
      enrollment.type !== "StudentEnrollment" ||
      enrollment.enrollment_state !== "active" ||
      !enrollment.user?.id
    ) {
      continue;
    }

    const user = enrollment.user;
    const canvasUserId = String(user.id).trim();
    const name = String(user.name ?? user.short_name ?? user.sortable_name ?? "").trim();
    if (!canvasUserId || !name) continue;
    const loginId = nullableString(user.login_id);

    students.set(canvasUserId, {
      canvasUserId,
      name,
      studentNumber: nullableString(user.sis_user_id ?? enrollment.sis_user_id),
      sisLoginId: loginId,
      email: nullableString(user.email) ?? (loginId?.includes("@") ? loginId : null),
    });
  }

  return [...students.values()];
}

export async function fetchCanvasSubmissionFiles(
  credentials: CanvasCredentials,
  canvasCourseId: string,
  canvasAssignmentId: string,
): Promise<{ submissions: CanvasSubmissionFile[]; warnings: string[] }> {
  const courseId = requiredCanvasId(canvasCourseId, "course");
  const assignmentId = requiredCanvasId(canvasAssignmentId, "assignment");
  const path =
    `/api/v1/courses/${encodeURIComponent(courseId)}/assignments/` +
    `${encodeURIComponent(assignmentId)}/submissions?include%5B%5D=user&per_page=100`;
  const records = await canvasPaginatedRequest<CanvasSubmission>(credentials, path);
  const submissions: CanvasSubmissionFile[] = [];
  const warnings: string[] = [];

  for (const record of records) {
    const submissionId = nullableString(record.id);
    const canvasUserId = nullableString(record.user_id);
    const submittedAt = nullableString(record.submitted_at);
    if (!submissionId || !canvasUserId || !submittedAt || record.workflow_state === "unsubmitted") {
      continue;
    }
    const supported = (record.attachments ?? []).filter((attachment) =>
      isSupportedSubmissionFile(
        String(attachment.display_name ?? attachment.filename ?? ""),
        attachment.content_type,
      ),
    );
    const attachment = supported[0];
    const filename = String(attachment?.display_name ?? attachment?.filename ?? "").trim();
    const downloadUrl = String(attachment?.url ?? "").trim();
    if (!attachment || !filename || !downloadUrl) {
      warnings.push(`Canvas submission ${submissionId} has no supported PDF or text attachment.`);
      continue;
    }
    if (supported.length > 1) {
      warnings.push(`Canvas submission ${submissionId} has multiple files; only ${filename} was imported.`);
    }
    submissions.push({
      canvasSubmissionId: submissionId,
      canvasUserId,
      submittedAt,
      filename,
      downloadUrl,
    });
  }

  return { submissions, warnings };
}

export async function downloadCanvasSubmissionFile(
  credentials: CanvasCredentials,
  file: CanvasSubmissionFile,
): Promise<Uint8Array> {
  normalizeCanvasBaseUrl(file.downloadUrl);
  const response = await canvasFetch(credentials, file.downloadUrl);
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > 10 * 1024 * 1024) {
    throw new CanvasApiError(`${file.filename} is larger than 10 MB.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 10 * 1024 * 1024) {
    throw new CanvasApiError(`${file.filename} is larger than 10 MB.`);
  }
  return bytes;
}

async function canvasPaginatedRequest<T>(
  credentials: CanvasCredentials,
  path: string,
): Promise<T[]> {
  const baseUrl = normalizeCanvasBaseUrl(credentials.baseUrl);
  let nextUrl: string | null = new URL(path, `${baseUrl}/`).toString();
  const records: T[] = [];
  let pages = 0;

  while (nextUrl) {
    pages += 1;
    if (pages > 100) throw new CanvasApiError("Canvas returned too many roster pages.");
    const response = await canvasFetch(credentials, nextUrl);
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new CanvasApiError("Canvas returned an unexpected roster response.");
    }
    records.push(...(data as T[]));

    const candidate = parseNextLink(response.headers.get("link"));
    if (candidate && new URL(candidate).origin !== baseUrl) {
      throw new CanvasApiError("Canvas returned a pagination link for another host.");
    }
    nextUrl = candidate;
  }

  return records;
}

async function canvasRequest<T>(
  credentials: CanvasCredentials,
  path: string,
): Promise<T> {
  const baseUrl = normalizeCanvasBaseUrl(credentials.baseUrl);
  const response = await canvasFetch(credentials, new URL(path, `${baseUrl}/`).toString());
  return (await response.json()) as T;
}

async function canvasFetch(
  credentials: CanvasCredentials,
  url: string,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CanvasApiError("Could not reach the Canvas server. Check the institution URL.");
  }
  if (response.ok) return response;

  if (response.status === 401) {
    throw new CanvasApiError("Canvas rejected the access token.");
  }
  if (response.status === 403) {
    throw new CanvasApiError("The Canvas token does not have permission to read this roster.");
  }
  if (response.status === 404) {
    throw new CanvasApiError("Canvas could not find that course.");
  }
  if (response.status === 429) {
    throw new CanvasApiError("Canvas rate limit reached. Wait a moment and try again.");
  }
  throw new CanvasApiError(`Canvas request failed with status ${response.status}.`);
}

function parseNextLink(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="?([^";]+)"?/);
    if (match?.[2] === "next") return match[1];
  }
  return null;
}

function nullableString(value: unknown): string | null {
  const text = value == null ? "" : String(value).trim();
  return text || null;
}

function requiredCanvasId(value: string, label: string): string {
  const result = value.trim();
  if (!result || result.length > 200) {
    throw new Error(`Enter a valid Canvas ${label} ID.`);
  }
  return result;
}

function isSupportedSubmissionFile(filename: string, contentType?: string): boolean {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    contentType === "application/pdf" ||
    contentType === "text/plain" ||
    contentType === "text/markdown"
  );
}

function isPrivateIp(hostname: string): boolean {
  const version = isIP(hostname);
  if (version === 4) {
    const [a, b] = hostname.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  if (version === 6) {
    const normalized = hostname.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPrivateIp(normalized.slice("::ffff:".length));
    }
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    );
  }
  return false;
}
