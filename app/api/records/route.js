import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { recordPayments, checkExistingPayments } from "@/lib/sheets";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  return await verifyToken(token);
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { date, memberIds, amount, checkOnly, pendingOnly } = await request.json();

    // 1. Validation
    if (!date) {
      return NextResponse.json({ error: "Vui lòng chọn ngày ghi nhận" }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một thành viên" }, { status: 400 });
    }

    let writeValue = "CHO_THU";
    let numericAmount = null;

    if (!pendingOnly) {
      numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
      }
      writeValue = numericAmount;
    }

    const db = await getDb();

    // 2. Fetch current sheetUrl setting
    const setting = await db.collection("settings").findOne({ key: "sheet_url_current" });
    if (!setting || !setting.value) {
      return NextResponse.json(
        { error: "Google Sheet URL chưa được cấu hình. Vui lòng cấu hình trước." },
        { status: 400 }
      );
    }

    const sheetUrl = setting.value;

    // 3. Retrieve member details
    let objectIds;
    try {
      objectIds = memberIds.map((id) => new ObjectId(id));
    } catch (e) {
      return NextResponse.json({ error: "ID thành viên không hợp lệ" }, { status: 400 });
    }

    const members = await db
      .collection("members")
      .find({ _id: { $in: objectIds } })
      .toArray();

    if (members.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy thành viên tương ứng" }, { status: 400 });
    }

    // 4. Sync to Google Sheets
    try {
      if (checkOnly === true) {
        const checkResult = await checkExistingPayments(sheetUrl, date, members);
        return NextResponse.json({
          success: true,
          hasExistingData: checkResult.hasExistingData,
          existingMembers: checkResult.existingMembers,
        });
      }

      const result = await recordPayments(sheetUrl, date, members, writeValue);
      const mentionText = members.map((m) => `@${m.displayName}`).join(", ");

      // Save log in db for tracking
      await db.collection("payment_logs").insertOne({
        date,
        memberIds: members.map((m) => m._id.toString()),
        memberNames: members.map((m) => m.displayName),
        amount: numericAmount,
        pendingOnly: !!pendingOnly,
        writeValue,
        mentionText,
        sheetUrl,
        sheetTitle: result.sheetTitle,
        recordedBy: session.username,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        pendingOnly: !!pendingOnly,
        mentionText,
        message: pendingOnly
          ? `Đã điểm danh tạm cho ${members.length} thành viên vào tab "${result.sheetTitle}".`
          : `Đã ghi nhận thành công cho ${members.length} thành viên vào tab "${result.sheetTitle}"`,
      });
    } catch (sheetError) {
      console.error("Google Sheet write error:", sheetError);
      return NextResponse.json(
        {
          error: `Lỗi ghi Google Sheet: ${sheetError.message || "Vui lòng kiểm tra quyền của Service Account đối với Sheet."}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST records API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi ghi nhận thanh toán" }, { status: 500 });
  }
}
