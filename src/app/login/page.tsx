import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Use your GradeLens instructor account.</p>
      <div className="card px-5 py-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-4 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="text-ink underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
