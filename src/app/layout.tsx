import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider, { ThemeErrorBoundary } from "./components/theme/ThemeProvider";
import ThemeInitScript from "./components/theme/ThemeInitScript";
import ViewportHandler from "./components/utils/ViewportHandler";
import { AiPendingProvider } from "./components/async";
import { NotificationProvider } from "./components/notice";
import { AudioProvider, FloatingAudioButton, AudioPlayer } from "@audio";
import { I18nProvider } from "./components/i18n/I18nProvider";
import AudioEventsBridge from "./components/audio/AudioEventsBridge";
import AudioHelpPortal from "./components/audio/AudioHelpPortal";

export const metadata: Metadata = {
  title: "Lingki-AI",
  description: "基于 Next.js 的 AI 聊天应用",
  appleWebApp: {
    capable: false,
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: "auto",
  themeColor: "#007bff"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <ThemeInitScript />
      </head>
      <body>
        <ThemeErrorBoundary>
          <I18nProvider>
            <ThemeProvider>
              <NotificationProvider>
                <AiPendingProvider>
                  <ViewportHandler />
                  <AudioProvider>
                    {children}
                    <AudioEventsBridge />
                    <AudioHelpPortal />
                    <FloatingAudioButton />
                    <AudioPlayer />
                  </AudioProvider>
                </AiPendingProvider>
              </NotificationProvider>
            </ThemeProvider>
          </I18nProvider>
        </ThemeErrorBoundary>
      </body>
    </html>
  );
}
