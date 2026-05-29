"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  // Tên đăng nhập
  const [username, setUsername] = useState("");
  // Mật khẩu
  const [password, setPassword] = useState("");
  // Thông báo lỗi
  const [error, setError] = useState("");
  // Đang xử lý đăng nhập
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Xử lý submit form đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      router.refresh();
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-linear-to-br from-slate-50 to-emerald-50/20">
      <div className="w-full max-w-md">
        {/* Logo thương hiệu */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 mb-3 shadow-lg shadow-brand-primary/10 animate-success">
            <Activity className="h-8 w-8 text-brand-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-slate-800 uppercase">
            VTB Badminton
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">
            Hệ thống quản lý chuyên cần 5AM
          </p>
        </div>

        {/* Login form card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Đăng nhập quản trị
          </h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 text-sm p-3.5 rounded-xl mb-5">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-base font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-4 py-3 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-base font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-base rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 hover:shadow-brand-primary/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} VTB Badminton. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
