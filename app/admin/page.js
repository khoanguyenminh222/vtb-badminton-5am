"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Lock, Unlock, Key, AlertCircle, CheckCircle2, Loader2, RefreshCw, X, Eye, EyeOff } from "lucide-react";

const PERMISSION_OPTIONS = [
  { key: "records", label: "Nhập liệu", icon: "📝" },
  { key: "logs", label: "Lịch sử", icon: "📋" },
  { key: "settings", label: "Cấu hình Sheet", icon: "⚙️" },
  { key: "adminUsers", label: "Quản trị admin", icon: "👑" },
];

const DEFAULT_ADMIN_PERMISSIONS = {
  records: true,
  logs: true,
  settings: false,
  adminUsers: false,
};

// ===================== MODAL COMPONENTS =====================

function ModalOverlay({ children, onClose }) {
  // Close on backdrop click
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đặt lại mật khẩu");
      onSuccess("Đã đặt lại mật khẩu thành công!");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
              <Key className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Đặt lại mật khẩu</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tài khoản: <span className="font-semibold text-slate-700">{user.username}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự..."
                autoFocus
                className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-medium"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || password.length < 6}
              className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

function PermissionsModal({ user, onClose, onSuccess }) {
  const [draft, setDraft] = useState({ ...DEFAULT_ADMIN_PERMISSIONS, ...(user.permissions || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-permissions", permissions: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật phân quyền");
      onSuccess(data.message || "Cập nhật phân quyền thành công");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const allEnabled = PERMISSION_OPTIONS.every((p) => draft[p.key]);
  const toggleAll = () => {
    const next = !allEnabled;
    setDraft(Object.fromEntries(PERMISSION_OPTIONS.map((p) => [p.key, next])));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
              <Shield className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Phân quyền</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tài khoản: <span className="font-semibold text-slate-700">{user.username}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quyền truy cập</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-brand-primary font-bold hover:underline cursor-pointer"
            >
              {allEnabled ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>

          <div className="space-y-2">
            {PERMISSION_OPTIONS.map((perm) => {
              const enabled = !!draft[perm.key];
              return (
                <label
                  key={perm.key}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all select-none ${enabled
                      ? "bg-brand-primary/5 border-brand-primary/30 text-slate-800"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${enabled ? "bg-brand-primary border-brand-primary" : "border-slate-300 bg-white"
                    }`}>
                    {enabled && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={enabled}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [perm.key]: e.target.checked }))}
                  />
                  <span className="text-lg">{perm.icon}</span>
                  <span className="text-sm font-semibold">{perm.label}</span>
                  {enabled && (
                    <span className="ml-auto text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                      Bật
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
              ) : (
                "Lưu phân quyền"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ===================== MAIN PAGE =====================

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, type: "", text: "" });

  // Form thêm user
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  // Search / filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [editPermissionsUser, setEditPermissionsUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    setTimeout(() => {
      setToast((prev) => (prev.text === text ? { ...prev, show: false } : prev));
    }, 4000);
  };

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(
          (data || []).map((user) => ({
            ...user,
            permissions:
              user.role === "super_admin"
                ? { records: true, logs: true, settings: true, adminUsers: true }
                : { ...DEFAULT_ADMIN_PERMISSIONS, ...(user.permissions || {}) },
          }))
        );
      } else {
        throw new Error(data.error || "Không thể tải danh sách tài khoản");
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (addingUser) return;
    setAddingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, permissions: DEFAULT_ADMIN_PERMISSIONS }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo tài khoản");
      showToast("success", `Đã tạo tài khoản admin "${newUsername}" thành công!`);
      setNewUsername("");
      setNewPassword("");
      fetchUsers();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-status" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật trạng thái");
      showToast("success", data.message);
      fetchUsers();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleModalSuccess = (text) => {
    showToast("success", text);
    fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch = !search.trim() || user.username.toLowerCase().includes(search.trim().toLowerCase());
    const matchStatus = statusFilter === "all" || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const activeAdmins = users.filter((u) => u.role === "admin" && u.status === "active").length;
  const lockedAdmins = users.filter((u) => u.role === "admin" && u.status === "locked").length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-655 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <span>Đang tải thông tin tài khoản admin...</span>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {resetPasswordUser && (
        <ResetPasswordModal
          user={resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {editPermissionsUser && (
        <PermissionsModal
          user={editPermissionsUser}
          onClose={() => setEditPermissionsUser(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Tổng admin</p>
            <p className="mt-1 text-xl font-extrabold text-slate-800">{totalAdmins}</p>
          </div>
          <div className="glass-card rounded-xl p-3.5 border border-emerald-250/60">
            <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">Hoạt động</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700">{activeAdmins}</p>
          </div>
          <div className="glass-card rounded-xl p-3.5 border border-red-250/60">
            <p className="text-[11px] uppercase tracking-wider text-red-700 font-bold">Đã khóa</p>
            <p className="mt-1 text-xl font-extrabold text-red-700">{lockedAdmins}</p>
          </div>
        </div>

        {/* 2-col layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Admin Card */}
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
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    disabled={addingUser}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự..."
                    className="w-full px-4 py-2.5 pr-10 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-medium"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={addingUser}
                className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 hover:shadow-brand-primary/30"
              >
                {addingUser ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Đang tạo...</>
                ) : (
                  "Tạo tài khoản"
                )}
              </button>
            </form>
          </div>

          {/* Admin List */}
          <div className="md:col-span-2">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Danh sách quản trị viên ({filteredUsers.length}/{users.length})
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo username..."
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary/60"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-primary/60"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="locked">Đã khóa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="rounded-xl bg-white/60 border border-slate-150 p-3.5"
                  >
                    {/* Top row: avatar + info + actions */}
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs shrink-0">
                          <Shield className={`h-5 w-5 ${user.role === "super_admin" ? "text-brand-primary animate-pulse" : "text-slate-400"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">{user.username}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${user.role === "super_admin"
                                ? "bg-brand-primary/10 border-brand-primary/25 text-emerald-700"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}>
                              {user.role}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${user.status === "active"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-red-50 border-red-200 text-red-700"
                              }`}>
                              {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </div>

                          {/* Permission badges */}
                          {user.role !== "super_admin" && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {PERMISSION_OPTIONS.map((perm) => {
                                const enabled = !!user.permissions?.[perm.key];
                                return (
                                  <span
                                    key={perm.key}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold ${enabled
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : "bg-slate-50 border-slate-200 text-slate-400"
                                      }`}
                                  >
                                    {perm.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons — always visible, no scroll needed */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Reset Password */}
                        <button
                          onClick={() => setResetPasswordUser(user)}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 bg-white rounded-xl transition-all cursor-pointer shadow-2xs"
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="h-4 w-4" />
                        </button>

                        {/* Edit Permissions */}
                        {user.role !== "super_admin" && (
                          <button
                            onClick={() => setEditPermissionsUser(user)}
                            className="p-2 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/5 border border-slate-200 hover:border-brand-primary/30 bg-white rounded-xl transition-all cursor-pointer shadow-2xs"
                            title="Phân quyền"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        )}

                        {/* Toggle Lock */}
                        {user.role !== "super_admin" && (
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`p-2 border rounded-xl transition-all cursor-pointer shadow-2xs ${user.status === "active"
                                ? "text-red-500 hover:text-red-700 hover:bg-red-50 border-slate-200 hover:border-red-200 bg-white"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 bg-white"
                              }`}
                            title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.status === "active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <p className="text-sm text-slate-500 font-medium py-6 text-center">
                    Không có tài khoản phù hợp bộ lọc.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-100 animate-success w-full max-w-sm px-4">
          <div
            className={`flex items-start gap-2.5 border text-sm p-4 rounded-xl shadow-xl backdrop-blur-md ${toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-300 text-emerald-800"
                : "bg-red-50/95 border-red-300 text-red-800"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            )}
            <div className="flex-1">
              <p className="font-bold text-xs uppercase tracking-wider mb-0.5">
                {toast.type === "success" ? "Thành công" : "Thông báo lỗi"}
              </p>
              <p className="font-semibold text-xs leading-relaxed">{toast.text}</p>
            </div>
            <button
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
