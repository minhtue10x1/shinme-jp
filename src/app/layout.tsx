import type { Metadata } from "next";
import { Noto_Sans_JP, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n/context";
import { RoleProvider } from "@/lib/role-context";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shinme-jp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shinme — Trung tâm Nhật ngữ | 日本語で未来をひらく",
    template: "%s · Shinme",
  },
  description:
    "Trung tâm Nhật ngữ Shinme: lộ trình JLPT N5–N1 và Kaiwa cùng Sensei bản xứ & Việt Nam. Test trình độ miễn phí, đăng ký tư vấn lộ trình học.",
  keywords: [
    "Trung tâm tiếng Nhật Shinme",
    "học tiếng Nhật online",
    "luyện thi JLPT N5 N4 N3 N2 N1",
    "Kaiwa tiếng Nhật",
    "Shinme LMS",
  ],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    alternateLocale: ["en_US", "ja_JP"],
    url: SITE_URL,
    siteName: "Shinme Japanese Language Center",
    title: "Shinme — Trung tâm Nhật ngữ | 日本語で未来をひらく",
    description:
      "Lộ trình tiếng Nhật JLPT N5–N1 và Kaiwa bài bản cùng Sensei bản xứ & Việt Nam. Tích hợp Cổng học tập LMS hiện đại.",
    images: [
      {
        url: "/brand/shinme-mascot.jpg",
        width: 800,
        height: 800,
        alt: "Shinme Japanese Language Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shinme — Trung tâm Nhật ngữ | 日本語で未来をひらく",
    description:
      "Lộ trình JLPT N5–N1 & Kaiwa cùng Sensei bản xứ và Việt Nam. Test trình độ tiếng Nhật miễn phí.",
    images: ["/brand/shinme-mascot.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${nunito.variable} ${notoJp.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <RoleProvider>
            {children}
          </RoleProvider>
        </LanguageProvider>
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

