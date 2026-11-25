"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveLead } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { useHome, type LeadPrefill } from "./home-context";
import { useTranslation, pickLang } from "@/lib/i18n/context";
import type { Language } from "@/lib/i18n/types";

type Values = { fullName: string; phone: string; level: string; goal: string; note: string };
type Errors = Partial<Record<keyof Values, string>>;

function normalizePhone(v: string) {
  return v.replace(/[\s.\-()]/g, "").replace(/^\+/, "");
}

function validate(v: Values, lang: Language): Errors {
  const e: Errors = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = pickLang(lang, "Vui lòng nhập họ tên.", "Please enter your full name.", "お名前を入力してください。");
  else if (name.length < 2 || /\d/.test(name))
    e.fullName = pickLang(
      lang,
      "Họ tên chưa hợp lệ — chỉ gồm chữ, tối thiểu 2 ký tự.",
      "Invalid name — letters only, minimum 2 characters.",
      "お名前が正しくありません（2文字以上、数字不可）。"
    );
  const phone = normalizePhone(v.phone);
  if (!phone) e.phone = pickLang(lang, "Vui lòng nhập số điện thoại hoặc Zalo.", "Please enter your phone or Zalo number.", "電話番号またはZalo番号を入力してください。");
  else if (!/^(0|84)(3|5|7|8|9)\d{8}$/.test(phone))
    e.phone = pickLang(
      lang,
      "Số điện thoại chưa đúng. Ví dụ: 0912 345 678 hoặc +84 912 345 678.",
      "Invalid phone number. Example: 0912 345 678 or +84 912 345 678.",
      "電話番号の形式が正しくありません（例：0912 345 678 または +84 912 345 678）。"
    );
  if (!v.level) e.level = pickLang(lang, "Chọn trình độ hiện tại của bạn.", "Please select your current level.", "現在のレベルを選択してください。");
  if (!v.goal) e.goal = pickLang(lang, "Chọn mục tiêu học để Sensei tư vấn đúng lộ trình.", "Please select your learning goal.", "学習目標を選択してください。");
  if (v.note.length > 300) e.note = pickLang(lang, "Ghi chú tối đa 300 ký tự.", "Notes cannot exceed 300 characters.", "備考は300文字以内で入力してください。");
  return e;
}

export function ConsultationSection() {
  const { leadPrefill } = useHome();
  const { t, tr } = useTranslation();

  const steps = [
    [
      tr("Shinme gọi lại qua SĐT / Zalo", "Shinme contacts you via Phone / WhatsApp / Zalo", "お電話・Zaloにて折り返しご連絡"),
      tr("Trong vòng 24 giờ làm việc kể từ khi bạn gửi.", "Within 24 working hours of submission.", "お申し込みから24営業時間以内にご連絡します。")
    ],
    [
      tr("Test đầu vào 15 phút cùng Sensei", "15-minute 1-on-1 placement check with Sensei", "講師との15分間レベルチェック"),
      tr("Đánh giá cả 4 kỹ năng nghe – nói – đọc – viết.", "Comprehensive evaluation across reading, listening, and speaking.", "読む・聞く・話す・書くの4技能を総合的に診断します。")
    ],
    [
      tr("Nhận lộ trình & xếp lớp", "Receive tailored curriculum & class placement", "学習プランのご提案・クラス分け"),
      tr("Lịch học, học phí và mục tiêu đầu ra rõ ràng.", "Clear timetable, tuition, and guaranteed milestones.", "スケジュール・受講料・到達目標を明確にご案内します。")
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
  const { t, lang, tr } = useTranslation();
  const [values, setValues] = useState<Values>({
    fullName: "",
    phone: "",
    level: prefill.level ?? "",
    goal: prefill.goal ?? "",
    note: "",
  });
  const [course, setCourse] = useState(prefill.course ?? "");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const levelOptions = [
    tr("Mới bắt đầu", "Beginner (Zero)", "入門（ゼロから）"),
    "N5", "N4", "N3", "N2", "N1"
  ];
  const goalOptions = [
    tr("Thi chứng chỉ JLPT", "Pass JLPT Certification", "JLPT資格取得"),
    tr("Du học Nhật Bản", "Study in Japan", "日本留学"),
    tr("Làm việc tại Nhật (kỹ sư, TTS, tokutei)", "Work in Japan (Engineer, Tokutei, Trainee)", "日本での就職（エンジニア・特定技能・実習生）"),
    tr("Làm việc ở công ty Nhật tại Việt Nam", "Work for Japanese Firms in Vietnam", "ベトナムの日系企業での勤務"),
    tr("Giao tiếp / Kaiwa", "Conversational Japanese (Kaiwa)", "日常・ビジネス会話（Kaiwa）"),
    tr("Sở thích, văn hóa Nhật", "Personal Interest & Japanese Culture", "趣味・日本文化"),
  ];

  const set = (key: keyof Values, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (touched[key]) setErrors((prev) => ({ ...prev, [key]: validate(next, lang)[key] }));
  };

  const blur = (key: keyof Values) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validate(values, lang)[key] }));
  };

  // Guard against IME (Japanese / Vietnamese Telex) Enter submitting mid-composition.
  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values, lang);
    setErrors(errs);
    setTouched({ fullName: true, phone: true, level: true, goal: true, note: true });
    const firstInvalid = (Object.keys(errs) as (keyof Values)[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      toast.error(tr("Thông tin chưa đầy đủ", "Incomplete Information", "入力内容が不十分です"), {
        description: tr("Vui lòng kiểm tra các ô được đánh dấu.", "Please review the highlighted fields.", "赤枠の項目をご確認ください。")
      });
      return;
    }

    setSubmitting(true);
    const fullNameClean = values.fullName.trim();
    const phoneClean = normalizePhone(values.phone);
    const noteClean = [course && `Interested: ${course}`, values.note.trim()].filter(Boolean).join(" · ") || undefined;

    let savedViaApi = false;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullNameClean,
          phone: phoneClean,
          currentLevel: values.level,
          targetGoal: values.goal,
          notes: noteClean,
          website: honeypot,
        }),
      });
      if (res.status === 429) {
        setSubmitting(false);
        toast.error(
          tr(
            "Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau ít phút.",
            "Too many submissions. Please try again in a few minutes.",
            "送信回数が上限に達しました。しばらくしてからお試しください。"
          )
        );
        return;
      }
      if (res.ok) {
        savedViaApi = true;
      }
    } catch {
      // Fall back to direct Firestore write below
    }

    if (!savedViaApi) {
      saveLead({
        fullName: fullNameClean,
        phone: phoneClean,
        level: values.level,
        goal: values.goal,
        note: noteClean,
        source: prefill.testScore !== undefined ? "Thi thử Mini" : "Form tư vấn",
        testScore: prefill.testScore,
      });
    }

    setSubmitting(false);
    toast.success(
      tr(
        `Cảm ơn ${fullNameClean}! ありがとうございます`,
        `Thank you, ${fullNameClean}! ありがとうございます`,
        `${fullNameClean}様、ありがとうございます！`
      ),
      {
        description: tr(
          `Shinme sẽ liên hệ qua số ${values.phone.trim()} trong 24 giờ làm việc.`,
          `Shinme will reach out via ${values.phone.trim()} within 24 working hours.`,
          `24営業時間以内に ${values.phone.trim()} までご連絡いたします。`
        ),
      }
    );
    setValues({ fullName: "", phone: "", level: "", goal: "", note: "" });
    setCourse("");
    setHoneypot("");
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
      {/* Honeypot anti-bot field */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
      {prefill.testScore !== undefined && (
        <p className="mb-5 rounded-xl bg-shinme-leaf px-4 py-3 text-sm font-bold text-shinme-primary">
          {tr(
            `Kết quả Thi thử Mini của bạn: ${prefill.testScore}/5 câu đúng — Sensei sẽ dùng kết quả này khi tư vấn.`,
            `Your Placement Test result: ${prefill.testScore}/5 correct — Sensei will reference this during consultation.`,
            `ミニテスト結果：5問中 ${prefill.testScore}問正解 — カウンセリング時の参考にいたします。`
          )}
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
            {tr("Trình độ hiện tại", "Current Level", "現在のレベル")} <span className="text-shinme-danger">*</span>
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
              {tr("Chọn trình độ", "Select Level", "レベルを選択")}
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
              {tr("Chọn mục tiêu", "Select Goal", "目標を選択")}
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
            <p className="text-sm font-extrabold">{tr("Khóa học quan tâm", "Selected Course", "ご希望のコース")}</p>
            <span className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-shinme-leaf py-1.5 pl-4 pr-1.5 text-sm font-bold text-shinme-primary">
              {course}
              <button
                type="button"
                onClick={() => setCourse("")}
                aria-label={tr(`Bỏ chọn khóa ${course}`, `Deselect course ${course}`, `コース ${course} の選択を解除`)}
                className="grid size-6 place-items-center rounded-full hover:bg-shinme-accent-soft cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="note" className="text-sm font-extrabold">
            {t.home.consultation.noteLabel} <span className="font-semibold text-shinme-muted">({tr("không bắt buộc", "optional", "任意")})</span>
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
        {tr(
          "Thông tin của bạn chỉ dùng để Shinme liên hệ tư vấn, không chia sẻ cho bên thứ ba.",
          "Your information is strictly used for Shinme's academic advisory and never shared with third parties.",
          "ご入力いただいた情報は学習相談のみに使用し、第三者に提供することはありません。"
        )}
      </p>
    </form>
  );
}
