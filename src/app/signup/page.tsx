import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="login-stage">
      <div className="w-full max-w-md">
        <BrandMark />
        <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="mt-2 mb-6 text-sm text-muted">Instructors and TAs use email and a password. We send a verification link when this server can send email.</p>
        <div className="card px-5 py-6 sm:px-7">
          <SignupForm />
        </div>
        <p className="mt-4 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
