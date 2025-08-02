'use client';

import { useState, useEffect } from 'react';
import ChatListPage from './components/qq/ChatListPage';
import DesktopPage from './components/DesktopPage';
import ShoppingPage from './components/shopping/ShoppingPage';
import PageTransitionManager from './components/utils/PageTransitionManager';
import { dataManager } from './utils/dataManager';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'desktop' | 'chat' | 'shopping'>('desktop');
  const [apiConfig, setApiConfig] = useState({
    proxyUrl: '',
    apiKey: '',
    model: ''
  });

  // 加载API配置
  useEffect(() => {
    const loadApiConfig = async () => {
      try {
        await dataManager.initDB();
        const config = await dataManager.getApiConfig();
        setApiConfig(config);
      } catch (error) {
        console.error('Failed to load API config:', error);
      }
    };
    
    loadApiConfig();
  }, []);

  const handleOpenApp = (appName: string) => {
    if (appName === 'qq') {
      setCurrentPage('chat');
    } else if (appName === 'shopping') {
      setCurrentPage('shopping');
    }
    // 其他应用的处理逻辑可以在这里添加
  };

  const handleBackToDesktop = () => {
    setCurrentPage('desktop');
  };

  const pages = [
    {
      id: 'desktop',
      component: <DesktopPage onOpenApp={handleOpenApp} />,
      direction: 'fade' as const,
      duration: 400
    },
    {
      id: 'chat',
      component: <ChatListPage onBackToDesktop={handleBackToDesktop} />,
      direction: 'left' as const,
      duration: 350
    },
    {
      id: 'shopping',
      component: <ShoppingPage apiConfig={apiConfig} onBack={handleBackToDesktop} />,
      direction: 'left' as const,
      duration: 350
    }
  ];

  return (
    <div className="app-container">
      <PageTransitionManager
        pages={pages}
        currentPageId={currentPage}
        defaultDirection="left"
        defaultDuration={350}
      />
    </div>
  );
}
