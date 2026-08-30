import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentUser } from "@/lib/auth";

export default async function HelpPage() {
  const user = await getCurrentUser();
  return (
    <div className={user ? "page-wrap space-y-5" : "login-stage"}>
      <div className={user ? "space-y-5" : "w-full max-w-lg space-y-5"}>
        {user ? null : <BrandMark />}
        <h1 className="font-read text-3xl font-semibold tracking-tight">Help</h1>
        <section className="card px-5 py-6 text-sm leading-6">
          <p>Sign in with the instructor email and password you created. University SSO is not configured in this local build.</p>
          <p className="mt-3">Password reset email is not available here. Create a new account, or ask a course owner to invite your email as a TA.</p>
          <p className="mt-3">Courses hold the roster and assignments. Open an assignment to generate a rubric, upload student work, then grade with per-criterion explanations.</p>
          {user ? null : (
            <p className="mt-4">
              <Link href="/login" className="btn btn-primary">
                Sign in
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
