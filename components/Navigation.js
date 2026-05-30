"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, Settings, Users, LogOut, History } from "lucide-react";
import { useState } from "react";

export default function Navigation({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.refresh();
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { href: "/", label: "Nhập liệu", icon: ClipboardList },
    { href: "/logs", label: "Lịch sử", icon: History },
    { href: "/settings", label: "Cấu hình", icon: Settings },
  ];

  if (user.role === "super_admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: Users });
  }

  return (
    <>
      <header className="hidden sm:flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain rounded-lg" />
          <span className="font-bold text-lg tracking-wider text-slate-800 uppercase">VTB Badminton</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-semibold">5AM</span>
        </div>

        <nav className="flex items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-bold transition-all py-1.5 px-3.5 rounded-lg border ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "text-slate-600 border-transparent hover:text-emerald-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Xin chào,</p>
            <p className="text-sm font-bold text-slate-800">{user.username}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 text-slate-550 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <header className="sm:hidden flex items-center justify-between px-5 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain rounded-md" />
          <span className="font-bold text-base tracking-wider text-slate-800 uppercase">VTB Badminton 5AM</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 text-slate-550 hover:text-red-650 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
          title="Đăng xuất"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </header>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 pb-safe shadow-lg shadow-slate-100">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                  isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-5.5 w-5.5 transition-transform ${isActive ? "scale-110" : ""}`} />
                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}