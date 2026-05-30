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

    const { date, memberIds, amount, checkOnly, pendingOnly, duplicateMode } = await request.json();

    // 1. Validation
    if (!date) {
      return NextResponse.json({ error: "Vui lòng chọn ngày ghi nhận" }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một thành viên" }, { status: 400 });
    }

    if (
      duplicateMode !== undefined &&
      duplicateMode !== null &&
      duplicateMode !== "skip" &&
      duplicateMode !== "overwrite"
    ) {
      return NextResponse.json({ error: "duplicateMode không hợp lệ" }, { status: 400 });
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
      const checkResult = await checkExistingPayments(sheetUrl, date, members);

      if (checkOnly === true) {
        return NextResponse.json({
          success: true,
          hasExistingData: checkResult.hasExistingData,
          existingMembers: checkResult.existingMembers,
          conflicts: checkResult.conflicts,
        });
      }

      if (checkResult.hasExistingData && !duplicateMode) {
        return NextResponse.json(
          {
            error: "Phát hiện dữ liệu trùng theo thành viên/ngày",
            code: "DUPLICATE_CONFLICT",
            conflicts: checkResult.conflicts,
          },
          { status: 409 }
        );
      }

      const conflictMemberIdSet = new Set(
        (checkResult.conflicts || []).map((item) => String(item.memberId || "")).filter(Boolean)
      );

      const membersToWrite =
        duplicateMode === "skip"
          ? members.filter((m) => !conflictMemberIdSet.has(String(m._id)))
          : members;

      const skippedMembers =
        duplicateMode === "skip"
          ? (checkResult.conflicts || []).map((item) => item.memberName)
          : [];

      const overwrittenMembers =
        duplicateMode === "overwrite"
          ? (checkResult.conflicts || []).map((item) => item.memberName)
          : [];

      let sheetTitle = "";
      if (membersToWrite.length > 0) {
        const result = await recordPayments(sheetUrl, date, membersToWrite, writeValue);
        sheetTitle = result.sheetTitle;
      }

      const mentionText = members.map((m) => `@${m.displayName}`).join(", ");

      // Save log in db for tracking
      await db.collection("payment_logs").insertOne({
        date,
        memberIds: membersToWrite.map((m) => m._id.toString()),
        memberNames: membersToWrite.map((m) => m.displayName),
        amount: numericAmount,
        pendingOnly: !!pendingOnly,
        writeValue,
        mentionText,
        sheetUrl,
        sheetTitle,
        recordedBy: session.username,
        duplicateMode: duplicateMode || "none",
        skippedMembers,
        overwrittenMembers,
        conflictCount: (checkResult.conflicts || []).length,
        createdAt: new Date(),
      });

      if (duplicateMode === "overwrite" && (checkResult.conflicts || []).length > 0) {
        await db.collection("payment_audit_logs").insertMany(
          checkResult.conflicts.map((item) => ({
            action: "overwrite",
            date,
            memberId: item.memberId,
            memberName: item.memberName,
            beforeValue: item.existingValue,
            afterValue: writeValue,
            pendingOnly: !!pendingOnly,
            recordedBy: session.username,
            createdAt: new Date(),
          }))
        );
      }

      const writtenCount = membersToWrite.length;
      const skippedCount = skippedMembers.length;
      const baseMessage = pendingOnly
        ? `Đã điểm danh tạm cho ${writtenCount} thành viên${sheetTitle ? ` vào tab "${sheetTitle}"` : ""}.`
        : `Đã ghi nhận thành công cho ${writtenCount} thành viên${sheetTitle ? ` vào tab "${sheetTitle}"` : ""}`;

      const fullMessage =
        skippedCount > 0
          ? `${baseMessage} Bỏ qua ${skippedCount} bản ghi trùng.`
          : baseMessage;

      return NextResponse.json({
        success: true,
        pendingOnly: !!pendingOnly,
        duplicateMode: duplicateMode || "none",
        conflicts: checkResult.conflicts || [],
        writtenMembers: membersToWrite.map((m) => m.displayName),
        skippedMembers,
        mentionText,
        message: fullMessage,
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
