import React, { Suspense } from "react";
import { TestTakeClient } from "@/components/portal/test-take-client";

export function generateStaticParams() {
  return [{ id: "n3-mock-test-01" }, { id: "n3-unit26-quiz" }];
}

export default async function StudentExamTakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          Đang khởi tạo phòng thi tiếng Nhật JLPT...
        </div>
      }
    >
      <TestTakeClient testId={id} />
    </Suspense>
  );
}

