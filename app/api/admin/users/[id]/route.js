import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  return await verifyToken(token);
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Chỉ super_admin mới có quyền thực hiện" }, { status: 403 });
    }

    const { id } = await params;
    const { action, password, status } = await request.json();

    const db = await getDb();
    let objId;
    try {
      objId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json({ error: "ID tài khoản không hợp lệ" }, { status: 400 });
    }

    const targetUser = await db.collection("users").findOne({ _id: objId });
    if (!targetUser) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản quản trị" }, { status: 404 });
    }

    if (action === "toggle-status") {
      // Prevent locking own account
      if (targetUser._id.toString() === session.id) {
        return NextResponse.json({ error: "Bạn không thể tự khóa tài khoản của chính mình" }, { status: 400 });
      }

      const newStatus = targetUser.status === "active" ? "locked" : "active";
      await db.collection("users").updateOne(
        { _id: objId },
        { $set: { status: newStatus, updatedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: `Đã ${newStatus === "active" ? "mở khóa" : "khóa"} tài khoản thành công`,
        status: newStatus,
      });
    }

    if (action === "reset-password") {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await db.collection("users").updateOne(
        { _id: objId },
        { $set: { passwordHash, updatedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: "Đặt lại mật khẩu thành công",
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    console.error("PUT admin action error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật tài khoản" }, { status: 500 });
  }
}
