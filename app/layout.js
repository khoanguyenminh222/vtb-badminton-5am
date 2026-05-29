import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Tải font Geist Sans
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Tải font Geist Mono
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Siêu dữ liệu của trang
export const metadata = {
  title: "VTB Badminton 5AM",
  description: "Ghi nhận chuyên cần và thu tiền cầu lông theo ngày",
};

export default async function RootLayout({ children }) {
  // Lấy session token từ cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  // Xác minh token và lấy thông tin người dùng
  const user = await verifyToken(token);

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 selection:bg-brand-primary/20 selection:text-brand-primary-hover">
        {/* Hiển thị menu điều hướng */}
        <Navigation user={user} />
        {/* pb-20 trên mobile để xóa thanh tab dưới, không có padding thêm trên desktop */}
        <main className="flex-1 flex flex-col pb-20 sm:pb-0">{children}</main>
      </body>
    </html>
  );
}
