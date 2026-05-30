"use client";
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { History, Loader2, AlertCircle, ChevronLeft, ChevronRight, Filter } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [recordedBy, setRecordedBy] = useState("");
  const [memberName, setMemberName] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, pageSize: 20 });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const formatCurrency = (value) => {
    if (typeof value !== "number") return "THAM GIA";
    return new Intl.NumberFormat("vi-VN").format(value) + "d";
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  async function fetchLogs(
    nextPage = 1,
    {
      nextDateFrom = dateFrom,
      nextDateTo = dateTo,
      nextRecordedBy = recordedBy,
      nextMemberName = memberName,
      nextCreatedFrom = createdFrom,
      nextCreatedTo = createdTo,
      nextPageSize = pageSize,
    } = {}
  ) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });

      if (nextDateFrom) params.set("dateFrom", nextDateFrom);
      if (nextDateTo) params.set("dateTo", nextDateTo);
      if (nextRecordedBy) params.set("recordedBy", nextRecordedBy);
      if (nextMemberName) params.set("memberName", nextMemberName);
      if (nextCreatedFrom) params.set("createdFrom", new Date(nextCreatedFrom).toISOString());
      if (nextCreatedTo) params.set("createdTo", new Date(nextCreatedTo).toISOString());

      const res = await fetch(`/api/records/logs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể tải lịch sử nhập liệu");
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setMeta({
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        pageSize: data.pageSize || nextPageSize,
      });
      setPage(data.page || nextPage);
      setPageSize(data.pageSize || nextPageSize);
    } catch (err) {
      setError(err.message);
      setLogs([]);
      setMeta({ total: 0, totalPages: 1, pageSize: nextPageSize });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(1, {
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
      nextRecordedBy: recordedBy,
      nextMemberName: memberName,
      nextCreatedFrom: createdFrom,
      nextCreatedTo: createdTo,
      nextPageSize: pageSize,
    });
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setRecordedBy("");
    setMemberName("");
    setCreatedFrom("");
    setCreatedTo("");
    fetchLogs(1, {
      nextDateFrom: "",
      nextDateTo: "",
      nextRecordedBy: "",
      nextMemberName: "",
      nextCreatedFrom: "",
      nextCreatedTo: "",
      nextPageSize: pageSize,
    });
  };

  const canPrev = page > 1;
  const canNext = page < meta.totalPages;
  const startItem = meta.total === 0 ? 0 : (page - 1) * meta.pageSize + 1;
  const endItem = Math.min(page * meta.pageSize, meta.total);

  const buildPagination = () => {
    const totalPages = meta.totalPages;
    if (totalPages <= 1) return [1];

    const pages = new Set([1, totalPages, page - 1, page, page + 1]);
    const valid = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    const result = [];
    for (let i = 0; i < valid.length; i++) {
      const current = valid[i];
      const prev = valid[i - 1];
      if (i > 0 && current - prev > 1) result.push(`ellipsis-${i}`);
      result.push(current);
    }
    return result;
  };

  const paginationItems = buildPagination();

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
          <History className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Lịch sử nhập liệu</h1>
          <p className="text-xs sm:text-sm text-slate-655 mt-0.5">
            Theo dõi admin đã nhập liệu, thời điểm và dữ liệu ghi nhận
          </p>
        </div>
      </div>

      <form onSubmit={handleFilter} className="glass-card rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Ngày ghi nhận từ</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/60"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Ngày ghi nhận đến</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/60"
          />
        </div>

        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all"
          >
            {showAdvancedFilters ? "Ẩn bộ lọc nâng cao" : "Hiện bộ lọc nâng cao"}
          </button>
        </div>

        <div className={`${showAdvancedFilters ? "grid" : "hidden"} sm:grid sm:col-span-2 grid-cols-1 sm:grid-cols-2 gap-3`}>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Người nhập</label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="VD: admin_a"
              className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Tên thành viên (contains)</label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="VD: nam"
              className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nhập thực tế từ</label>
            <input
              type="datetime-local"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/60"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Nhập thực tế đến</label>
            <input
              type="datetime-local"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-primary/60"
            />
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Lọc
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={clearFilters}
            className="px-4 py-2.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            Xóa lọc
          </button>

        </div>
      </form>

      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="text-sm font-semibold text-slate-700">
            Tổng bản ghi: {meta.total} {meta.total > 0 ? `(hiển thị ${startItem}-${endItem})` : ""}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">Mỗi trang</label>
            <select
              value={pageSize}
              disabled={loading}
              onChange={(e) => {
                const newPageSize = Number(e.target.value);
                setPageSize(newPageSize);
                fetchLogs(1, {
                  nextDateFrom: dateFrom,
                  nextDateTo: dateTo,
                  nextRecordedBy: recordedBy,
                  nextMemberName: memberName,
                  nextCreatedFrom: createdFrom,
                  nextCreatedTo: createdTo,
                  nextPageSize: newPageSize,
                });
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-250 bg-white text-slate-700"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            disabled={!canPrev || loading}
            onClick={() =>
              fetchLogs(page - 1, {
                nextDateFrom: dateFrom,
                nextDateTo: dateTo,
                nextRecordedBy: recordedBy,
                nextMemberName: memberName,
                nextCreatedFrom: createdFrom,
                nextCreatedTo: createdTo,
                nextPageSize: pageSize,
              })
            }
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </button>

          {paginationItems.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                disabled={loading}
                onClick={() =>
                  fetchLogs(item, {
                    nextDateFrom: dateFrom,
                    nextDateTo: dateTo,
                    nextRecordedBy: recordedBy,
                    nextMemberName: memberName,
                    nextCreatedFrom: createdFrom,
                    nextCreatedTo: createdTo,
                    nextPageSize: pageSize,
                  })
                }
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${item === page
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "border-slate-250 bg-slate-50 text-slate-700"
                  }`}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-1 text-slate-400 text-xs">
                ...
              </span>
            )
          )}

          <button
            type="button"
            disabled={!canNext || loading}
            onClick={() =>
              fetchLogs(page + 1, {
                nextDateFrom: dateFrom,
                nextDateTo: dateTo,
                nextRecordedBy: recordedBy,
                nextMemberName: memberName,
                nextCreatedFrom: createdFrom,
                nextCreatedTo: createdTo,
                nextPageSize: pageSize,
              })
            }
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <span className="text-xs font-semibold text-slate-600 ml-1">Trang {page}/{meta.totalPages}</span>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 border text-sm p-4 rounded-xl mb-4 bg-red-50 border-red-250 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-600 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
            <span className="text-sm font-medium">Đang tải lịch sử...</span>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 font-medium">Không có dữ liệu phù hợp.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`rounded-xl border p-3.5 text-sm text-slate-700 ${log.duplicateMode === "overwrite"
                  ? "border-red-200 bg-red-50/30"
                  : log.duplicateMode === "skip"
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200 bg-white/70"
                  }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-bold text-slate-800">{log.recordedBy}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-semibold">{formatDateTime(log.createdAt)}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-semibold">Ngày ghi nhận: {log.date || "-"}</span>
                </div>
                <p className="mt-1 text-slate-650">
                  Thành viên: <span className="font-semibold">{(log.memberNames || []).join(", ") || "-"}</span>
                </p>
                <p className="mt-1 text-slate-650">
                  Giá trị ghi: <span className="font-semibold">{log.pendingOnly ? "THAM GIA" : formatCurrency(log.amount)}</span>
                  {log.sheetTitle ? <span className="text-slate-500"> • Tab: {log.sheetTitle}</span> : null}
                </p>
                {/* {log.duplicateMode !== "none" && (
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${log.duplicateMode === "overwrite"
                        ? "border-red-250 bg-red-50 text-red-700"
                        : "border-amber-250 bg-amber-50 text-amber-700"
                        }`}
                    >
                      Chống trùng: {log.duplicateMode === "overwrite" ? "Ghi đè" : "Bỏ qua"}
                    </span>
                  </div>
                )} */}
                {Array.isArray(log.skippedMembers) && log.skippedMembers.length > 0 && (
                  <p className="mt-1 text-amber-700 text-xs font-semibold">
                    Đã bỏ qua trùng: {log.skippedMembers.join(", ")}
                  </p>
                )}
                {Array.isArray(log.overwrittenMembers) && log.overwrittenMembers.length > 0 && (
                  <p className="mt-1 text-red-700 text-xs font-semibold">
                    Đã ghi đè: {log.overwrittenMembers.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
