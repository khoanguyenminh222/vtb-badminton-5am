import { NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export async function proxy(request) {
  // Lấy session token từ cookies
  const token = request.cookies.get("session_token")?.value;
  // Xác minh token
  const decoded = await verifyToken(token);

  const { pathname } = request.nextUrl;

  // 1. Chuyển hướng người dùng đã đăng nhập ra khỏi trang /login
  if (pathname === "/login") {
    if (decoded) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 2. Cho phép các endpoint kiểm tra sức khỏe và xác thực đi qua
  if (pathname === "/api/health" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 3. Xác thực các route khác
  if (!decoded) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Phiên làm việc hết hạn hoặc chưa đăng nhập" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Kiểm tra quyền truy cập chỉ dành cho super_admin
  if (pathname === "/admin" || pathname.startsWith("/api/admin")) {
    if (decoded.role !== "super_admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn yêu cầu ngoại trừ:
     * - _next/static (tệp tĩnh)
     * - _next/image (tệp tối ưu hóa hình ảnh)
     * - favicon.ico, vercel.svg, next.svg (biểu tượng/logo tĩnh)
     */
    "/((?!_next/static|_next/image|favicon.ico|vercel.svg|next.svg|logo.png).*)",
  ],
};
