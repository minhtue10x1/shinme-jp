"use client";

import { useState } from "react";
import { Download, FileAudio, FileSpreadsheet, FileText, Headphones, Presentation, Search, Upload } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChokaiAudioPlayer } from "@/components/portal/chokai-audio-player";
import { MOCK_MATERIALS } from "@/data/portal-data";
import { useRole } from "@/lib/role-context";

export default function MaterialsPage() {
  const { role } = useRole();
  const [activeAudio, setActiveAudio] = useState<boolean>(true);

  const getIcon = (format: string) => {
    switch (format) {
      case "PDF":
        return <FileText className="size-5 text-red-600" />;
      case "Audio":
        return <FileAudio className="size-5 text-amber-600" />;
      case "Slide":
        return <Presentation className="size-5 text-blue-600" />;
      default:
        return <FileSpreadsheet className="size-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Kho học liệu & Giáo trình</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Tài liệu số hóa, slide giảng dạy, audio chokai và tổng hợp Kanji độc quyền Shinme
          </p>
        </div>
        {role !== "student" && (
          <Button size="sm">
            <Upload /> Tải lên tài liệu mới
          </Button>
        )}
      </div>

      {/* Interactive Chokai Player */}
      <ChokaiAudioPlayer />

      <h2 className="text-lg font-black text-shinme-ink pt-2">Danh mục tài liệu số hóa</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {MOCK_MATERIALS.map((m) => (
          <div
            key={m.id}
            className="flex flex-col justify-between rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 rounded-lg bg-shinme-bg p-2">
                  {getIcon(m.format)}
                  <span className="text-xs font-black text-shinme-ink">{m.format}</span>
                </span>
                <Badge tone="leaf">{m.category}</Badge>
              </div>

              <h3 className="mt-3 text-base font-black text-shinme-ink">{m.title}</h3>
              {m.titleJa && (
                <FuriganaText text={m.titleJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-shinme-muted">
                <span>{m.lesson}</span>
                <span>·</span>
                <span className="tabular">{m.size}</span>
                <span>·</span>
                <span>Cập nhật: {m.updatedAt}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-shinme-line flex items-center justify-between">
              <span className="text-xs font-bold text-shinme-primary">Truy cập không giới hạn</span>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Download className="size-3.5" /> Tải về máy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

