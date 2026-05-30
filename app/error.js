"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, House } from "lucide-react";

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-slate-50 to-red-50/20">
      <div className="w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-1">
          <img src="/logo.png" alt="VTB Badminton Logo" className="h-full w-full object-contain rounded-xl" />
        </div>

        {/* <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div> */}

        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Đã xảy ra lỗi</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hệ thống gặp sự cố khi xử lý trang này. Vui lòng thử lại.
        </p>

        <div className="mt-4 text-left bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">Chi tiết lỗi</p>
          <p className="text-sm text-red-900 wrap-break-word">{error?.message || "Không có thông tin lỗi"}</p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => unstable_retry()}
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCcw className="h-4 w-4" />
            Thử lại
          </button>

          <Link
            href="/"
            className="px-4 py-2.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <House className="h-4 w-4" />
            Về trang chính
          </Link>
        </div>
      </div>
    </div>
  );
}
