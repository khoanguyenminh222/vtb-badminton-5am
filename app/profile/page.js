"use client";

import { useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data?.user?.username) {
          setUsername(data.user.username);
        }
      } catch {
        setUsername("");
      }
    };

    loadCurrentUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changingPassword) return;
    setPasswordMessage({ type: "", text: "" });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể đổi mật khẩu");

      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMessage({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.message || "Lỗi hệ thống" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
          <User className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Thông tin cá nhân</h1>
          <p className="text-xs sm:text-sm text-slate-655 mt-0.5">Quản lý tài khoản và bảo mật</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <p className="text-sm text-slate-600">
          Tài khoản đang đăng nhập: <span className="font-bold text-slate-800">{username || "..."}</span>
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Đổi Mật Khẩu</h2>
          </div>
          {!showPasswordForm && (
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(true);
                setPasswordMessage({ type: "", text: "" });
              }}
              className="px-3.5 py-2 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              Mở Form
            </button>
          )}
        </div>

        {showPasswordForm && (
          <>
            {passwordMessage.text && (
              <div
                className={`flex items-start gap-2.5 border text-sm p-4 rounded-xl mb-5 ${passwordMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                    : "bg-red-50 border-red-250 text-red-800"
                  }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                )}
                <span className="font-semibold">{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                ["current", "Mật khẩu hiện tại", currentPassword, setCurrentPassword],
                ["new", "Mật khẩu mới", newPassword, setNewPassword],
                ["confirm", "Xác nhận mật khẩu mới", confirmPassword, setConfirmPassword],
              ].map(([key, label, value, setter]) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key] ? "text" : "password"}
                      required
                      disabled={changingPassword}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full px-4 py-3 pr-10 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordMessage({ type: "", text: "" });
                  }}
                  disabled={changingPassword}
                  className="px-4 py-2 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center gap-2 hover:shadow-brand-primary/30"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang đổi...
                    </>
                  ) : (
                    "Đổi Mật Khẩu"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
