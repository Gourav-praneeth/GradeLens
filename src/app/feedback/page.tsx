import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/FeedbackForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="page-wrap space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Feedback</h1>
      <p className="text-sm text-muted">
        Your note is stored privately for the site admin. Other instructors cannot see it.
      </p>
      <section className="card px-5 py-6">
        <FeedbackForm />
      </section>
    </div>
  );
}
