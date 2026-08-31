import { notFound, redirect } from "next/navigation";
import { FeedbackInbox } from "@/components/FeedbackInbox";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSiteOperator } from "@/lib/siteOperator";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isSiteOperator(user))) notFound();

  const inbox = await prisma.feedback.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wrap space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Feedback inbox</h1>
      <p className="text-sm text-muted">Only the site admin can open this page. Reports stay in the database.</p>
      <section className="card px-5 py-6">
        <FeedbackInbox
          initial={inbox.map((row) => ({
            id: row.id,
            message: row.message,
            page: row.page,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            user: row.user,
          }))}
        />
      </section>
    </div>
  );
}
