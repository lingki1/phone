import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lingki-AI",
  description: "基于 Next.js 的 AI 聊天应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
