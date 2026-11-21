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
  const { lang } = useTranslation();

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
        lang === "vi"
          ? "Không thể tải danh sách khách tư vấn từ hệ thống."
          : "Failed to load consultation leads."
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
        lang === "vi"
          ? `Đã cập nhật trạng thái "${lead.fullName}" → ${nextStatus}`
          : `Updated status for "${lead.fullName}" → ${nextStatus}`
      );
    } catch (err) {
      console.error("Update lead status error:", err);
      toast.error(lang === "vi" ? "Không thể cập nhật trạng thái." : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async (lead: LeadDoc) => {
    if (
      !window.confirm(
        lang === "vi"
          ? `Xóa yêu cầu tư vấn của "${lead.fullName}" (${lead.phone})?`
          : `Delete consultation lead from "${lead.fullName}" (${lead.phone})?`
      )
    ) {
      return;
    }
    try {
      await deleteLeadDoc(lead.id);
      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
      toast.success(lang === "vi" ? "Đã xóa bản ghi tư vấn." : "Deleted lead record.");
    } catch (err) {
      console.error("Delete lead error:", err);
      toast.error(lang === "vi" ? "Không thể xóa bản ghi." : "Failed to delete lead.");
    }
  };

  const handleExportCsv = () => {
    const header = ["ID", "Họ tên", "SĐT", "Email", "Trình độ", "Mục tiêu", "Trạng thái", "Ghi chú", "Ngày đăng ký"];
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
          {lang === "vi" ? "Quyền truy cập hạn chế" : "Restricted Access"}
        </h2>
        <p className="text-sm text-shinme-muted max-w-md mx-auto">
          {lang === "vi"
            ? "Chức năng Quản lý Khách tư vấn (Leads) chỉ dành cho vai trò Quản trị viên (Admin)."
            : "Consultation Leads management is reserved for Administrator (Admin) roles."}
        </p>
        <Button asChild size="sm">
          <Link href="/portal">{lang === "vi" ? "Quay về Tổng quan" : "Back to Overview"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {lang === "vi" ? "Danh sách Khách tư vấn (Leads)" : "Consultation Leads"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {lang === "vi"
              ? "Dữ liệu đồng bộ trực tiếp từ Form tư vấn & Bài Thi thử Mini trên trang chủ"
              : "Live leads synced directly from homepage consultation forms & mini placement tests"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLeads} disabled={isLoading}>
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {lang === "vi" ? "Làm mới" : "Refresh"}
          </Button>
          {filteredLeads.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="size-3.5" />
              {lang === "vi" ? "Xuất CSV" : "Export CSV"}
            </Button>
          )}
          <Badge tone="warn">{lang === "vi" ? "Quản trị viên" : "Admin"}</Badge>
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
              {st === "ALL" ? (lang === "vi" ? `Tất cả (${leads.length})` : `All (${leads.length})`) : st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "vi" ? "Tìm theo tên, SĐT, ghi chú..." : "Search by name, phone, notes..."}
            className="h-9 w-full rounded-full border border-shinme-border bg-shinme-surface pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-shinme-border bg-shinme-surface p-12 text-sm font-semibold text-shinme-muted">
          <Loader2 className="size-5 animate-spin text-shinme-primary" />
          {lang === "vi" ? "Đang tải danh sách khách tư vấn..." : "Loading consultation leads..."}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-shinme-leaf text-shinme-primary mb-4">
            <Users className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-shinme-ink">
            {lang === "vi" ? "Chưa có thông tin đăng ký phù hợp" : "No matching registration leads"}
          </h3>
          <p className="mt-2 text-sm text-shinme-muted max-w-md mx-auto">
            {lang === "vi"
              ? "Học viên khi gửi đơn từ Form tư vấn hoặc hoàn thành bài thi thử mini sẽ hiển thị tại đây."
              : "Prospective students submitting the homepage consultation form will appear here."}
          </p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/#tu-van">
              <ArrowLeft /> {lang === "vi" ? "Đến Form tư vấn trang chủ" : "Go to Homepage Consultation Form"}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface overflow-hidden shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-shinme-line flex items-center justify-between">
            <span className="text-sm font-extrabold text-shinme-ink">
              {lang === "vi" ? "Hiển thị: " : "Showing: "}
              <strong className="text-shinme-primary">{filteredLeads.length}</strong>{" "}
              {lang === "vi" ? "khách hàng" : "leads"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-shinme-line bg-shinme-bg text-xs font-extrabold uppercase text-shinme-muted">
                <tr>
                  <th className="py-3 px-4">{lang === "vi" ? "Họ và tên" : "Full Name"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "SĐT / Zalo" : "Phone / Zalo"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Trình độ" : "Level"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Mục tiêu & Ghi chú" : "Goal & Notes"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="py-3 px-4 text-right">{lang === "vi" ? "Thời gian gửi" : "Submitted At"}</th>
                  <th className="py-3 px-4 text-right">{lang === "vi" ? "Xóa" : "Delete"}</th>
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
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-shinme-muted tabular">
                      {l.createdAt
                        ? new Date(l.createdAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
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
                        title={lang === "vi" ? "Xóa bản ghi" : "Delete record"}
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
