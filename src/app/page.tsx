'use client';

import { useState, useEffect } from 'react';
import ChatListPage from './components/qq/ChatListPage';
import DesktopPage from './components/DesktopPage';
import ShoppingPage from './components/shopping/ShoppingPage';
import DiscoverPage from './components/discover/DiscoverPage';
import PageTransitionManager from './components/utils/PageTransitionManager';
import BottomNavigation from './components/qq/BottomNavigation';
import { dataManager } from './utils/dataManager';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'desktop' | 'chat' | 'shopping' | 'discover'>('desktop');
  const [apiConfig, setApiConfig] = useState({
    proxyUrl: '',
    apiKey: '',
    model: ''
  });
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [newContentCount, setNewContentCount] = useState<{
    moments?: number;
    messages?: number;
  }>({});

  // 加载API配置和用户余额
  useEffect(() => {
    const loadData = async () => {
      try {
        await dataManager.initDB();
        
        // 并行加载API配置、用户余额和新内容计数
        const [config, balance] = await Promise.all([
          dataManager.getApiConfig(),
          dataManager.getBalance()
        ]);
        
        setApiConfig(config);
        setUserBalance(balance);
        
        // 计算新内容计数
        try {
          const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
          setNewContentCount({
            moments: newPostsCount + newCommentsCount
          });
        } catch (error) {
          console.warn('Failed to calculate new content count:', error);
        }
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

  // 监听动态页面的导航事件和新内容更新
  useEffect(() => {
    const handleNavigateToChat = () => {
      console.log('Home - 收到跳转到聊天页面事件');
      setCurrentPage('chat');
    };

    const handleNavigateToMe = () => {
      console.log('Home - 收到跳转到个人页面事件');
      // 暂时跳转到聊天页面，因为个人页面在聊天页面内部
      setCurrentPage('chat');
      // 延迟一下再触发个人页面的显示
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showMePage'));
      }, 100);
    };

    // 监听新内容更新事件
    const handleNewContentUpdate = async () => {
      try {
        const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
        setNewContentCount(prev => ({
          ...prev,
          moments: newPostsCount + newCommentsCount
        }));
      } catch (error) {
        console.warn('Failed to update new content count:', error);
      }
    };

    // 监听查看状态更新事件
    const handleViewStateUpdate = async () => {
      try {
        const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
        setNewContentCount(prev => ({
          ...prev,
          moments: newPostsCount + newCommentsCount
        }));
      } catch (error) {
        console.warn('Failed to update new content count after view state change:', error);
      }
    };

    // 监听个人页面显示事件
    const handleShowMePage = () => {
      setCurrentMePage('me');
    };



    window.addEventListener('navigateToChat', handleNavigateToChat);
    window.addEventListener('navigateToMe', handleNavigateToMe);
    window.addEventListener('showMePage', handleShowMePage);
    window.addEventListener('aiPostGenerated', handleNewContentUpdate);
    window.addEventListener('aiCommentsGenerated', handleNewContentUpdate);
    window.addEventListener('viewStateUpdated', handleViewStateUpdate);
    
    return () => {
      window.removeEventListener('navigateToChat', handleNavigateToChat);
      window.removeEventListener('navigateToMe', handleNavigateToMe);
      window.removeEventListener('showMePage', handleShowMePage);
      window.removeEventListener('aiPostGenerated', handleNewContentUpdate);
      window.removeEventListener('aiCommentsGenerated', handleNewContentUpdate);
      window.removeEventListener('viewStateUpdated', handleViewStateUpdate);
    };
  }, []);

  const handleBackToDesktop = () => {
    setCurrentPage('desktop');
    // 返回桌面时刷新余额
    refreshBalance();
  };

  // 处理底部导航点击
  const handleBottomNavChange = async (view: string) => {
    if (view === 'moments') {
      setCurrentPage('discover');
      // 用户进入动态页面，清除新内容计数
      setNewContentCount(prev => ({
        ...prev,
        moments: 0
      }));
    } else if (view === 'messages') {
      setCurrentPage('chat');
      setCurrentMePage('chat');
      // 延迟一下再触发消息页面的显示
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showMessages'));
      }, 100);
    } else if (view === 'me') {
      setCurrentPage('chat');
      setCurrentMePage('me');
      // 延迟一下再触发个人页面的显示
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showMePage'));
      }, 100);
    }
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
    }
  ];

  const [currentMePage, setCurrentMePage] = useState<'chat' | 'me'>('chat');

  // 确定当前活跃的底部导航项
  const getActiveView = () => {
    if (currentPage === 'discover') return 'moments';
    if (currentPage === 'chat') {
      return currentMePage === 'me' ? 'me' : 'messages';
    }
    return 'messages'; // 默认
  };

  return (
    <div className="app-container">
      <PageTransitionManager
        pages={pages}
        currentPageId={currentPage}
        defaultDirection="left"
        defaultDuration={350}
      />
      
      {/* 统一的底部导航 - 只在非桌面页面显示 */}
      {currentPage !== 'desktop' && (
        <BottomNavigation
          activeView={getActiveView()}
          onViewChange={handleBottomNavChange}
          newContentCount={newContentCount}
        />
      )}
    </div>
  );
}
