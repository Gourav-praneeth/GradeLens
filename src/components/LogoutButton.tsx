"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="nav-item w-full text-left font-normal" type="button" onClick={onClick}>
      Sign out
    </button>
  );
}
