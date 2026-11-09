"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Download, Phone, Sparkles, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLeadsServerSnapshot, getLeadsSnapshot, subscribeLeads } from "@/lib/leads";
import { useRole } from "@/lib/role-context";

export default function LeadsPage() {
  const { role } = useRole();
  const leads = useSyncExternalStore(subscribeLeads, getLeadsSnapshot, getLeadsServerSnapshot);

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Danh sách Khách tư vấn (Leads)</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Quản lý học viên tiềm năng đăng ký qua Form tư vấn & Bài Thi thử Mini trên trang chủ
          </p>
        </div>
        <Badge tone="warn">Chế độ Quản trị viên</Badge>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-shinme-leaf text-shinme-primary mb-4">
            <Users className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-shinme-ink">Chưa có thông tin đăng ký mới</h3>
          <p className="mt-2 text-sm text-shinme-muted max-w-md mx-auto">
            Học viên khi gửi đơn từ Form tư vấn hoặc hoàn thành bài thi thử mini sẽ được đồng bộ vào danh sách này theo thời gian thực.
          </p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/#tu-van">
              <ArrowLeft /> Đến Form tư vấn trang chủ
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface overflow-hidden shadow-[var(--shadow-card)]">
          <div className="p-4 border-b border-shinme-line flex items-center justify-between">
            <span className="text-sm font-extrabold text-shinme-ink">
              Tổng cộng: <strong className="text-shinme-primary">{leads.length}</strong> khách hàng
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-shinme-line bg-shinme-bg text-xs font-extrabold uppercase text-shinme-muted">
                <tr>
                  <th className="py-3 px-4">Mã Lead</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">SĐT / Zalo</th>
                  <th className="py-3 px-4">Trình độ</th>
                  <th className="py-3 px-4">Mục tiêu</th>
                  <th className="py-3 px-4">Nguồn & Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thời gian gửi</th>
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
                          {l.source}
                          {l.testScore !== undefined && ` (${l.testScore}/5đ)`}
                        </Badge>
                        {l.note && <p className="text-xs text-shinme-muted">{l.note}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-shinme-muted tabular">
                      {new Date(l.createdAt).toLocaleString("vi-VN", {
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

