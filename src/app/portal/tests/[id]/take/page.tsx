import React, { Suspense } from "react";
import { TestTakeClient } from "@/components/portal/test-take-client";

export default async function StudentExamTakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const initialMode =
    mode === "review" || mode === "live" ? mode : "take";

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          Đang khởi tạo phòng thi tiếng Nhật JLPT... / Initializing JLPT Exam Hall...
        </div>
      }
    >
      <TestTakeClient testId={id} initialMode={initialMode} />
    </Suspense>
  );
}
