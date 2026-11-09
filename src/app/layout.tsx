import type { Metadata } from "next";
import { Noto_Sans_JP, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Shinme — Trung tâm Nhật ngữ | 日本語で未来をひらく",
    template: "%s · Shinme",
  },
  description:
    "Trung tâm Nhật ngữ Shinme: lộ trình JLPT N5–N1 và Kaiwa cùng Sensei bản xứ & Việt Nam. Test trình độ miễn phí, đăng ký tư vấn lộ trình học.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${nunito.variable} ${notoJp.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-2xl !border !border-shinme-border !bg-shinme-surface !text-shinme-ink !font-sans !shadow-[var(--shadow-lift)]",
              title: "!font-bold",
              description: "!text-shinme-muted",
            },
          }}
        />
      </body>
    </html>
  );
}

