import { notFound, redirect } from "next/navigation";
import { InviteTaForm, RemoveMemberButton } from "@/components/TaForms";
import { getCourseMembership, isOwner } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { courseRoleLabel } from "@/lib/courseOptions";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function StaffPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const member = await getCourseMembership(user.id, id);
  if (!member) notFound();
  const owner = isOwner(member.role);
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      members: { include: { user: true }, orderBy: { role: "asc" } },
      invites: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!course) notFound();

  return (
    <div className="space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Teaching staff</h1>
      <section className="card px-5 py-6">
        {owner ? <InviteTaForm courseId={course.id} /> : <p className="text-sm text-muted">Only the course instructor can add TAs.</p>}
        <ul className="mt-4 divide-y border-t border-line">
          {course.members.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{row.user.name}</p>
                <p className="text-sm text-muted">
                  {row.user.email} · {courseRoleLabel(row.role)}
                </p>
              </div>
              {owner && row.role !== "owner" ? <RemoveMemberButton courseId={course.id} memberId={row.id} /> : null}
            </li>
          ))}
          {course.invites.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-sm text-muted">Invite pending</p>
              </div>
              {owner ? <RemoveMemberButton courseId={course.id} inviteId={invite.id} /> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
