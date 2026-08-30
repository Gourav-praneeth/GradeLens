import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { UserMenu } from "./UserMenu";
import type { AuthUser } from "@/lib/auth";

export function TopBar({
  user,
  search,
}: {
  user: AuthUser;
  search?: { action: string; query?: string; placeholder?: string };
}) {
  return (
    <header className="topbar">
      <BrandMark />
      {search ? (
        <form action={search.action} className="topbar-search">
          <label className="sr-only" htmlFor="course-search">
            Search courses
          </label>
          <input
            id="course-search"
            className="field"
            name="q"
            defaultValue={search.query}
            placeholder={search.placeholder ?? "Search courses"}
          />
        </form>
      ) : (
        <div className="topbar-search" />
      )}
      <div className="topbar-actions">
        <button type="button" className="icon-btn" title="Notifications will arrive in a later release" disabled>
          Alerts
        </button>
        <Link href="/account" className="icon-btn">
          Settings
        </Link>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
