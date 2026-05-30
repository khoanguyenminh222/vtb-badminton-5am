import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { parseSheetUrl, getSheetsClient, getSheetMeta } from "@/lib/sheets";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

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

    const db = await getDb();
    const setting = await db.collection("settings").findOne({ key: "sheet_url_current" });
    const sheetUrl = setting ? setting.value : "";
    const parsed = parseSheetUrl(sheetUrl);
    let tabTitle = "";

    if (sheetUrl && parsed?.spreadsheetId) {
      try {
        const sheetsClient = getSheetsClient();
        const meta = await getSheetMeta(sheetsClient, parsed.spreadsheetId, parsed.gid);
        tabTitle = meta?.title || "";
      } catch (sheetMetaError) {
        console.error("GET sheet meta error:", sheetMetaError);
      }
    }

    return NextResponse.json({
      sheetUrl,
      tabTitle,
      updatedBy: setting?.updatedBy || "",
      updatedAt: setting?.updatedAt ? new Date(setting.updatedAt).toISOString() : "",
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    });
  } catch (error) {
    console.error("GET setting API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải cài đặt sheet" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Chỉ super_admin hoặc admin có quyền settings mới được cập nhật
    const hasSettingsPerm =
      session.role === "super_admin" || !!session.permissions?.settings;
    if (!hasSettingsPerm) {
      return NextResponse.json({ error: "Bạn không có quyền thay đổi cấu hình sheet" }, { status: 403 });
    }

    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json({ error: "Vui lòng nhập URL Google Sheet" }, { status: 400 });
    }

    const parsed = parseSheetUrl(sheetUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Định dạng URL Google Sheet không hợp lệ. Phải chứa '/spreadsheets/d/SpreadsheetID'" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const updatedAt = new Date();
    let tabTitle = "";

    try {
      const sheetsClient = getSheetsClient();
      const meta = await getSheetMeta(sheetsClient, parsed.spreadsheetId, parsed.gid);
      tabTitle = meta?.title || "";
    } catch (sheetMetaError) {
      console.error("PUT sheet meta error:", sheetMetaError);
    }

    await db.collection("settings").updateOne(
      { key: "sheet_url_current" },
      {
        $set: {
          value: sheetUrl,
          updatedBy: session.username,
          updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      sheetUrl,
      tabTitle,
      updatedBy: session.username,
      updatedAt: updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT setting API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật cài đặt sheet" }, { status: 500 });
  }
}
