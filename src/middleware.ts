import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

const PUBLIC_PATHS = ["/login", "/signup", "/login/forgot", "/help", "/verify-email", "/verify-email/sent", "/reset-password"];
const KEEP_LOGGED_IN_PUBLIC = ["/help", "/verify-email", "/verify-email/sent", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/health";
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token && !isPublic) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (token && PUBLIC_PATHS.includes(pathname) && !KEEP_LOGGED_IN_PUBLIC.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
