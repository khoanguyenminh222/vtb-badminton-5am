"use client";

import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, CheckCircle2, Loader2, HelpCircle, ArrowRight, Lock, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  // URL Google Sheet
  const [sheetUrl, setSheetUrl] = useState("");
  // Email Service Account
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  // Đang tải cấu hình
  const [loading, setLoading] = useState(true);
  // Đang lưu cấu hình
  const [saving, setSaving] = useState(false);
  // Thông báo
  const [message, setMessage] = useState({ type: "", text: "" });

  // ========== TRẠNG THÁI ĐỔI MẬT KHẨU ==========
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  // Hiển thị mật khẩu
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // Tải cấu hình Google Sheet URL từ server
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/sheet");
      const data = await res.json();
      if (res.ok) {
        setSheetUrl(data.sheetUrl || "");
        setServiceAccountEmail(data.serviceAccountEmail || "");
      } else {
        throw new Error(data.error || "Không thể tải cấu hình");
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lưu cấu hình
  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setMessage({ type: "", text: "" });
    setSaving(true);

    try {
      const res = await fetch("/api/settings/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu cấu hình");
      }

      setMessage({ type: "success", text: "Đã lưu cấu hình Google Sheet thành công!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changingPassword) return;
    setPasswordMessage({ type: "", text: "" });

    // Validation
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
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể đổi mật khẩu");
      }

      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Đóng form sau 1.5 giây để người dùng kịp đọc thông báo
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMessage({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.message });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-600 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <span>Đang tải thông tin cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
          <Settings className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Cấu hình & Tài khoản</h1>
          <p className="text-xs sm:text-sm text-slate-655 mt-0.5">
            Quản lý Google Sheet và bảo mật tài khoản
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Google Sheet Setting Form Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">
            Link Sheet Hiện Hành
          </h2>

          {message.text && (
            <div
              className={`flex items-start gap-2.5 border text-sm p-4 rounded-xl mb-5 ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                  : "bg-red-50 border-red-250 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Đường dẫn Google Sheet (Spreadsheet URL)
              </label>
              <textarea
                rows={3}
                required
                disabled={saving}
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit#gid=0"
                className="w-full px-4 py-3 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-mono font-medium"
              />
              <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">
                * Mẹo: Khi chuyển sang tháng mới, hãy mở tab tháng mới trên Google Sheet, sao chép URL trên trình duyệt và dán vào đây để hệ thống tự động nhận diện tab ghi tiền mới.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center gap-2 hover:shadow-brand-primary/30"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Lưu cấu hình
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-brand-primary" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Đổi Mật Khẩu
              </h2>
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
                  className={`flex items-start gap-2.5 border text-sm p-4 rounded-xl mb-5 ${
                    passwordMessage.type === "success"
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
                {/* Mật khẩu hiện tại */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      required
                      disabled={changingPassword}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-3 pr-10 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      required
                      disabled={changingPassword}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      className="w-full px-4 py-3 pr-10 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      required
                      disabled={changingPassword}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-3 pr-10 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

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

        {/* User Guide Box */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="h-5 w-5 text-brand-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Hướng dẫn chia sẻ quyền Google Sheet</h3>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            <p>Để hệ thống có quyền ghi chép dữ liệu lên file Google Sheet của bạn, vui lòng làm theo các bước sau:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>
                Mở file Google Sheet của bạn.
              </li>
              <li>
                Click vào nút <strong className="text-slate-800 font-bold">Chia sẻ (Share)</strong> ở góc trên bên phải.
              </li>
              <li>
                Thêm email của Google Service Account bên dưới với quyền <strong className="text-brand-primary font-bold">Người chỉnh sửa (Editor)</strong>:
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 select-all font-mono break-all text-xs font-bold shadow-2xs">
                  {serviceAccountEmail || "Email Service Account chưa được cài đặt trong .env.local"}
                </div>
              </li>
              <li>
                Bỏ chọn &quot;Gửi thông báo cho mọi người&quot; (không cần thiết) và click <strong className="text-slate-800 font-bold">Chia sẻ (Share / Send)</strong>.
              </li>
            </ol>
            <div className="p-3.5 bg-brand-primary/5 border border-brand-primary/15 rounded-xl text-slate-700 flex items-start gap-2.5">
              <ArrowRight className="h-4.5 w-4.5 shrink-0 text-brand-primary mt-0.5" />
              <span>
                <strong className="text-slate-800">Lưu ý về cấu trúc sheet:</strong> Hệ thống sẽ tự tìm cột ngày ở hàng 2 và hàng thành viên ở cột B. Nếu chưa có, hệ thống sẽ tự thêm mới, do đó bạn có thể yên tâm dùng một trang tính trống hoàn toàn cho tháng mới!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
