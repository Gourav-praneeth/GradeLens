import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/FeedbackForm";
import { FeedbackInbox } from "@/components/FeedbackInbox";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSiteOperator } from "@/lib/siteOperator";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const operator = await isSiteOperator(user);
  const inbox = operator
    ? await prisma.feedback.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="page-wrap space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Feedback</h1>
      <p className="text-sm text-muted">Tell us about a bug, a confusing step, or something grading got wrong.</p>
      <section className="card px-5 py-6">
        <FeedbackForm />
      </section>
      {operator ? (
        <section className="card px-5 py-6">
          <h2 className="font-semibold">Inbox</h2>
          <p className="mt-1 mb-4 text-sm text-muted">Only you can see reports from every instructor and TA.</p>
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
      ) : null}
    </div>
  );
}
