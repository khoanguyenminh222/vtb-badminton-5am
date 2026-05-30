import Link from "next/link";
import { SearchX, House } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-slate-50 to-emerald-50/20">
      <div className="w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-1">
          <img src="/logo.png" alt="VTB Badminton Logo" className="h-full w-full object-contain rounded-xl" />
        </div>

        {/* <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <SearchX className="h-7 w-7 text-emerald-600" />
        </div> */}

        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">404</p>
        <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-800">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2"
          >
            <House className="h-4 w-4" />
            Về trang chính
          </Link>
        </div>
      </div>
    </div>
  );
}
