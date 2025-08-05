'use client';

import { useState, useEffect } from 'react';
import ChatListPage from './components/qq/ChatListPage';
import DesktopPage from './components/DesktopPage';
import ShoppingPage from './components/shopping/ShoppingPage';
import DiscoverPage from './components/discover/DiscoverPage';
import PageTransitionManager from './components/utils/PageTransitionManager';
import { dataManager } from './utils/dataManager';
import MePage from './components/qq/me/MePage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'desktop' | 'chat' | 'shopping' | 'discover' | 'me'>('desktop');
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

  // 监听API配置变更
  useEffect(() => {
    const handleApiConfigChange = async () => {
      try {
        await dataManager.initDB();
        const config = await dataManager.getApiConfig();
        console.log('Home - 监听到API配置变更，重新加载:', {
          proxyUrl: config.proxyUrl,
          apiKey: config.apiKey ? '已设置' : '未设置',
          model: config.model
        });
        setApiConfig(config);
      } catch (error) {
        console.error('Failed to reload API config in Home:', error);
        // 回退到localStorage
        const savedApiConfig = localStorage.getItem('apiConfig');
        if (savedApiConfig) {
          const parsedConfig = JSON.parse(savedApiConfig);
          setApiConfig(parsedConfig);
        }
      }
    };

    window.addEventListener('apiConfigChanged', handleApiConfigChange);
    
    return () => {
      window.removeEventListener('apiConfigChanged', handleApiConfigChange);
    };
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
    } else if (appName === 'discover') {
      setCurrentPage('discover');
    }
    // 其他应用的处理逻辑可以在这里添加
  };

  // 监听动态页面的导航事件
  useEffect(() => {
    const handleNavigateToChat = () => {
      console.log('Home - 收到跳转到聊天页面事件');
      setCurrentPage('chat');
    };

    const handleNavigateToMe = () => {
      console.log('Home - 收到跳转到个人页面事件');
      setCurrentPage('me');
    };

    const handleNavigateToDiscover = () => {
      console.log('Home - 收到跳转到动态页面事件');
      setCurrentPage('discover');
    };

    window.addEventListener('navigateToChat', handleNavigateToChat);
    window.addEventListener('navigateToMe', handleNavigateToMe);
    window.addEventListener('navigateToDiscover', handleNavigateToDiscover);
    
    return () => {
      window.removeEventListener('navigateToChat', handleNavigateToChat);
      window.removeEventListener('navigateToMe', handleNavigateToMe);
      window.removeEventListener('navigateToDiscover', handleNavigateToDiscover);
    };
  }, []);

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
    },
    {
      id: 'discover',
      component: <DiscoverPage />,
      direction: 'left' as const,
      duration: 350
    },
    {
      id: 'me',
      component: <MePage onBackToDesktop={handleBackToDesktop} />,
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
