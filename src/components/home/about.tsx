import { BookOpenCheck, Sprout, UsersRound } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";

const PRINCIPLES = [
  {
    icon: Sprout,
    title: "Lộ trình lớn lên như một cái cây",
    body: "Mỗi cấp độ JLPT là một giai đoạn trưởng thành có mục tiêu đo được. Bạn luôn biết mình đang ở đâu và bước tiếp theo là gì.",
  },
  {
    icon: UsersRound,
    title: "Lớp nhỏ, Sensei theo sát từng người",
    body: "Tối đa 12 học viên mỗi lớp. Sensei người Việt giải thích ngữ pháp rõ ràng, Sensei người Nhật rèn phát âm và phản xạ Kaiwa.",
  },
  {
    icon: BookOpenCheck,
    title: "Học trên lớp, luyện trên Cổng học viên",
    body: "Tài liệu, bài tập và Mondai luyện thi nằm gọn trên hệ thống LMS — nộp bài, nhận nhận xét và theo dõi tiến độ mọi lúc.",
  },
];

export function About() {
  return (
    <section id="ve-shinme" aria-labelledby="about-title" className="border-y border-shinme-line bg-shinme-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 lg:px-8 lg:py-28">
        <div>
          <h2 id="about-title" className="text-balance text-3xl font-extrabold leading-tight text-shinme-ink sm:text-4xl">
            Shinme — <FuriganaText text="新芽[しんめ]" className="text-shinme-primary" /> — nghĩa là “chồi non”.
          </h2>
          <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-shinme-muted">
            Chúng tôi tin rằng ai cũng có thể nói tiếng Nhật nếu được gieo đúng hạt giống và chăm sóc đều đặn.
            Shinme là nơi những chồi non ấy được ươm mầm — từ buổi học bảng chữ cái đầu tiên đến ngày bạn tự tin
            phỏng vấn, du học hay làm việc cùng người Nhật.
          </p>
        </div>

        <ul className="divide-y divide-shinme-line">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
                <Icon className="size-6" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-shinme-ink">{title}</h3>
                <p className="mt-1.5 max-w-[60ch] leading-relaxed text-shinme-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

