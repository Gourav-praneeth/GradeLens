import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { consumeAuthToken } from "@/lib/authTokens";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="login-stage">
        <div className="w-full max-w-md">
          <BrandMark />
          <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Verify email</h1>
          <p className="card mt-6 px-5 py-6 text-sm">This link is missing a token. Use the latest email we sent.</p>
        </div>
      </div>
    );
  }

  const user = await consumeAuthToken(token, "verify");
  if (!user) {
    return (
      <div className="login-stage">
        <div className="w-full max-w-md">
          <BrandMark />
          <h1 className="mt-8 font-read text-3xl font-semibold tracking-tight">Verify email</h1>
          <p className="card mt-6 px-5 py-6 text-sm">
            This link is invalid or has expired. Request a new verification email from the sign-in page.
          </p>
        </div>
      </div>
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
  await createSession(user.id, { remember: true });
  redirect("/");
}
