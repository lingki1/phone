'use client';

import { useState, useEffect } from 'react';
import ChatListPage from './components/qq/ChatListPage';
import DesktopPage from './components/DesktopPage';
import ShoppingPage from './components/shopping/ShoppingPage';
import DiscoverPage from './components/discover/DiscoverPage';
import RecollectionPage from './components/qq/recollection/RecollectionPage';
import PageTransitionManager from './components/utils/PageTransitionManager';
import { dataManager } from './utils/dataManager';
import MePage from './components/qq/me/MePage';
// 公告展示仅在 DesktopPage 中渲染，这里不再引入
// import { FirstLoadPage } from './components/firstloadpage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'desktop' | 'chat' | 'shopping' | 'discover' | 'recollection' | 'me'>('desktop');
  const [apiConfig, setApiConfig] = useState({
    proxyUrl: '',
    apiKey: '',
    model: ''
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // 公告列表状态移至 DesktopPage 内部

  // 不在首页自动请求 /api/auth/me，未登录时允许自由浏览

  // 加载API配置和用户余额
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        await dataManager.initDB();
        
        // 加载API配置
        const config = await dataManager.getApiConfig();
        setApiConfig(config);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, [isAuthenticated]);

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

  // 未登录允许任意点击，不强制弹出登录

  // 这里不再负责公告数据加载

  // 开发环境自动初始化数据库（调用后端 /api/init）
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    // 仅在开发环境尝试初始化一次，不阻塞UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    fetch('/api/init', { method: 'POST', signal: controller.signal })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));
  }, []);


  const handleOpenApp = async (appName: string) => {
    if (appName === 'qq') {
      setCurrentPage('chat');
    } else if (appName === 'shopping') {
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

    const handleNavigateToRecollection = () => {
      console.log('Home - 收到跳转到回忆页面事件');
      setCurrentPage('recollection');
    };

    window.addEventListener('navigateToChat', handleNavigateToChat);
    window.addEventListener('navigateToMe', handleNavigateToMe);
    window.addEventListener('navigateToDiscover', handleNavigateToDiscover);
    window.addEventListener('navigateToRecollection', handleNavigateToRecollection);
    const handleAuthLoginSuccess = (_e: Event) => {
      setIsAuthenticated(true);
    };
    window.addEventListener('auth:login-success', handleAuthLoginSuccess as EventListener);
    const handleAuthLogout = (_e: Event) => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleAuthLogout as EventListener);
    
    return () => {
      window.removeEventListener('navigateToChat', handleNavigateToChat);
      window.removeEventListener('navigateToMe', handleNavigateToMe);
      window.removeEventListener('navigateToDiscover', handleNavigateToDiscover);
      window.removeEventListener('navigateToRecollection', handleNavigateToRecollection);
      window.removeEventListener('auth:login-success', handleAuthLoginSuccess as EventListener);
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
    };
  }, []);

  const handleBackToDesktop = () => {
    setCurrentPage('desktop');
  };



  // 登录成功由事件驱动，此处不再保留未使用的回调

  // 处理退出登录
  const handleLogout = () => {
    setIsAuthenticated(false);
    // 重置API配置
    setApiConfig({
      proxyUrl: '',
      apiKey: '',
      model: ''
    });
  };

  const pages = [
    {
      id: 'desktop',
      component: <DesktopPage onOpenApp={handleOpenApp} onLogout={handleLogout} isAuthenticated={isAuthenticated} />,
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
      id: 'recollection',
      component: <RecollectionPage />,
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
    <>
      {/* 始终显示桌面页面作为背景 */}
      <div className="app-container">
        <PageTransitionManager
          pages={pages}
          currentPageId={currentPage}
          defaultDirection="left"
          defaultDuration={350}
        />
      </div>
      
      {/* 公告在 DesktopPage 内部渲染 */}
    </>
  );
}
