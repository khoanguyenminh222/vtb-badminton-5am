"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Plus,
  Coins,
  Search,
  Check,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export default function EntryPage() {
  const ENTRY_DRAFT_KEY = "entry_form_draft_v1";
  // ========== TRẠNG THÁI FORM CHÍNH ==========
  const [date, setDate] = useState(""); // Ngày ghi nhận
  const [selectedMembers, setSelectedMembers] = useState([]); // Danh sách thành viên được chọn
  const [amount, setAmount] = useState(20000); // Số tiền mặc định 20,000đ
  const [pendingOnly, setPendingOnly] = useState(false); // Điểm danh trước, nhập tiền sau
  const [mentionText, setMentionText] = useState(""); // Chuỗi @Tên để copy gửi Zalo

  // ========== TRẠNG THÁI TÌM KIẾM & DANH SÁCH THÀNH VIÊN ==========
  const [search, setSearch] = useState(""); // Từ khóa tìm kiếm
  const [membersList, setMembersList] = useState([]); // Danh sách thành viên từ server
  const [loadingMembers, setLoadingMembers] = useState(false); // Đang tải danh sách thành viên

  // ========== TRẠNG THÁI TẠO THÀNH VIÊN MỚI ==========
  const [newMemberName, setNewMemberName] = useState(""); // Tên thành viên mới
  const [creatingMember, setCreatingMember] = useState(false); // Đang tạo thành viên
  const [memberMessage, setMemberMessage] = useState({ type: "", text: "" }); // Thông báo tạo thành viên

  // ========== TRẠNG THÁI GỬI DỮ LIỆU ==========
  const [submitting, setSubmitting] = useState(false); // Đang gửi dữ liệu
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" }); // Thông báo gửi dữ liệu

  // ========== TRẠNG THÁI TOAST THÔNG BÁO NỔI ==========
  const [toast, setToast] = useState({ show: false, type: "", text: "" });

  // ========== TRẠNG THÁI HỘP THOẠI XÁC NHẬN TÙY BIẾN (PREMIUM MODAL) ==========
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Đồng ý",
    cancelText: "Hủy bỏ",
    onConfirm: null,
  });

  const showToast = (type, text) => {
    setToast({ show: true, type, text });
    // Tự động đóng toast sau 4 giây
    setTimeout(() => {
      setToast((prev) => (prev.text === text ? { ...prev, show: false } : prev));
    }, 4000);
  };

  const clearDraft = () => {
    localStorage.removeItem(ENTRY_DRAFT_KEY);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    setDate(`${yyyy}-${mm}-${dd}`);
    setSelectedMembers([]);
    setAmount(20000);
    setPendingOnly(false);
    setMentionText("");
    setSubmitMessage({ type: "", text: "" });
    showToast("success", "Đã xóa bản nháp");
  };

  const restoreMembersFromMention = () => {
    if (!mentionText.trim()) {
      showToast("error", "Chưa có chuỗi mention để khôi phục");
      return;
    }

    const names = mentionText
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (part.startsWith("@") ? part.slice(1).trim() : part))
      .filter(Boolean);

    if (names.length === 0) {
      showToast("error", "Không đọc được tên nào từ chuỗi mention");
      return;
    }

    const normalized = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();
    const selectedMap = new Map(selectedMembers.map((m) => [m._id, m]));
    let addedCount = 0;
    const missingNames = [];

    for (const name of names) {
      const key = normalized(name);
      const found = membersList.find((member) => normalized(member.displayName) === key);
      if (found) {
        if (!selectedMap.has(found._id)) {
          selectedMap.set(found._id, found);
          addedCount++;
        }
      } else {
        missingNames.push(name);
      }
    }

    setSelectedMembers(Array.from(selectedMap.values()));

    if (missingNames.length > 0) {
      showToast(
        "error",
        `Đã thêm ${addedCount} người. Không tìm thấy: ${missingNames.join(", ")}`
      );
      return;
    }

    showToast("success", `Đã khôi phục ${addedCount} thành viên từ mention`);
  };

  // Các mức tiền nhanh (tính bằng VNĐ)
  const quickAmounts = [15000, 20000, 25000, 30000, 40000, 50000];

  // Đặt ngày mặc định là hôm nay (định dạng YYYY-MM-DD)
  useEffect(() => {
    const rawDraft = localStorage.getItem(ENTRY_DRAFT_KEY);
    let hasDraftDate = false;

    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        if (draft?.date) {
          setDate(draft.date);
          hasDraftDate = true;
        }
        if (Array.isArray(draft?.selectedMembers)) {
          setSelectedMembers(draft.selectedMembers);
        }
        if (typeof draft?.amount === "number") {
          setAmount(draft.amount);
        }
        if (typeof draft?.pendingOnly === "boolean") {
          setPendingOnly(draft.pendingOnly);
        }
        if (typeof draft?.mentionText === "string") {
          setMentionText(draft.mentionText);
        }
      } catch (error) {
        console.error("Không đọc được bản nháp cục bộ:", error);
      }
    }

    if (!hasDraftDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
    }

    fetchMembers("");
  }, []);

  useEffect(() => {
    const draftData = {
      date,
      selectedMembers,
      amount,
      pendingOnly,
      mentionText,
    };
    localStorage.setItem(ENTRY_DRAFT_KEY, JSON.stringify(draftData));
  }, [date, selectedMembers, amount, pendingOnly, mentionText]);

  const fetchMembers = async (searchKeyword) => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/members?search=${encodeURIComponent(searchKeyword)}`);
      if (res.ok) {
        const data = await res.json();
        setMembersList(data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thành viên:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Tìm kiếm thành viên khi giá trị tìm kiếm thay đổi
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchMembers(value);
  };

  // Bật/tắt chọn thành viên
  const toggleMember = (member) => {
    const exists = selectedMembers.find((m) => m._id === member._id);
    if (exists) {
      setSelectedMembers(selectedMembers.filter((m) => m._id !== member._id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  // Thêm thành viên mới inline
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || creatingMember) return;
    setCreatingMember(true);
    setMemberMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi tạo thành viên mới");
      }

      const successText = `Đã thêm "${data.member.displayName}" thành công!`;
      setMemberMessage({ type: "success", text: successText });
      showToast("success", successText);
      setNewMemberName("");
      // Refresh danh sách thành viên
      fetchMembers(search);
      // Tự động chọn luôn thành viên mới
      toggleMember(data.member);
    } catch (err) {
      setMemberMessage({ type: "error", text: err.message });
      showToast("error", err.message);
    } finally {
      setCreatingMember(false);
    }
  };

  // Thực hiện gửi dữ liệu đồng bộ thực tế lên Google Sheet
  const executeSync = async () => {
    setSubmitting(true);
    setSubmitMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date,
          memberIds: selectedMembers.map((m) => m._id),
          amount: amount,
          pendingOnly: pendingOnly,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ghi nhận thất bại");
      }

      const successText = data.message || "Ghi nhận thành công lên Google Sheet!";
      setMentionText(data.mentionText || "");
      setSubmitMessage({
        type: "success",
        text: successText,
      });
      showToast("success", successText);

      // Xóa lựa chọn khi thành công để ngăn chặn gửi lại trùng lặp
      setSelectedMembers([]);
    } catch (err) {
      setSubmitMessage({ type: "error", text: err.message });
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Kiểm tra trùng dữ liệu rồi mới tiến hành đồng bộ
  const checkDuplicatesAndSync = async () => {
    setSubmitting(true);
    setSubmitMessage({ type: "", text: "" });
    try {
      const checkRes = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date,
          memberIds: selectedMembers.map((m) => m._id),
          amount: amount,
          pendingOnly: pendingOnly,
          checkOnly: true,
        }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        throw new Error(checkData.error || "Lỗi kiểm tra dữ liệu trùng lặp");
      }

      if (checkData.hasExistingData) {
        setSubmitting(false); // Dừng trạng thái loading để hiển thị modal xác nhận ghi đè
        
        const formattedDate = date.split("-").reverse().join("/");
        const membersListStr = checkData.existingMembers.join(", ");
        
        setConfirmModal({
          show: true,
          title: "⚠️ Cảnh báo trùng dữ liệu",
          message: `Ngày ${formattedDate} đã có dữ liệu tiền thu của các thành viên: ${membersListStr}. Bạn có chắc chắn muốn GHI ĐÈ số tiền mới lên Google Sheet không?`,
          confirmText: "Ghi đè",
          cancelText: "Hủy bỏ",
          onConfirm: () => {
            setConfirmModal((prev) => ({ ...prev, show: false }));
            executeSync();
          },
        });
      } else {
        // Không trùng -> Tiến hành đồng bộ ngay lập tức
        await executeSync();
      }
    } catch (err) {
      setSubmitMessage({ type: "error", text: err.message });
      showToast("error", err.message);
      setSubmitting(false);
    }
  };

  // Ghi nhận thu tiền (kiểm tra các lớp xác nhận trước khi đồng bộ)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (selectedMembers.length === 0) {
      const errorText = "Vui lòng chọn ít nhất 1 thành viên";
      setSubmitMessage({ type: "error", text: errorText });
      showToast("error", errorText);
      return;
    }

    if (!pendingOnly && (isNaN(Number(amount)) || Number(amount) < 0)) {
      const errorText = "Vui lòng nhập số tiền hợp lệ";
      setSubmitMessage({ type: "error", text: errorText });
      showToast("error", errorText);
      return;
    }

    // Lớp 1: Cảnh báo nếu ngày ghi nhận khác ngày hiện tại
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (date !== todayStr) {
      const formattedSelected = date.split("-").reverse().join("/");
      const formattedToday = todayStr.split("-").reverse().join("/");
      
      setConfirmModal({
        show: true,
        title: "📅 Xác nhận ngày ghi nhận",
        message: `Bạn đang chọn ngày ghi nhận là ${formattedSelected} (khác ngày hiện tại là ${formattedToday}). Bạn có chắc chắn muốn đồng bộ số tiền này?`,
        confirmText: "Tiếp tục",
        cancelText: "Hủy bỏ",
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, show: false }));
          checkDuplicatesAndSync();
        },
      });
    } else {
      // Đúng ngày hôm nay -> Tiến hành kiểm tra trùng và đồng bộ
      checkDuplicatesAndSync();
    }
  };

  // Định dạng tiền tệ (VNĐ)
  const formatVnd = (num) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Tiêu đề */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
          <TrendingUp className="h-6 w-6 text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Ghi nhận thu tiền</h1>
          <p className="text-xs sm:text-sm text-slate-655 mt-0.5">
            Nhập ngày, số tiền và chọn thành viên để ghi nhận lên Google Sheet
          </p>
        </div>
      </div>

      {submitMessage.text && (
        <div
          className={`flex items-start gap-2.5 border text-sm p-4 rounded-xl animate-success ${submitMessage.type === "success"
              ? "bg-emerald-50 border-emerald-250 text-emerald-800"
              : "bg-red-50 border-red-250 text-red-800"
            }`}
        >
          {submitMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          )}
          <span className="font-semibold">{submitMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Bên trái: Tham số form (Ngày + Tiền) */}
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-6 order-1">
          {/* Thẻ Chọn Ngày */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Calendar className="h-4.5 w-4.5 text-brand-primary" />
              <span>1. Chọn Ngày ghi nhận</span>
            </div>

            <input
              type="date"
              required
              disabled={submitting}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 outline-none text-base cursor-pointer font-medium"
            />
          </div>

          {/* Thẻ Số tiền */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Coins className="h-4.5 w-4.5 text-brand-primary" />
              <span>2. Nhập số tiền thu</span>
            </div>

            <div className="relative">
              <input
                type="number"
                required={!pendingOnly}
                min={0}
                disabled={submitting || pendingOnly}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="20000"
                className="w-full px-4 py-3 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 outline-none text-lg font-bold"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-slate-500 font-bold text-sm">
                VNĐ
              </span>
            </div>

            {/* Nút chọn số tiền nhanh */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((qAmount) => (
                <button
                  key={qAmount}
                  type="button"
                  disabled={submitting || pendingOnly}
                  onClick={() => setAmount(qAmount)}
                  className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${amount === qAmount
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70 hover:text-slate-800"
                    }`}
                >
                  {qAmount.toLocaleString("vi-VN")}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={pendingOnly}
                disabled={submitting}
                onChange={(e) => setPendingOnly(e.target.checked)}
              />
              Chưa biết số tiền, chỉ điểm danh trước
            </label>
          </div>

          {/* Tóm tắt lựa chọn và gửi */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-bold">Số thành viên đã chọn:</span>
              <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-250">
                {selectedMembers.length}
              </span>
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50/70 rounded-xl border border-slate-150">
                {selectedMembers.map((m) => (
                  <span
                    key={m._id}
                    className="inline-flex items-center gap-1 bg-white text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-semibold"
                  >
                    {m.displayName}
                    <button
                      type="button"
                      onClick={() => toggleMember(m)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || selectedMembers.length === 0}
              className="w-full py-4 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-base rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 hover:shadow-brand-primary/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang đồng bộ Google Sheet...
                </>
              ) : (
                pendingOnly
                  ? `Điểm danh ${selectedMembers.length} người (chưa nhập tiền)`
                  : `Đồng bộ ${selectedMembers.length} người - ${formatVnd(amount)}`
              )}
            </button>

            {(mentionText || selectedMembers.length > 0) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-bold text-slate-700">
                  Chuỗi mention (có thể dán từ ngoài vào)
                </p>
                <textarea
                  value={mentionText}
                  onChange={(e) => setMentionText(e.target.value)}
                  placeholder="@Người 1, @Người 2"
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-250 bg-white text-slate-700 outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(mentionText);
                        showToast("success", "Đã copy chuỗi mention");
                      } catch {
                        showToast("error", "Không copy được. Vui lòng copy thủ công.");
                      }
                    }}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-250 bg-white hover:bg-slate-100"
                  >
                    Copy mention
                  </button>
                  <button
                    type="button"
                    onClick={restoreMembersFromMention}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-emerald-250 text-emerald-700 bg-white hover:bg-emerald-50"
                  >
                    Khôi phục từ mention
                  </button>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-red-250 text-red-700 bg-white hover:bg-red-50"
                  >
                    Xóa bản nháp
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Bên phải: Chọn thành viên & tạo thành viên mới */}
        <div className="md:col-span-2 space-y-6 order-2">
          {/* Thẻ chọn nhiều */}
          <div className="glass-card rounded-2xl p-5 space-y-4 flex flex-col h-[340px] sm:h-[390px]">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Users className="h-4.5 w-4.5 text-brand-primary" />
              <span>3. Chọn Thành Viên</span>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm tên..."
                className="w-full pl-9 pr-4 py-2.5 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* Danh sách thành viên cuộn */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
              {loadingMembers ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                  Đang tìm kiếm...
                </div>
              ) : membersList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8 text-center gap-1">
                  <span>Không tìm thấy thành viên nào.</span>
                  <span>Tạo mới ở form bên dưới!</span>
                </div>
              ) : (
                membersList.map((member) => {
                  const isSelected = selectedMembers.some((m) => m._id === member._id);
                  return (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => toggleMember(member)}
                      className={`w-full py-2.5 px-3 flex items-center justify-between rounded-xl transition-all text-left cursor-pointer text-sm font-medium ${isSelected
                          ? "bg-brand-primary/5 text-emerald-800 font-bold"
                          : "text-slate-655 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <span>{member.displayName}</span>
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${isSelected
                            ? "bg-brand-primary border-brand-primary text-white"
                            : "border-slate-300 bg-white"
                          }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-3" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Thẻ Tạo thành viên mới nội tuyến */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3.5">
              <Plus className="h-5 w-5 text-brand-primary" />
              <h3 className="font-bold text-slate-700 text-sm">Thêm thành viên mới</h3>
            </div>

            {memberMessage.text && (
              <div
                className={`text-xs p-2.5 rounded-lg border mb-3 flex items-center gap-1.5 ${memberMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-250 text-emerald-800 animate-success"
                    : "bg-red-50 border-red-250 text-red-800"
                  }`}
              >
                {memberMessage.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                )}
                <span className="font-semibold">{memberMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="flex gap-2">
              <input
                type="text"
                required
                disabled={creatingMember}
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Nhập tên..."
                className="flex-1 px-3 py-2 bg-white/70 border border-slate-200 focus:border-brand-primary/60 focus:bg-white focus:ring-2 focus:ring-brand-primary/10 rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all disabled:opacity-50 text-sm font-medium"
              />
              <button
                type="submit"
                disabled={creatingMember || !newMemberName.trim()}
                className="px-4 py-2 bg-slate-50 border border-slate-250 hover:border-brand-primary/45 hover:text-brand-primary text-slate-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all cursor-pointer font-bold text-sm flex items-center justify-center shrink-0"
              >
                {creatingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Hộp thông báo Toast bay (Toast Notification) */}
      {toast.show && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 animate-success w-full max-w-sm px-4">
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
              onClick={() => setToast({ ...toast, show: false })}
              className="text-slate-400 hover:text-slate-750 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận tuỳ biến (Premium Modal) */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-success">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-250 text-amber-500 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-slate-800 leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="px-4 py-2.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-brand-primary/20"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
