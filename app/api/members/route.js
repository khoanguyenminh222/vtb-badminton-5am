import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { normalizeName, cleanDisplayName } from "@/lib/models";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

// Helper to check authentication
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  return await verifyToken(token);
}

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const db = await getDb();
    let query = {};

    if (search.trim()) {
      query = {
        displayName: { $regex: search.trim(), $options: "i" },
      };
    }

    const members = await db
      .collection("members")
      .find(query)
      .sort({ displayName: 1 })
      .toArray();

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET members API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi lấy danh sách thành viên" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { name } = await request.json();
    const displayName = cleanDisplayName(name);

    if (!displayName) {
      return NextResponse.json({ error: "Tên thành viên không được để trống" }, { status: 400 });
    }

    const normalized = normalizeName(displayName);
    const db = await getDb();

    // Check duplicate
    const existing = await db.collection("members").findOne({ name: normalized });
    if (existing) {
      return NextResponse.json(
        { error: `Thành viên trùng tên: "${displayName}" đã tồn tại.` },
        { status: 400 }
      );
    }

    const newMember = {
      name: normalized,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("members").insertOne(newMember);

    return NextResponse.json({
      success: true,
      member: {
        _id: result.insertedId.toString(),
        ...newMember,
      },
    });
  } catch (error) {
    console.error("POST member API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi thêm thành viên" }, { status: 500 });
  }
}
