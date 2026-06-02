import { NextResponse, NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, authConfigured } from "@/lib/auth";

// Paths that never require a session.
const PUBLIC_PREFIXES = ["/login", "/api/auth/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  // Until Google credentials + AUTH_SECRET are configured, do not lock anyone out.
  if (!authConfigured()) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value || "";
  const user  = token ? await verifySessionToken(token) : null;

  if (user) return NextResponse.next();

  // API routes get a 401; page requests redirect to the login screen.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
