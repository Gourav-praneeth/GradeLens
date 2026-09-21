import { fetchCanvasStudents, type CanvasStudent } from "./canvas";
import { requireCanvasCredentials } from "./canvasCredentials";
import { prisma } from "./db";

export type CanvasSyncResult = {
  added: number;
  updated: number;
  unchanged: number;
  inactivated: number;
  totalActive: number;
  syncedAt: string;
};

type ExistingStudent = {
  id: string;
  name: string;
  email: string | null;
  studentNumber: string | null;
  canvasUserId: string | null;
  rosterSource: string;
  enrollmentStatus: string;
};

type StudentUpdate = {
  id: string;
  data: {
    name: string;
    email: string | null;
    studentNumber: string | null;
    canvasUserId: string;
    rosterSource: "canvas";
    enrollmentStatus: "active";
  };
};

export function planCanvasRosterSync(
  existing: ExistingStudent[],
  incoming: CanvasStudent[],
) {
  const claimed = new Set<string>();
  const incomingIds = new Set(incoming.map((student) => student.canvasUserId));
  const updates: StudentUpdate[] = [];
  const creates: CanvasStudent[] = [];
  let unchanged = 0;

  for (const student of incoming) {
    const match =
      existing.find(
        (candidate) =>
          !claimed.has(candidate.id) &&
          candidate.canvasUserId === student.canvasUserId,
      ) ??
      existing.find(
        (candidate) =>
          !claimed.has(candidate.id) &&
          Boolean(student.studentNumber) &&
          candidate.studentNumber === student.studentNumber,
      ) ??
      existing.find(
        (candidate) =>
          !claimed.has(candidate.id) &&
          Boolean(student.email) &&
          candidate.email?.toLowerCase() === student.email?.toLowerCase(),
      );

    if (!match) {
      creates.push(student);
      continue;
    }

    claimed.add(match.id);
    const data: StudentUpdate["data"] = {
      name: student.name,
      email: student.email ?? match.email,
      studentNumber: student.studentNumber ?? match.studentNumber,
      canvasUserId: student.canvasUserId,
      rosterSource: "canvas",
      enrollmentStatus: "active",
    };
    if (
      match.name === data.name &&
      match.email === data.email &&
      match.studentNumber === data.studentNumber &&
      match.canvasUserId === data.canvasUserId &&
      match.rosterSource === data.rosterSource &&
      match.enrollmentStatus === data.enrollmentStatus
    ) {
      unchanged += 1;
    } else {
      updates.push({ id: match.id, data });
    }
  }

  const inactivateIds = existing
    .filter(
      (student) =>
        student.rosterSource === "canvas" &&
        student.enrollmentStatus !== "inactive" &&
        !claimed.has(student.id) &&
        Boolean(student.canvasUserId) &&
        !incomingIds.has(student.canvasUserId!),
    )
    .map((student) => student.id);

  return { updates, creates, inactivateIds, unchanged };
}

export async function syncCanvasRoster(
  userId: string,
  courseId: string,
  canvasCourseId: string,
): Promise<CanvasSyncResult> {
  const credentials = await requireCanvasCredentials(userId);
  const incoming = await fetchCanvasStudents(credentials, canvasCourseId);
  if (incoming.length === 0) {
    throw new Error("Canvas returned no active students, so no roster changes were made.");
  }

  const existing = await prisma.student.findMany({
    where: { courseId },
    select: {
      id: true,
      name: true,
      email: true,
      studentNumber: true,
      canvasUserId: true,
      rosterSource: true,
      enrollmentStatus: true,
    },
  });
  const plan = planCanvasRosterSync(existing, incoming);
  const syncedAt = new Date();

  await prisma.$transaction([
    ...plan.updates.map((update) =>
      prisma.student.update({
        where: { id: update.id },
        data: update.data,
      }),
    ),
    ...plan.creates.map((student) =>
      prisma.student.create({
        data: {
          courseId,
          name: student.name,
          email: student.email,
          studentNumber: student.studentNumber,
          canvasUserId: student.canvasUserId,
          rosterSource: "canvas",
          enrollmentStatus: "active",
        },
      }),
    ),
    ...plan.inactivateIds.map((id) =>
      prisma.student.update({
        where: { id },
        data: { enrollmentStatus: "inactive" },
      }),
    ),
    prisma.course.update({
      where: { id: courseId },
      data: {
        canvasCourseId: canvasCourseId.trim(),
        canvasLastSyncedAt: syncedAt,
      },
    }),
  ]);

  return {
    added: plan.creates.length,
    updated: plan.updates.length,
    unchanged: plan.unchanged,
    inactivated: plan.inactivateIds.length,
    totalActive: incoming.length,
    syncedAt: syncedAt.toISOString(),
  };
}
