import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ id: "jlpt-n4-mock-01" }];
}

export default function ExamPage() {
  redirect("/portal/tests");
}
