"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Lock, Unlock, Key, AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export default function AdminPage() {
  // Danh sách người dùng
  const [users, setUsers] = useState([]);
  // Đang tải trang
  const [loading, setLoading] = useState(true);
  // Đang làm mới danh sách
  const [refreshing, setRefreshing] = useState(false);
  // Thông báo cho người dùng
  const [message, setMessage] = useState({ type: "", text: "" });

  // ========== TRẠNG THÁI FORM THÊM NGƯỜI DÙNG ==========
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // ========== TRẠNG THÁI HỘP THOẠI/NỘI TUYẾN ĐẶT LẠI MẬT KHẨU ==========
  const [resettingUserId, setResettingUserId] = useState(null);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Tải danh sách người dùng từ server
  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data || []);
      } else {
        throw new Error(data.error || "Không thể tải danh sách tài khoản");
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Xử lý tạo người dùng mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (addingUser) return;
    setMessage({ type: "", text: "" });
    setAddingUser(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi tạo tài khoản");
      }

      setMessage({ type: "success", text: `Đã tạo tài khoản admin "${newUsername}" thành công!` });
      setNewUsername("");
      setNewPassword("");
      fetchUsers();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setAddingUser(false);
    }
  };

  const handleToggleStatus = async (userId, username) => {
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-status" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi cập nhật trạng thái");
      }

      setMessage({ type: "success", text: data.message });
      fetchUsers();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (submittingReset) return;
    setMessage({ type: "", text: "" });
    setSubmittingReset(true);

    try {
      const res = await fetch(`/api/admin/users/${resettingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", password: newAdminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi đặt lại mật khẩu");
      }

      setMessage({ type: "success", text: "Đã đặt lại mật khẩu thành công!" });
      setResettingUserId(null);
      setNewAdminPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmittingReset(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-655 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <span>Đang tải thông tin tài khoản admin...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
            <Users className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 font-sans">Quản trị Admin</h1>
            <p className="text-xs sm:text-sm text-slate-655 mt-0.5 font-medium">
              Tạo mới, reset mật khẩu, khóa hoặc mở khóa tài khoản admin
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={refreshing}
          className="p-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? "animate-spin text-brand-primary" : ""}`} />
        </button>
      </div>

      {message.text && (
        <div
          className={`flex items-start gap-2.5 border text-sm p-4 rounded-xl ${message.type === "success"
            ? "bg-emerald-50 border-emerald-250 text-emerald-800 animate-success"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create new Admin Card */}
        <div className="glass-card rounded-2xl p-5 md:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Thêm Admin mới</h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Tên đăng nhập
              </label>
              <input
                type="text"
                required
                disabled={addingUser}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Ví dụ: admin_nam"
                className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                disabled={addingUser}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự..."
                className="w-full px-4 py-2.5 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={addingUser}
              className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 hover:shadow-brand-primary/30"
            >
              {addingUser ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo tài khoản"
              )}
            </button>
          </form>
        </div>

        {/* Admin List Card */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4">
              Danh sách quản trị viên ({users.length})
            </h2>

            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl mt-0.5 shadow-2xs">
                      <Shield className={`h-5 w-5 ${user.role === "super_admin" ? "text-brand-primary animate-pulse" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{user.username}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${user.role === "super_admin"
                          ? "bg-brand-primary/10 border-brand-primary/25 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        Trạng thái:{" "}
                        <span className={user.status === "active" ? "text-emerald-600 font-bold" : "text-red-650 font-bold"}>
                          {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Reset Password Button */}
                    <button
                      onClick={() => {
                        setResettingUserId(user._id);
                        setNewAdminPassword("");
                      }}
                      className="p-2.5 text-slate-655 hover:text-emerald-700 hover:bg-slate-100 bg-slate-50 border border-slate-250 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      title="Đặt lại mật khẩu"
                    >
                      <Key className="h-4 w-4" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    {/* Toggle Status Button (Lock/Unlock) */}
                    {user.role !== "super_admin" && (
                      <button
                        onClick={() => handleToggleStatus(user._id, user.username)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-2xs ${user.status === "active"
                          ? "bg-slate-50 border-slate-250 text-red-650 hover:bg-red-50 hover:border-red-200/50"
                          : "bg-slate-50 border-slate-250 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-250/50"
                          }`}
                        title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        {user.status === "active" ? (
                          <>
                            <Lock className="h-4 w-4" />
                            <span>Khóa</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4" />
                            <span>Mở khóa</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Password Modal (Inline style) */}
          {resettingUserId && (
            <div className="glass-card border border-brand-primary/35 rounded-2xl p-5 animate-success shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-brand-primary" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Đặt lại mật khẩu cho tài khoản &quot;
                    {users.find((u) => u._id === resettingUserId)?.username}&quot;
                  </h3>
                </div>
                <button
                  onClick={() => setResettingUserId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  Hủy
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  required
                  disabled={submittingReset}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Mật khẩu mới ít nhất 6 ký tự..."
                  className="flex-1 px-4 py-2.5 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30"
                >
                  {submittingReset ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Lưu...
                    </>
                  ) : (
                    "Đặt lại mật khẩu"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
