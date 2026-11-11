import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-vn",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-vn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hệ thống Thông tin Quản lý Hành chính & Một cửa Điện tử",
  description:
    "Cổng Dịch vụ Hành chính công, Tiếp nhận & Giải quyết Hồ sơ Một cửa liên thông và Quản lý Văn bản Điều hành nội bộ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#f7f5f0] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
