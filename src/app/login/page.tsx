import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-stage">
      <div className="w-full max-w-md">
        <BrandMark />
        <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 mb-6 text-sm text-muted">Instructor workspace for courses, rosters, and explained grading.</p>
        <div className="card px-5 py-6 sm:px-7 sm:py-7">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className="text-ink underline">
            Create one
          </Link>
          {" · "}
          <Link href="/help" className="hover:underline">
            Account help
          </Link>
        </p>
      </div>
    </div>
  );
}
