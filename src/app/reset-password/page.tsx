import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return (
    <div className="login-stage">
      <div className="w-full max-w-md">
        <BrandMark />
        <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Choose a new password</h1>
        <div className="card mt-6 px-5 py-6">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm leading-6">This reset link is missing a token. Use the latest email we sent.</p>
          )}
          <p className="mt-4 text-sm text-muted">
            <Link href="/login" className="underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
