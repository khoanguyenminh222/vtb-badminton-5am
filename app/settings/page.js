"use client";

import { useEffect, useState } from "react";
import { Settings, Save, AlertCircle, CheckCircle2, Loader2, HelpCircle, ArrowRight } from "lucide-react";

export default function SettingsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [sheetMeta, setSheetMeta] = useState({
    tabTitle: "",
    updatedBy: "",
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings/sheet");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải cấu hình Google Sheet");
      }

      setSheetUrl(data.sheetUrl || "");
      setServiceAccountEmail(data.serviceAccountEmail || "");
      setSheetMeta({
        tabTitle: data.tabTitle || "",
        updatedBy: data.updatedBy || "",
        updatedAt: data.updatedAt || "",
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    fetchSettings();
  }, []);

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
        throw new Error(data.error || "Không thể lưu cấu hình Google Sheet");
      }

      setSheetUrl(data.sheetUrl || sheetUrl);
      setSheetMeta((prev) => ({
        ...prev,
        tabTitle: data.tabTitle || prev.tabTitle,
        updatedBy: data.updatedBy || prev.updatedBy,
        updatedAt: data.updatedAt || prev.updatedAt,
      }));
      setMessage({ type: "success", text: "Đã lưu cấu hình Google Sheet thành công!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Cấu hình Sheet</h1>
          <p className="text-xs sm:text-sm text-slate-655 mt-0.5">Quản lý link Google Sheet hiện hành</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Link Sheet Hiện Hành</h2>

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
                Mẹo: sang tháng mới, mở tab tháng mới trên Google Sheet rồi dán URL vào đây.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs sm:text-sm text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-800">Thông tin nhận diện sheet hiện hành</p>
              <p>
                Tên tab đang dùng: <span className="font-semibold">{sheetMeta.tabTitle || "-"}</span>
              </p>
              <p>
                Người cập nhật gần nhất: <span className="font-semibold">{sheetMeta.updatedBy || "-"}</span>
              </p>
              <p>
                Thời điểm cập nhật: <span className="font-semibold">{formatDateTime(sheetMeta.updatedAt)}</span>
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

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800">
            <HelpCircle className="h-5 w-5 text-brand-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Hướng dẫn chia sẻ quyền Google Sheet</h3>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            <p>Để hệ thống có quyền ghi chép dữ liệu lên file Google Sheet của bạn, vui lòng làm theo các bước sau:</p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Mở file Google Sheet của bạn.</li>
              <li>Click nút <strong className="text-slate-800 font-bold">Chia sẻ (Share)</strong> góc trên bên phải.</li>
              <li>
                Thêm email Google Service Account bên dưới với quyền <strong className="text-brand-primary font-bold">Editor</strong>:
                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 select-all font-mono break-all text-xs font-bold shadow-2xs">
                  {serviceAccountEmail || "Email Service Account chưa được cài đặt trong .env.local"}
                </div>
              </li>
              <li>Bỏ chọn gửi thông báo và bấm <strong className="text-slate-800 font-bold">Share</strong>.</li>
            </ol>
            <div className="p-3.5 bg-brand-primary/5 border border-brand-primary/15 rounded-xl text-slate-700 flex items-start gap-2.5">
              <ArrowRight className="h-4.5 w-4.5 shrink-0 text-brand-primary mt-0.5" />
              <span>
                <strong className="text-slate-800">Lưu ý cấu trúc sheet:</strong> Hệ thống tìm cột ngày ở hàng 2 và cột tên ở cột B.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
