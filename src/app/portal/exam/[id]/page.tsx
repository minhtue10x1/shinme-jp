import { Suspense } from "react";
import { ExamClient } from "@/components/portal/exam-client";

export function generateStaticParams() {
  return [{ id: "jlpt-n4-mock-01" }];
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-shinme-muted">Đang tải đề thi...</div>}>
      <ExamClient />
    </Suspense>
  );
}
