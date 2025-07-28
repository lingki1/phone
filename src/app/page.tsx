'use client';

import { useState } from 'react';
import ChatListPage from './components/qq/ChatListPage';
import DesktopPage from './components/DesktopPage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'desktop' | 'chat'>('desktop');

  const handleOpenApp = (appName: string) => {
    if (appName === 'qq') {
      setCurrentPage('chat');
    }
    // 其他应用的处理逻辑可以在这里添加
  };

  const handleBackToDesktop = () => {
    setCurrentPage('desktop');
  };

  return (
    <div className="app-container">
      {currentPage === 'desktop' ? (
        <DesktopPage onOpenApp={handleOpenApp} />
      ) : (
        <ChatListPage onBackToDesktop={handleBackToDesktop} />
      )}
    </div>
  );
}
