import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { ResendVerificationForm } from "@/components/ResendVerificationForm";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ email?: string }> };

export default async function VerifyEmailSentPage({ searchParams }: PageProps) {
  const { email = "" } = await searchParams;
  return (
    <div className="login-stage">
      <div className="w-full max-w-md">
        <BrandMark />
        <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Check your email</h1>
        <div className="card mt-6 px-5 py-6">
          <p className="text-sm leading-6">
            We sent a verification link to your address. Open it to finish creating your account. The link expires in
            48 hours.
          </p>
          <div className="mt-5">
            <ResendVerificationForm email={email} />
          </div>
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
