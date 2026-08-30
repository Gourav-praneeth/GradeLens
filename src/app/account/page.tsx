import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="page-wrap space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Account</h1>
      <section className="card px-5 py-6">
        <p className="font-semibold">{user.name}</p>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <div className="mt-5 max-w-xs">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
