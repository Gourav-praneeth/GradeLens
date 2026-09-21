import { redirect } from "next/navigation";
import { CanvasKeyForm } from "@/components/CanvasKeyForm";
import { LlmKeyForm } from "@/components/LlmKeyForm";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { canvasCredentialStatus } from "@/lib/canvasCredentials";
import { llmKeyStatus } from "@/lib/llmKeys";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [llm, canvas] = await Promise.all([
    llmKeyStatus(user.id),
    canvasCredentialStatus(user.id),
  ]);

  return (
    <div className="page-wrap space-y-5">
      <h1 className="font-read text-3xl font-semibold tracking-tight">Account</h1>
      <section className="card px-5 py-6">
        <p className="font-semibold">{user.name}</p>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <p className="mt-2 text-sm text-mark">Email verified</p>
        <div className="mt-5 max-w-xs">
          <LogoutButton />
        </div>
      </section>
      <section className="card px-5 py-6">
        <LlmKeyForm initial={llm} />
      </section>
      <section className="card px-5 py-6">
        <CanvasKeyForm initial={canvas} />
      </section>
    </div>
  );
}
