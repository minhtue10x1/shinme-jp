"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  FastForward,
  FileAudio,
  FileSpreadsheet,
  FileText,
  Headphones,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AudioTranscriptLine = {
  time: string;
  speaker: string;
  speakerJa: string;
  textJa: string;
  textVi: string;
};

const SAMPLE_TRANSCRIPT: AudioTranscriptLine[] = [
  {
    time: "00:03",
    speaker: "Nam",
    speakerJa: "ナム",
    textJa: "すみません、東京[とうきょう]駅[えき]へ 行[い]きたいんですが、どの 電車[でんしゃ]に 乗[の]れば いいですか。",
    textVi: "Xin lỗi, tôi muốn đi đến ga Tokyo, tôi nên đi chuyến tàu nào ạ?",
  },
  {
    time: "00:10",
    speaker: "Nhân viên ga",
    speakerJa: "駅員[えきいん]",
    textJa: "あちらの 3番線[ばんせん]の 山手線[やまのてせん]に 乗[の]って ください。次[つぎ]の 電車[でんしゃ]は 10分後[じゅっぷんご]に 来[き]ますよ。",
    textVi: "Bạn hãy lên tuyến Yamanote ở đường ray số 3 đằng kia nhé. Chuyến tiếp theo sẽ đến sau 10 phút nữa.",
  },
  {
    time: "00:18",
    speaker: "Nam",
    speakerJa: "ナム",
    textJa: "わかりました！切符[きっぷ]は どこで 買[か]えますか。",
    textVi: "Tôi hiểu rồi! Tôi có thể mua vé ở đâu ạ?",
  },
  {
    time: "00:24",
    speaker: "Nhân viên ga",
    speakerJa: "駅員[えきいん]",
    textJa: "あそこの 自動券売機[じどうけんばいき]で 買[か]えます。ICカードも 使[つか]えますよ。",
    textVi: "Bạn có thể mua tại máy bán vé tự động đằng kia. Cũng dùng được cả thẻ IC nữa nhé.",
  },
  {
    time: "00:30",
    speaker: "Nam",
    speakerJa: "ナム",
    textJa: "ありがとうございます！助[たす]かりました。",
    textVi: "Cảm ơn anh rất nhiều! May quá.",
  },
];

export function ChokaiAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [showVi, setShowVi] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const totalDuration = 36; // 36 seconds sample

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = (currentTime / totalDuration) * 100;

  return (
    <div className="rounded-3xl border-2 border-shinme-accent/40 bg-shinme-surface p-6 shadow-[var(--shadow-lift)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-shinme-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
            <Headphones className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-shinme-primary text-white text-[0.65rem] font-black uppercase px-2 py-0.5">
                Chokai Player
              </span>
              <h2 className="text-base font-black text-shinme-ink">
                Luyện nghe: Bài 24 — Hội thoại tại ga tàu (駅での会話)
              </h2>
            </div>
            <p className="text-xs text-shinme-muted mt-0.5">
              Tốc độ nghe điều chỉnh được · Kèm transcript Furigana & dịch nghĩa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVi((prev) => !prev)}
            className="h-8 text-xs font-bold"
          >
            {showVi ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {showVi ? "Ẩn dịch tiếng Việt" : "Hiện dịch tiếng Việt"}
          </Button>
        </div>
      </div>

      {/* Audio Controller Bar */}
      <div className="mt-5 rounded-2xl bg-shinme-bg p-5 border border-shinme-line">
        {/* Scrubber Bar */}
        <div className="space-y-1.5">
          <div className="relative h-3 w-full cursor-pointer rounded-full bg-shinme-line overflow-hidden">
            <div
              className="h-full bg-shinme-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono font-bold text-shinme-muted tabular">
            <span>{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(totalDuration)}</span>
          </div>
        </div>

        {/* Buttons Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentTime((t) => Math.max(0, t - 5))}
              className="grid size-9 place-items-center rounded-full bg-shinme-surface text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary transition-colors border border-shinme-border text-xs font-bold"
              title="Lùi 5 giây"
            >
              -5s
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="grid size-12 place-items-center rounded-full bg-shinme-primary text-white shadow-md hover:bg-shinme-primary-hover transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTime((t) => Math.min(totalDuration, t + 5))}
              className="grid size-9 place-items-center rounded-full bg-shinme-surface text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary transition-colors border border-shinme-border text-xs font-bold"
              title="Tua 5 giây"
            >
              +5s
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              className="grid size-9 place-items-center rounded-full bg-shinme-surface text-shinme-muted hover:text-shinme-ink transition-colors border border-shinme-border"
              title="Phát lại từ đầu"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 rounded-full bg-shinme-surface p-1 border border-shinme-border">
            <span className="px-2 text-xs font-black text-shinme-muted">Tốc độ:</span>
            {[0.8, 1.0, 1.2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-black transition-colors tabular",
                  speed === s
                    ? "bg-shinme-primary text-white shadow-xs"
                    : "text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Script Transcript */}
      <div className="mt-5 space-y-3">
        <h3 className="text-xs font-black uppercase text-shinme-muted tracking-wider">
          Lời thoại (Transcript & Furigana)
        </h3>

        <div className="divide-y divide-shinme-line rounded-2xl border border-shinme-border bg-shinme-surface">
          {SAMPLE_TRANSCRIPT.map((line, idx) => (
            <div key={idx} className="p-4 hover:bg-shinme-leaf-faint/60 transition-colors">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-shinme-accent tabular">{line.time}</span>
                <span className="text-xs font-black text-shinme-primary">
                  {line.speaker} (<FuriganaText text={line.speakerJa} />)
                </span>
              </div>
              <p className="mt-1 text-base font-bold text-shinme-ink leading-relaxed">
                <FuriganaText text={line.textJa} />
              </p>
              {showVi && (
                <p className="mt-1 text-xs font-medium text-shinme-muted">
                  {line.textVi}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

