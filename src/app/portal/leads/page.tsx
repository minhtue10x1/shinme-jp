"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteLeadDoc, getLeads, saveLeadDoc } from "@/lib/db/services";
import type { LeadDoc } from "@/lib/db/schema";
import { useRole } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";

const LEAD_STATUSES: LeadDoc["status"][] = [
  "Chưa liên hệ",
  "Đang tư vấn",
  "Đã đăng ký",
  "Hủy",
];

export default function LeadsPage() {
  const { role } = useRole();
  const { lang, tr } = useTranslation();

  const statusLabel = (st: LeadDoc["status"]) => {
    if (st === "Chưa liên hệ") return tr("Chưa liên hệ", "New / Uncontacted", "未連絡");
    if (st === "Đang tư vấn") return tr("Đang tư vấn", "In Consultation", "相談中");
    if (st === "Đã đăng ký") return tr("Đã đăng ký", "Enrolled", "登録済み");
    if (st === "Hủy") return tr("Hủy", "Cancelled", "キャンセル");
    return st;
  };

  const [leads, setLeads] = useState<LeadDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const list = await getLeads();
      setLeads(list);
    } catch (err) {
      console.error("Failed to load leads from Firestore:", err);
      toast.error(
        tr(
          "Không thể tải danh sách khách tư vấn từ hệ thống.",
          "Failed to load consultation leads.",
          "相談リード一覧を読み込めませんでした。"
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      loadLeads();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          (l.fullName || "").toLowerCase().includes(q) ||
          (l.phone || "").toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.targetGoal || "").toLowerCase().includes(q) ||
          (l.notes || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const handleStatusChange = async (lead: LeadDoc, nextStatus: LeadDoc["status"]) => {
    try {
      setUpdatingId(lead.id);
      const updated: LeadDoc = { ...lead, status: nextStatus };
      await saveLeadDoc(updated);
      setLeads((prev) => prev.map((item) => (item.id === lead.id ? updated : item)));
      toast.success(
        tr(
          `Đã cập nhật trạng thái "${lead.fullName}" → ${statusLabel(nextStatus)}`,
          `Updated status for "${lead.fullName}" → ${statusLabel(nextStatus)}`,
          `「${lead.fullName}」のステータスを「${statusLabel(nextStatus)}」に更新しました`
        )
      );
    } catch (err) {
      console.error("Update lead status error:", err);
      toast.error(tr("Không thể cập nhật trạng thái.", "Failed to update status.", "ステータスを更新できませんでした。"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async (lead: LeadDoc) => {
    if (
      !window.confirm(
        tr(
          `Xóa yêu cầu tư vấn của "${lead.fullName}" (${lead.phone})?`,
          `Delete consultation lead from "${lead.fullName}" (${lead.phone})?`,
          `「${lead.fullName}」（${lead.phone}）の相談リードを削除しますか？`
        )
      )
    ) {
      return;
    }
    try {
      await deleteLeadDoc(lead.id);
      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
      toast.success(tr("Đã xóa bản ghi tư vấn.", "Deleted lead record.", "リード記録を削除しました。"));
    } catch (err) {
      console.error("Delete lead error:", err);
      toast.error(tr("Không thể xóa bản ghi.", "Failed to delete lead.", "記録を削除できませんでした。"));
    }
  };

  const handleExportCsv = () => {
    const header = [
      "ID",
      tr("Họ tên", "Full Name", "氏名"),
      tr("SĐT", "Phone", "電話番号"),
      "Email",
      tr("Trình độ", "Level", "レベル"),
      tr("Mục tiêu", "Goal", "目標"),
      tr("Trạng thái", "Status", "ステータス"),
      tr("Ghi chú", "Notes", "備考"),
      tr("Ngày đăng ký", "Submitted At", "登録日時"),
    ];
    const rows = filteredLeads.map((l) => [
      l.id,
      l.fullName,
      l.phone,
      l.email || "",
      l.currentLevel || "",
      l.targetGoal || "",
      l.status,
      (l.notes || "").replace(/\r?\n/g, " "),
      l.createdAt,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shinme-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (role !== "admin") {
    return (
      <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-8 text-center space-y-4">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-shinme-warn-soft text-[#8a5a12]">
          <Users className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-shinme-ink">
          {tr("Quyền truy cập hạn chế", "Restricted Access", "アクセス制限")}
        </h2>
        <p className="text-sm text-shinme-muted max-w-md mx-auto">
          {tr(
            "Chức năng Quản lý Khách tư vấn (Leads) chỉ dành cho vai trò Quản trị viên (Admin).",
            "Consultation Leads management is reserved for Administrator (Admin) roles.",
            "相談リード管理は管理者（Admin）専用機能です。"
          )}
        </p>
        <Button asChild size="sm">
          <Link href="/portal">{tr("Quay về Tổng quan", "Back to Overview", "ダッシュボードへ戻る")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {tr("Danh sách Khách tư vấn (Leads)", "Consultation Leads", "相談リード一覧")}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {tr(
              "Dữ liệu đồng bộ trực tiếp từ Form tư vấn & Bài Thi thử Mini trên trang chủ",
              "Live leads synced directly from homepage consultation forms & mini placement tests",
              "トップページの相談フォーム・ミニテストとリアルタイム連携しています"
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLeads} disabled={isLoading}>
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {tr("Làm mới", "Refresh", "更新")}
          </Button>
          {filteredLeads.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="size-3.5" />
              {tr("Xuất CSV", "Export CSV", "CSV出力")}
            </Button>
          )}
          <Badge tone="warn">{tr("Quản trị viên", "Admin", "管理者")}</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", ...LEAD_STATUSES].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-shinme-primary text-white"
                  : "border border-shinme-border bg-shinme-surface text-shinme-ink-soft hover:bg-shinme-leaf"
              }`}
            >
              {st === "ALL" ? tr(`Tất cả (${leads.length})`, `All (${leads.length})`, `すべて (${leads.length})`) : statusLabel(st as LeadDoc["status"])}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Tìm theo tên, SĐT, ghi chú...", "Search by name, phone, notes...", "氏名・電話番号・メモで検索...")}
            className="h-9 w-full rounded-full border border-shinme-border bg-shinme-surface pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-shinme-border bg-shinme-surface p-12 text-sm font-semibold text-shinme-muted">
          <Loader2 className="size-5 animate-spin text-shinme-primary" />
          {tr("Đang tải danh sách khách tư vấn...", "Loading consultation leads...", "相談リードを読み込み中...")}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-shinme-leaf text-shinme-primary mb-4">
            <Users className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-shinme-ink">
            {tr("Chưa có thông tin đăng ký phù hợp", "No matching registration leads", "該当する登録データがありません")}
          </h3>
          <p className="mt-2 text-sm text-shinme-muted max-w-md mx-auto">
            {tr(
              "Học viên khi gửi đơn từ Form tư vấn hoặc hoàn thành bài thi thử mini sẽ hiển thị tại đây.",
              "Prospective students submitting the homepage consultation form will appear here.",
              "トップページの相談フォーム送信やミニテスト完了時にこちらへ表示されます。"
            )}
          </p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/#tu-van">
              <ArrowLeft /> {tr("Đến Form tư vấn trang chủ", "Go to Homepage Consultation Form", "相談フォームへ移動")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface overflow-hidden shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-shinme-line flex items-center justify-between">
            <span className="text-sm font-extrabold text-shinme-ink">
              {tr("Hiển thị: ", "Showing: ", "表示中：")}
              <strong className="text-shinme-primary">{filteredLeads.length}</strong>{" "}
              {tr("khách hàng", "leads", "件")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-shinme-line bg-shinme-bg text-xs font-extrabold uppercase text-shinme-muted">
                <tr>
                  <th className="py-3 px-4">{tr("Họ và tên", "Full Name", "氏名")}</th>
                  <th className="py-3 px-4">{tr("SĐT / Zalo", "Phone / Zalo", "電話 / Zalo")}</th>
                  <th className="py-3 px-4">{tr("Trình độ", "Level", "レベル")}</th>
                  <th className="py-3 px-4">{tr("Mục tiêu & Ghi chú", "Goal & Notes", "目標・備考")}</th>
                  <th className="py-3 px-4">{tr("Trạng thái", "Status", "ステータス")}</th>
                  <th className="py-3 px-4 text-right">{tr("Thời gian gửi", "Submitted At", "送信日時")}</th>
                  <th className="py-3 px-4 text-right">{tr("Xóa", "Delete", "削除")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shinme-line">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-shinme-leaf-faint/50">
                    <td className="py-3 px-4">
                      <p className="font-black text-shinme-ink">{l.fullName}</p>
                      <p className="font-mono text-xs text-shinme-muted">{l.id}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-shinme-primary tabular">{l.phone}</p>
                      {l.email && <p className="text-xs text-shinme-muted">{l.email}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone="neutral">{l.currentLevel || "—"}</Badge>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-shinme-ink-soft">{l.targetGoal || "—"}</p>
                      {l.notes && <p className="mt-0.5 text-xs text-shinme-muted">{l.notes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={l.status || "Chưa liên hệ"}
                        disabled={updatingId === l.id}
                        onChange={(e) => handleStatusChange(l, e.target.value as LeadDoc["status"])}
                        className="rounded-lg border border-shinme-border bg-white px-2.5 py-1.5 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                      >
                        {LEAD_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {statusLabel(st)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-shinme-muted tabular">
                      {l.createdAt
                        ? new Date(l.createdAt).toLocaleString(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLead(l)}
                        className="rounded-lg p-1.5 text-shinme-muted hover:bg-rose-50 hover:text-rose-600"
                        title={tr("Xóa bản ghi", "Delete record", "削除")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
