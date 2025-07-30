import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider, { ThemeErrorBoundary } from "./components/theme/ThemeProvider";
import ThemeInitScript from "./components/theme/ThemeInitScript";

export const metadata: Metadata = {
  title: "Lingki-AI",
  description: "基于 Next.js 的 AI 聊天应用",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lingki-AI"
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#007bff"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lingki-AI" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#007bff" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <ThemeInitScript />
      </head>
      <body>
        <ThemeErrorBoundary>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ThemeErrorBoundary>
      </body>
    </html>
  );
}
