import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "public", "vtb-badminton-5am-app.apk");
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="vtb-badminton-5am-app.apk"',
        "Content-Length": fileBuffer.length,
      },
    });
  } catch (error) {
    console.error("APK download error:", error);
    return NextResponse.json({ error: "Không thể tải file APK" }, { status: 500 });
  }
}
