import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { normalizePermissions } from "@/lib/permissions";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const session = await verifyToken(token);

    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        userId: session.userId,
        username: session.username,
        role: session.role,
        permissions: normalizePermissions(session.permissions, session.role),
      },
    });
  } catch (error) {
    console.error("Get current user API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
