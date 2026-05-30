import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

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
    const pageParam = Number(searchParams.get("page") || 1);
    const pageSizeParam = Number(searchParams.get("pageSize") || 20);
    const dateFrom = (searchParams.get("dateFrom") || "").trim();
    const dateTo = (searchParams.get("dateTo") || "").trim();

    const page = Number.isFinite(pageParam) ? Math.max(pageParam, 1) : 1;
    const pageSize = Number.isFinite(pageSizeParam) ? Math.min(Math.max(pageSizeParam, 1), 100) : 20;
    const skip = (page - 1) * pageSize;

    const query = {};
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = dateFrom;
      if (dateTo) query.date.$lte = dateTo;
    }

    const db = await getDb();
    const total = await db.collection("payment_logs").countDocuments(query);
    const logs = await db
      .collection("payment_logs")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      logs: logs.map((log) => ({
        _id: log._id.toString(),
        date: log.date || "",
        memberNames: Array.isArray(log.memberNames) ? log.memberNames : [],
        amount: typeof log.amount === "number" ? log.amount : null,
        pendingOnly: !!log.pendingOnly,
        writeValue: log.writeValue ?? null,
        recordedBy: log.recordedBy || "unknown",
        sheetTitle: log.sheetTitle || "",
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("GET records logs API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải lịch sử nhập liệu" }, { status: 500 });
  }
}
