"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { initials } from "@/lib/display";

export function UserMenu({ user, isAdmin = false }: { user: AuthUser; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="user-menu">
      <button
        type="button"
        className="avatar-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar">{initials(user.name)}</span>
        <span className="hidden sm:inline">{user.name}</span>
      </button>
      {open ? (
        <UserMenuPanel user={user} isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

export function UserMenuPanel({
  user,
  isAdmin = false,
  onNavigate,
}: {
  user: AuthUser;
  isAdmin?: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="user-menu-panel" role="menu">
      <p className="px-3 py-2 text-xs text-muted">{user.email}</p>
      <Link href="/feedback" className="nav-item" onClick={onNavigate}>
        Feedback
      </Link>
      {isAdmin ? (
        <Link href="/admin/feedback" className="nav-item" onClick={onNavigate}>
          Inbox
        </Link>
      ) : null}
      <Link href="/account" className="nav-item" onClick={onNavigate}>
        Account
      </Link>
      <form action="/api/auth/logout" method="post" className="mt-1 border-t border-line pt-1">
        <LogoutMenuItem />
      </form>
    </div>
  );
}

function LogoutMenuItem() {
  return (
    <button
      className="nav-item w-full text-left font-normal"
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
