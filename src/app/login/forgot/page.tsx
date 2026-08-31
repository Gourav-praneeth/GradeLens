import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { emailEnabled } from "@/lib/mail";

export default function ForgotPasswordPage() {
  return (
    <div className="login-stage">
      <div className="w-full max-w-md">
        <BrandMark />
        <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Reset password</h1>
        <div className="card mt-6 px-5 py-6">
          {emailEnabled() ? (
            <>
              <p className="mb-4 text-sm leading-6">Enter the email on your account. We will send a reset link if it matches.</p>
              <ForgotPasswordForm />
            </>
          ) : (
            <p className="text-sm leading-6">
              This GradeLens server is not set up to send email yet. Ask a course owner to invite you as staff, or
              create a new account.
            </p>
          )}
          <div className="mt-5">
            <Link href="/login" className="btn btn-ghost">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
