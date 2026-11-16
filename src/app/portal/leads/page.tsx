"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Download, Phone, Sparkles, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLeadsServerSnapshot, getLeadsSnapshot, subscribeLeads } from "@/lib/leads";
import { useRole } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";

export default function LeadsPage() {
  const { role } = useRole();
  const { lang, t } = useTranslation();
  const leads = useSyncExternalStore(subscribeLeads, getLeadsSnapshot, getLeadsServerSnapshot);

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
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {lang === "vi" ? "Danh sách Khách tư vấn (Leads)" : "Consultation Leads"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {lang === "vi"
              ? "Quản lý học viên tiềm năng đăng ký qua Form tư vấn & Bài Thi thử Mini trên trang chủ"
              : "Manage prospective students registered via homepage consultation forms & placement mini-tests"}
          </p>
        </div>
        <Badge tone="warn">{lang === "vi" ? "Chế độ Quản trị viên" : "Administrator Mode"}</Badge>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-shinme-leaf text-shinme-primary mb-4">
            <Users className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-shinme-ink">
            {lang === "vi" ? "Chưa có thông tin đăng ký mới" : "No new registration leads"}
          </h3>
          <p className="mt-2 text-sm text-shinme-muted max-w-md mx-auto">
            {lang === "vi"
              ? "Học viên khi gửi đơn từ Form tư vấn hoặc hoàn thành bài thi thử mini sẽ được đồng bộ vào danh sách này theo thời gian thực."
              : "Prospective students submitting the homepage consultation form or mini placement test will appear here in real-time."}
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
              {lang === "vi" ? "Tổng cộng: " : "Total: "}
              <strong className="text-shinme-primary">{leads.length}</strong> {lang === "vi" ? "khách hàng" : "leads"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-shinme-line bg-shinme-bg text-xs font-extrabold uppercase text-shinme-muted">
                <tr>
                  <th className="py-3 px-4">{lang === "vi" ? "Mã Lead" : "Lead ID"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Họ và tên" : "Full Name"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "SĐT / Zalo" : "Phone / Zalo"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Trình độ" : "Level"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Mục tiêu" : "Goal"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Nguồn & Ghi chú" : "Source & Notes"}</th>
                  <th className="py-3 px-4 text-right">{lang === "vi" ? "Thời gian gửi" : "Submitted At"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shinme-line">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-shinme-leaf-faint/50">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-shinme-muted">{l.id}</td>
                    <td className="py-3 px-4 font-black text-shinme-ink">{l.fullName}</td>
                    <td className="py-3 px-4 font-bold text-shinme-primary tabular">{l.phone}</td>
                    <td className="py-3 px-4">
                      <Badge tone="neutral">{l.level}</Badge>
                    </td>
                    <td className="py-3 px-4 text-shinme-ink-soft">{l.goal}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <Badge tone={l.source === "Thi thử Mini" ? "leaf" : "neutral"}>
                          {l.source === "Thi thử Mini" ? (lang === "vi" ? "Thi thử Mini" : "Mini Test") : l.source}
                          {l.testScore !== undefined && ` (${l.testScore}/5${lang === "vi" ? "đ" : "pts"})`}
                        </Badge>
                        {l.note && <p className="text-xs text-shinme-muted">{l.note}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-shinme-muted tabular">
                      {new Date(l.createdAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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

