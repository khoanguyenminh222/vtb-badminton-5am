import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { normalizePermissions } from "@/lib/permissions";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  return await verifyToken(token);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Chỉ super_admin mới có quyền truy cập" }, { status: 403 });
    }

    const db = await getDb();
    const users = await db
      .collection("users")
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ username: 1 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET users API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi lấy danh sách quản trị viên" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Chỉ super_admin mới có quyền truy cập" }, { status: 403 });
    }

    const { username, password, permissions, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: "Tên đăng nhập phải chứa ít nhất 3 ký tự" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải chứa ít nhất 6 ký tự" }, { status: 400 });
    }

    const nextRole = role === "super_admin" ? "super_admin" : "admin";

    const db = await getDb();

    // Check duplicate username
    const existing = await db.collection("users").findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json(
        { error: `Tên đăng nhập "${username}" đã được sử dụng.` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      username: cleanUsername,
      passwordHash,
      role: nextRole,
      status: "active",
      permissions: normalizePermissions(permissions, nextRole),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
        permissions: newUser.permissions,
      },
    });
  } catch (error) {
    console.error("POST users API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo tài khoản quản trị" }, { status: 500 });
  }
}
