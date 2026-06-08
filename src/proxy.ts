import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/lib/session-token";

// Lightweight gate: bounce cookie-less requests to /login before they hit a
// protected page. Full JWT verification still happens in the (app) layout.
const PROTECTED = [
  "/dashboard",
  "/reports",
  "/customers",
  "/jobs",
  "/schedule",
  "/contracts",
  "/estimates",
  "/invoices",
  "/inventory",
  "/settings",
  "/field",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reports/:path*",
    "/customers/:path*",
    "/jobs/:path*",
    "/schedule/:path*",
    "/contracts/:path*",
    "/estimates/:path*",
    "/invoices/:path*",
    "/inventory/:path*",
    "/settings/:path*",
    "/field/:path*",
  ],
};
