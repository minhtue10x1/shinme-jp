"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveLead } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { useHome, type LeadPrefill } from "./home-context";
import { useTranslation } from "@/lib/i18n/context";

const LEVEL_OPTIONS = ["Mới bắt đầu", "N5", "N4", "N3", "N2", "N1"];
const GOAL_OPTIONS = [
  "Thi chứng chỉ JLPT",
  "Du học Nhật Bản",
  "Làm việc tại Nhật (kỹ sư, TTS, tokutei)",
  "Làm việc ở công ty Nhật tại Việt Nam",
  "Giao tiếp / Kaiwa",
  "Sở thích, văn hóa Nhật",
];

type Values = { fullName: string; phone: string; level: string; goal: string; note: string };
type Errors = Partial<Record<keyof Values, string>>;

function normalizePhone(v: string) {
  return v.replace(/[\s.\-()]/g, "").replace(/^\+/, "");
}

function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = "Vui lòng nhập họ tên.";
  else if (name.length < 2 || /\d/.test(name)) e.fullName = "Họ tên chưa hợp lệ — chỉ gồm chữ, tối thiểu 2 ký tự.";
  const phone = normalizePhone(v.phone);
  if (!phone) e.phone = "Vui lòng nhập số điện thoại hoặc Zalo.";
  else if (!/^(0|84)(3|5|7|8|9)\d{8}$/.test(phone))
    e.phone = "Số điện thoại chưa đúng. Ví dụ: 0912 345 678 hoặc +84 912 345 678.";
  if (!v.level) e.level = "Chọn trình độ hiện tại của bạn.";
  if (!v.goal) e.goal = "Chọn mục tiêu học để Sensei tư vấn đúng lộ trình.";
  if (v.note.length > 300) e.note = "Ghi chú tối đa 300 ký tự.";
  return e;
}

export function ConsultationSection() {
  const { leadPrefill } = useHome();
  const { t, lang } = useTranslation();

  const steps = [
    [
      lang === "vi" ? "Shinme gọi lại qua SĐT / Zalo" : "Shinme contacts you via Phone / WhatsApp / Zalo",
      lang === "vi" ? "Trong vòng 24 giờ làm việc kể từ khi bạn gửi." : "Within 24 working hours of submission."
    ],
    [
      lang === "vi" ? "Test đầu vào 15 phút cùng Sensei" : "15-minute 1-on-1 placement check with Sensei",
      lang === "vi" ? "Đánh giá cả 4 kỹ năng nghe – nói – đọc – viết." : "Comprehensive evaluation across reading, listening, and speaking."
    ],
    [
      lang === "vi" ? "Nhận lộ trình & xếp lớp" : "Receive tailored curriculum & class placement",
      lang === "vi" ? "Lịch học, học phí và mục tiêu đầu ra rõ ràng." : "Clear timetable, tuition, and guaranteed milestones."
    ]
  ];

  return (
    <section id="tu-van" aria-labelledby="consult-title" className="bg-shinme-primary text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <h2 id="consult-title" className="text-balance text-3xl font-extrabold sm:text-4xl">
            {t.home.consultation.title}
          </h2>
          <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-white/80">
            {t.home.consultation.subtitle}
          </p>
          <ol className="mt-10 space-y-6">
            {steps.map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-shinme-accent text-lg font-black text-shinme-primary-deep">
                  {i + 1}
                </span>
                <div>
                  <p className="text-lg font-extrabold">{title}</p>
                  <p className="text-white/70">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <LeadForm key={JSON.stringify(leadPrefill)} prefill={leadPrefill} />
      </div>
    </section>
  );
}

function LeadForm({ prefill }: { prefill: LeadPrefill }) {
  const { t, lang } = useTranslation();
  const [values, setValues] = useState<Values>({
    fullName: "",
    phone: "",
    level: prefill.level ?? "",
    goal: prefill.goal ?? "",
    note: "",
  });
  const [course, setCourse] = useState(prefill.course ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const levelOptions = [
    lang === "vi" ? "Mới bắt đầu" : "Beginner (Zero)",
    "N5", "N4", "N3", "N2", "N1"
  ];
  const goalOptions = [
    lang === "vi" ? "Thi chứng chỉ JLPT" : "Pass JLPT Certification",
    lang === "vi" ? "Du học Nhật Bản" : "Study in Japan",
    lang === "vi" ? "Làm việc tại Nhật (kỹ sư, TTS, tokutei)" : "Work in Japan (Engineer, Tokutei, Trainee)",
    lang === "vi" ? "Làm việc ở công ty Nhật tại Việt Nam" : "Work for Japanese Firms in Vietnam",
    lang === "vi" ? "Giao tiếp / Kaiwa" : "Conversational Japanese (Kaiwa)",
    lang === "vi" ? "Sở thích, văn hóa Nhật" : "Personal Interest & Japanese Culture",
  ];

  const set = (key: keyof Values, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors((prev) => ({ ...prev, [key]: validate(next)[key] }));
  };

  const blur = (key: keyof Values) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validate(values)[key] }));
  };

  // Guard against IME (Japanese / Vietnamese Telex) Enter submitting mid-composition.
  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched({ fullName: true, phone: true, level: true, goal: true, note: true });
    const firstInvalid = (Object.keys(errs) as (keyof Values)[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      toast.error(lang === "vi" ? "Thông tin chưa đầy đủ" : "Incomplete Information", {
        description: lang === "vi" ? "Vui lòng kiểm tra các ô được đánh dấu." : "Please review the highlighted fields."
      });
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    const lead = saveLead({
      fullName: values.fullName.trim(),
      phone: normalizePhone(values.phone),
      level: values.level,
      goal: values.goal,
      note: [course && `Interested: ${course}`, values.note.trim()].filter(Boolean).join(" · ") || undefined,
      source: prefill.testScore !== undefined ? "Thi thử Mini" : "Form tư vấn",
      testScore: prefill.testScore,
    });
    setSubmitting(false);
    toast.success(
      lang === "vi"
        ? `Cảm ơn ${lead.fullName}! ありがとうございます`
        : `Thank you, ${lead.fullName}! ありがとうございます`,
      {
        description:
          lang === "vi"
            ? `Shinme sẽ liên hệ qua số ${values.phone.trim()} trong 24 giờ làm việc.`
            : `Shinme will reach out via ${values.phone.trim()} within 24 working hours.`,
      }
    );
    setValues({ fullName: "", phone: "", level: "", goal: "", note: "" });
    setCourse("");
    setTouched({});
    setErrors({});
  };

  const fieldCls = (key: keyof Values) =>
    cn(
      "mt-1.5 block w-full rounded-xl border-2 bg-shinme-surface px-4 text-base text-shinme-ink transition-colors placeholder:text-shinme-muted/70 focus:border-shinme-primary focus:outline-none focus-visible:outline-none",
      errors[key] ? "border-shinme-danger" : "border-shinme-border hover:border-shinme-primary/40",
    );

  const errorText = (key: keyof Values) =>
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1.5 text-sm font-semibold text-shinme-danger">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      aria-labelledby="consult-title"
      className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 text-shinme-ink shadow-[var(--shadow-lift)] sm:p-8"
    >
      {prefill.testScore !== undefined && (
        <p className="mb-5 rounded-xl bg-shinme-leaf px-4 py-3 text-sm font-bold text-shinme-primary">
          {lang === "vi"
            ? `Kết quả Thi thử Mini của bạn: ${prefill.testScore}/5 câu đúng — Sensei sẽ dùng kết quả này khi tư vấn.`
            : `Your Placement Test result: ${prefill.testScore}/5 correct — Sensei will reference this during consultation.`}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="fullName" className="text-sm font-extrabold">
            {t.home.consultation.nameLabel} <span className="text-shinme-danger">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder={t.home.consultation.namePlaceholder}
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            onBlur={() => blur("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={cn(fieldCls("fullName"), "h-12")}
          />
          {errorText("fullName")}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="phone" className="text-sm font-extrabold">
            {t.home.consultation.phoneLabel} <span className="text-shinme-danger">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t.home.consultation.phonePlaceholder}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            onBlur={() => blur("phone")}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={cn(fieldCls("phone"), "tabular h-12")}
          />
          {errorText("phone")}
        </div>

        <div>
          <label htmlFor="level" className="text-sm font-extrabold">
            {lang === "vi" ? "Trình độ hiện tại" : "Current Level"} <span className="text-shinme-danger">*</span>
          </label>
          <select
            id="level"
            name="level"
            value={values.level}
            onChange={(e) => set("level", e.target.value)}
            onBlur={() => blur("level")}
            aria-invalid={!!errors.level}
            aria-describedby={errors.level ? "level-error" : undefined}
            className={cn(fieldCls("level"), "h-12 appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23135E36%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10", !values.level && "text-shinme-muted")}
          >
            <option value="" disabled>
              {lang === "vi" ? "Chọn trình độ" : "Select Level"}
            </option>
            {levelOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {errorText("level")}
        </div>

        <div>
          <label htmlFor="goal" className="text-sm font-extrabold">
            {t.home.consultation.targetLabel} <span className="text-shinme-danger">*</span>
          </label>
          <select
            id="goal"
            name="goal"
            value={values.goal}
            onChange={(e) => set("goal", e.target.value)}
            onBlur={() => blur("goal")}
            aria-invalid={!!errors.goal}
            aria-describedby={errors.goal ? "goal-error" : undefined}
            className={cn(fieldCls("goal"), "h-12 appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23135E36%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10", !values.goal && "text-shinme-muted")}
          >
            <option value="" disabled>
              {lang === "vi" ? "Chọn mục tiêu" : "Select Goal"}
            </option>
            {goalOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          {errorText("goal")}
        </div>

        {course && (
          <div className="sm:col-span-2">
            <p className="text-sm font-extrabold">{lang === "vi" ? "Khóa học quan tâm" : "Selected Course"}</p>
            <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-shinme-leaf py-1.5 pl-4 pr-1.5 text-sm font-bold text-shinme-primary">
              {course}
              <button
                type="button"
                onClick={() => setCourse("")}
                aria-label={lang === "vi" ? `Bỏ chọn khóa ${course}` : `Deselect course ${course}`}
                className="grid size-6 place-items-center rounded-full hover:bg-shinme-accent-soft cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="note" className="text-sm font-extrabold">
            {t.home.consultation.noteLabel} <span className="font-semibold text-shinme-muted">({lang === "vi" ? "không bắt buộc" : "optional"})</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder={t.home.consultation.notePlaceholder}
            value={values.note}
            onChange={(e) => set("note", e.target.value)}
            onBlur={() => blur("note")}
            aria-invalid={!!errors.note}
            aria-describedby={errors.note ? "note-error" : "note-count"}
            className={cn(fieldCls("note"), "resize-y py-3 leading-relaxed")}
          />
          <div className="flex justify-between">
            {errorText("note") ?? <span />}
            <span id="note-count" className="tabular mt-1.5 text-xs font-semibold text-shinme-muted">
              {values.note.length}/300
            </span>
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-6 w-full cursor-pointer" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <Send />}
        {submitting ? t.home.consultation.submittingBtn : t.home.consultation.submitBtn}
      </Button>
      <p className="mt-3 text-center text-xs text-shinme-muted">
        {lang === "vi"
          ? "Thông tin của bạn chỉ dùng để Shinme liên hệ tư vấn, không chia sẻ cho bên thứ ba."
          : "Your information is strictly used for Shinme's academic advisory and never shared with third parties."}
      </p>
    </form>
  );
}
