import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function ForgotPasswordPage() {
  return (
    <div className="login-stage">
      <div className="w-full max-w-md">
        <BrandMark />
        <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Reset password</h1>
        <div className="card mt-6 px-5 py-6">
          <p className="text-sm leading-6">
            This local GradeLens build does not send email. Ask a course owner to add you as a TA, or create a new
            account from the sign-up page.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/login" className="btn btn-primary">
              Back to sign in
            </Link>
            <Link href="/help" className="btn btn-ghost">
              Account help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
