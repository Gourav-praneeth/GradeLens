import {
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3210";
const bucket = process.env.STORAGE_BUCKET || "uploads";
const prisma = new PrismaClient();
const s3 = new S3Client({ forcePathStyle: true });
const runId = randomUUID();
const email = `neon-e2e-${runId}@example.invalid`;
const password = `Neon-${runId}-Pass!`;

let cookie = "";
let userId = "";
let courseId = "";
let assignmentId = "";
let objectKey = "";

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method || "GET"} ${path} returned ${response.status}: ${body}`);
  }
  return { response, body: body ? JSON.parse(body) : null };
}

try {
  const initialHealth = await request("/api/health");
  if (!initialHealth.body?.ok || initialHealth.body.database !== "ok" || initialHealth.body.storage !== "s3") {
    throw new Error(`Unexpected health response: ${JSON.stringify(initialHealth.body)}`);
  }

  const signup = await request("/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Neon E2E", email, password }),
  });
  const setCookie = signup.response.headers.get("set-cookie");
  if (!setCookie) throw new Error("Signup did not return a session cookie.");
  cookie = setCookie.split(";", 1)[0];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Signup did not persist the user in Neon Postgres.");
  userId = user.id;

  const course = await request("/api/courses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: `Neon E2E ${runId}`, code: "E2E" }),
  });
  courseId = course.body.id;

  const assignmentForm = new FormData();
  assignmentForm.set("courseId", courseId);
  assignmentForm.set("title", "Neon integration check");
  assignmentForm.set("questionsText", "What is 2 + 2?");
  assignmentForm.set("solutionsText", "4");
  const assignment = await request("/api/assignments", {
    method: "POST",
    body: assignmentForm,
  });
  assignmentId = assignment.body.id;

  const submissionForm = new FormData();
  submissionForm.append(
    "files",
    new Blob(["The answer is 4."], { type: "text/plain" }),
    `neon-e2e-${runId}.txt`,
  );
  const upload = await request(`/api/assignments/${assignmentId}/submissions`, {
    method: "POST",
    body: submissionForm,
  });
  if (upload.body.count !== 1) throw new Error(`Expected one uploaded submission: ${upload.body}`);

  const submission = await prisma.submission.findFirst({
    where: { assignmentId },
  });
  if (!submission?.storedPath || submission.extractedText !== "The answer is 4.") {
    throw new Error("Submission metadata or extracted text was not persisted correctly.");
  }
  objectKey = submission.storedPath;

  const storedObject = await s3.send(
    new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
  );
  if (storedObject.ContentLength !== 16) {
    throw new Error(`Unexpected stored object length: ${storedObject.ContentLength}`);
  }

  await request(`/api/assignments/${assignmentId}`, { method: "DELETE" });
  assignmentId = "";
  const deletedSubmission = await prisma.submission.findFirst({ where: { storedPath: objectKey } });
  if (deletedSubmission) throw new Error("Assignment deletion did not cascade to the submission row.");

  let objectDeleted = false;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    objectDeleted = status === 404;
  }
  if (!objectDeleted) throw new Error("Assignment deletion did not remove the stored object.");
  objectKey = "";

  await request(`/api/courses/${courseId}`, { method: "DELETE" });
  courseId = "";

  const finalHealth = await request("/api/health");
  console.log(JSON.stringify({
    buildTarget: "production Next.js server",
    health: finalHealth.body,
    postgres: "signup, course, assignment, submission, cascade delete verified",
    objectStorage: "put, head, and delete verified in private uploads bucket",
    cleanup: "test assignment and course removed",
  }, null, 2));
} finally {
  if (objectKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })).catch(() => undefined);
  }
  if (courseId) {
    await prisma.course.deleteMany({ where: { id: courseId } }).catch(() => undefined);
  } else if (assignmentId) {
    await prisma.assignment.deleteMany({ where: { id: assignmentId } }).catch(() => undefined);
  }
  if (userId) {
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => undefined);
  }
  await prisma.$disconnect();
}
