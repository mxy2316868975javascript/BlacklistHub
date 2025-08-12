import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// 公共路径（不需要登录）
const PUBLIC_PATHS = ["/", "/login", "/api/auth/login", "/api/auth/register", "/_next", "/public"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies.get("token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ message: "Unauthorized(no-token)" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    // debug logs
    console.log("[middleware] verifying token, hasSecret=", Boolean(process.env.JWT_SECRET), "tokenPrefix=", token.slice(0, 10));
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (e) {
    console.warn("[middleware] jwt verify failed", String(e));
    if (pathname.startsWith("/api/")) return NextResponse.json({ message: "Unauthorized(bad-token)" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/blacklist/:path*", "/api/blacklist/:path*", "/api/stats"],
};

