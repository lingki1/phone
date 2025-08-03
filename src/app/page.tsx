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
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // 加载API配置和用户余额
  useEffect(() => {
    const loadData = async () => {
      try {
        await dataManager.initDB();
        
        // 并行加载API配置和用户余额
        const [config, balance] = await Promise.all([
          dataManager.getApiConfig(),
          dataManager.getBalance()
        ]);
        
        setApiConfig(config);
        setUserBalance(balance);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    loadData();
  }, []);

  // 刷新余额
  const refreshBalance = async () => {
    try {
      const balance = await dataManager.getBalance();
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const handleOpenApp = async (appName: string) => {
    if (appName === 'qq') {
      setCurrentPage('chat');
    } else if (appName === 'shopping') {
      // 检查余额是否足够
      if (userBalance < 5) {
        alert(`余额不足！当前余额：¥${userBalance.toFixed(2)}，需要至少 ¥5.00 才能进入购物页面。\n\n您可以通过与AI角色聊天来获得虚拟货币。`);
        return;
      }
      setCurrentPage('shopping');
    }
    // 其他应用的处理逻辑可以在这里添加
  };

  const handleBackToDesktop = () => {
    setCurrentPage('desktop');
    // 返回桌面时刷新余额
    refreshBalance();
  };

  const pages = [
    {
      id: 'desktop',
      component: <DesktopPage onOpenApp={handleOpenApp} userBalance={userBalance} isLoadingBalance={isLoadingBalance} />,
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
