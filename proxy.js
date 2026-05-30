import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";
import { hasPermission, normalizePermissions } from "./lib/permissions";

export async function proxy(request) {
  const token = request.cookies.get("session_token")?.value;
  const decoded = await verifyToken(token);
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (pathname === "/login") {
    if (decoded) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/api/health" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (!decoded) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Phien lam viec het han hoac chua dang nhap" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = {
    ...decoded,
    permissions: normalizePermissions(decoded.permissions, decoded.role),
  };

  if (pathname === "/api/settings/sheet" && method === "GET") {
    return NextResponse.next();
  }

  const permissionByPrefix = [
    { prefixes: ["/admin", "/api/admin"], key: "adminUsers" },
    { prefixes: ["/settings", "/api/settings"], key: "settings" },
    { prefixes: ["/logs", "/api/records/logs"], key: "logs" },
    { prefixes: ["/api/records", "/api/members"], key: "records" },
  ];

  const matchedRule = permissionByPrefix.find((rule) =>
    rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  );

  if (matchedRule && !hasPermission(session, matchedRule.key)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Khong co quyen truy cap" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && !hasPermission(session, "records")) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|vercel.svg|next.svg|logo.png).*)",
  ],
};
