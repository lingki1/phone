'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { dataManager } from '../../../utils/dataManager';
import ColorSettingsPage from '../../settings/ColorSettingsPage';
import ApiSettingsModal from '../ApiSettingsModal';
import PageTransitionManager from '../../utils/PageTransitionManager';
import PresetManagerPage from '../preset/PresetManagerPage';
import DataBackupManager from '../backup/DataBackupManager';
import BottomNavigation from '../BottomNavigation';
import PersonalSettingsModal from '../PersonalSettingsModal';
import './MePage.css';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface MePageProps {
  onBackToDesktop?: () => void;
}

export default function MePage({ onBackToDesktop }: MePageProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = onBackToDesktop; // 暂时保留参数，避免 ESLint 警告
  const [personalSettings, setPersonalSettings] = useState<PersonalSettings>({
    userAvatar: '/avatars/user-avatar.svg',
    userNickname: '用户',
    userBio: ''
  });
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'color-settings' | 'preset-manager'>('main');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showDataBackup, setShowDataBackup] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    proxyUrl: '',
    apiKey: '',
    model: ''
  });
  const [showPersonalSettings, setShowPersonalSettings] = useState(false);

  // 新内容计数状态
  const [newContentCount, setNewContentCount] = useState<{
    moments?: number;
    messages?: number;
  }>({});

  // 加载新内容计数
  useEffect(() => {
    const loadNewContentCount = async () => {
      try {
        const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
        setNewContentCount({
          moments: newPostsCount + newCommentsCount
        });
      } catch (error) {
        console.warn('Failed to load new content count:', error);
      }
    };

    loadNewContentCount();
  }, []);

  // 监听新内容更新事件
  useEffect(() => {
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

    window.addEventListener('aiPostGenerated', handleNewContentUpdate);
    window.addEventListener('aiCommentsGenerated', handleNewContentUpdate);
    window.addEventListener('viewStateUpdated', handleNewContentUpdate);
    
    return () => {
      window.removeEventListener('aiPostGenerated', handleNewContentUpdate);
      window.removeEventListener('aiCommentsGenerated', handleNewContentUpdate);
      window.removeEventListener('viewStateUpdated', handleNewContentUpdate);
    };
  }, []);

  // 加载个人信息和余额
  useEffect(() => {
    const loadData = async () => {
      try {
        await dataManager.initDB();
        
        // 加载个人信息
        const settings = await dataManager.getPersonalSettings();
        setPersonalSettings(settings);
        
        // 加载余额
        const userBalance = await dataManager.getBalance();
        setBalance(userBalance);
        
        // 加载API配置
        try {
          const savedApiConfig = await dataManager.getApiConfig();
          console.log('MePage - 从数据库加载API配置:', {
            proxyUrl: savedApiConfig.proxyUrl,
            apiKey: savedApiConfig.apiKey ? '已设置' : '未设置',
            model: savedApiConfig.model
          });
          setApiConfig(savedApiConfig);
        } catch (error) {
          console.error('Failed to load API config from database:', error);
          // 回退到localStorage
          const savedApiConfig = localStorage.getItem('apiConfig');
          if (savedApiConfig) {
            const parsedConfig = JSON.parse(savedApiConfig);
            console.log('MePage - 从localStorage加载API配置:', {
              proxyUrl: parsedConfig.proxyUrl,
              apiKey: parsedConfig.apiKey ? '已设置' : '未设置',
              model: parsedConfig.model
            });
            setApiConfig(parsedConfig);
          }
        }
      } catch (error) {
        console.error('Failed to load data from database:', error);
        // 回退到localStorage
        const savedPersonalSettings = localStorage.getItem('personalSettings');
        if (savedPersonalSettings) {
          setPersonalSettings(JSON.parse(savedPersonalSettings));
        }
        setBalance(0);
        
        // 加载API配置（回退到localStorage）
        const savedApiConfig = localStorage.getItem('apiConfig');
        if (savedApiConfig) {
          setApiConfig(JSON.parse(savedApiConfig));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 添加余额刷新功能
  const refreshBalance = async () => {
    try {
      await dataManager.initDB();
      const userBalance = await dataManager.getBalance();
      setBalance(userBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  // 页面获得焦点时刷新余额
  useEffect(() => {
    const handleFocus = () => {
      refreshBalance();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 处理选项点击
  const handleOptionClick = (option: string) => {
    switch (option) {
      case 'api-settings':
        setShowApiSettings(true);
        break;
      case 'personal-settings':
        setShowPersonalSettings(true);
        break;
      case 'color-settings':
        setCurrentPage('color-settings');
        break;
      case 'preset-manager':
        setCurrentPage('preset-manager');
        break;
      case 'data-backup':
        setShowDataBackup(true);
        break;
      default:
        break;
    }
  };

  // 处理返回主页面
  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  // 处理API设置保存
  const handleApiSettingsSave = async (config: { proxyUrl: string; apiKey: string; model: string }) => {
    console.log('MePage - 保存API配置:', {
      proxyUrl: config.proxyUrl,
      apiKey: config.apiKey ? '已设置' : '未设置',
      model: config.model
    });
    
    setApiConfig(config);
    
    try {
      // 保存到数据库
      await dataManager.initDB();
      await dataManager.saveApiConfig(config);
      console.log('MePage - API配置已保存到数据库:', {
        proxyUrl: config.proxyUrl,
        apiKey: config.apiKey ? '已设置' : '未设置',
        model: config.model
      });
      
      // 触发API配置变更事件，通知其他组件
      window.dispatchEvent(new CustomEvent('apiConfigChanged'));
      console.log('MePage - 已触发apiConfigChanged事件');
    } catch (error) {
      console.error('Failed to save API config to database:', error);
      // 如果数据库保存失败，回退到localStorage
      localStorage.setItem('apiConfig', JSON.stringify(config));
      console.log('MePage - API配置已保存到localStorage');
      
      // 即使保存到localStorage也要触发事件
      window.dispatchEvent(new CustomEvent('apiConfigChanged'));
      console.log('MePage - 已触发apiConfigChanged事件（localStorage）');
    }
    
    setShowApiSettings(false);
  };

  // 处理API设置关闭
  const handleApiSettingsClose = () => {
    setShowApiSettings(false);
  };

  // 处理个人设置保存
  const handlePersonalSettingsSave = async (settings: PersonalSettings) => {
    try {
      // 保存到数据库
      await dataManager.initDB();
      await dataManager.savePersonalSettings(settings);
      console.log('个人设置已保存到数据库:', settings);
      
      // 更新本地状态
      setPersonalSettings(settings);
      
      // 触发全局事件，通知其他组件更新
      window.dispatchEvent(new CustomEvent('personalSettingsUpdated', { 
        detail: { settings } 
      }));
      
    } catch (error) {
      console.error('Failed to save personal settings to database:', error);
      // 如果数据库保存失败，回退到localStorage
      localStorage.setItem('personalSettings', JSON.stringify(settings));
      
      // 即使数据库保存失败，也更新本地状态
      setPersonalSettings(settings);
    }
    
    setShowPersonalSettings(false);
  };

  // 处理余额信息显示
  const handleBalanceInfo = () => {
    setShowBalanceInfo(!showBalanceInfo);
  };

  // 处理底部导航切换
  const handleViewChange = (view: string) => {
    if (view === 'messages') {
      // 跳转到消息页面
      window.dispatchEvent(new CustomEvent('navigateToChat'));
    } else if (view === 'moments') {
      // 跳转到动态页面
      window.dispatchEvent(new CustomEvent('navigateToDiscover'));
    }
    // 'me' 已经在当前页面，不需要处理
  };

  if (isLoading) {
    return (
      <div className="me-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  // 定义页面配置
  const pages = [
    {
      id: 'main',
      component: (
        <div className="me-page">
          {/* 顶部背景区域 */}
          <div className="me-header">
            <div className="me-background">
              <div className="me-profile-section">
                <div className="me-avatar-container">
                  <Image 
                    src={personalSettings.userAvatar}
                    alt={personalSettings.userNickname}
                    width={80}
                    height={80}
                    className="me-avatar"
                  />
                </div>
                <div className="me-info">
                  <h2 className="me-nickname">{personalSettings.userNickname}</h2>
                  <p className="me-bio">{personalSettings.userBio ? (personalSettings.userBio.length > 10 ? personalSettings.userBio.slice(0, 10) + '…' : personalSettings.userBio) : '这个人很懒，什么都没写~'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 余额显示区域 */}
          <div className="me-balance-section">
            <div className="balance-card">
              <div className="balance-icon">💰</div>
              <div className="balance-info">
                <div className="balance-label">我的余额</div>
                <div className="balance-amount">¥ {balance.toFixed(2)}</div>
              </div>
              <div className="balance-action">
                <button className="balance-info-btn" onClick={handleBalanceInfo}>
                  如何获得余额
                </button>
              </div>
            </div>
            
            {/* 余额信息弹窗 */}
            {showBalanceInfo && (
              <div className="balance-info-modal">
                <div className="balance-info-content">
                  <div className="balance-info-header">
                    <h3>虚拟货币说明</h3>
                    <button 
                      className="close-btn"
                      onClick={handleBalanceInfo}
                    >
                      ×
                    </button>
                  </div>
                  <div className="balance-info-body">
                    <p>此为虚拟货币，您可以通过与你创建AI角色聊天，AI角色会转账和给你红包。</p>
                    <p>此虚拟货币可以用于购物等其他功能。</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 选项列表 */}
          <div className="me-options">
            <div className="option-group">
              <div 
                className="option-item"
                onClick={() => handleOptionClick('personal-settings')}
              >
                <div className="option-icon">👤</div>
                <div className="option-content">
                  <div className="option-title">个人设置</div>
                  <div className="option-subtitle">修改头像、昵称和个人介绍</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('api-settings')}
              >
                <div className="option-icon">🔧</div>
                <div className="option-content">
                  <div className="option-title">API设置</div>
                  <div className="option-subtitle">配置AI连接和模型选择</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('color-settings')}
              >
                <div className="option-icon">🎨</div>
                <div className="option-content">
                  <div className="option-title">配色设置</div>
                  <div className="option-subtitle">选择你喜欢的主题配色</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('preset-manager')}
              >
                <div className="option-icon">⚙️</div>
                <div className="option-content">
                  <div className="option-title">AI 预设管理</div>
                  <div className="option-subtitle">管理 AI 模型的参数配置</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('data-backup')}
              >
                <div className="option-icon">💾</div>
                <div className="option-content">
                  <div className="option-title">数据备份管理</div>
                  <div className="option-subtitle">导入导出所有数据，包括聊天记录、设置等</div>
                </div>
                <div className="option-arrow">›</div>
              </div>
            </div>
          </div>
        </div>
      ),
      direction: 'down' as const,
      duration: 300
    },
    {
      id: 'color-settings',
      component: <ColorSettingsPage onBack={handleBackToMain} />,
      direction: 'left' as const,
      duration: 300
    },
    {
      id: 'preset-manager',
      component: <PresetManagerPage onBack={handleBackToMain} />,
      direction: 'left' as const,
      duration: 300
    }
  ];

  return (
    <>
      <PageTransitionManager
        pages={pages}
        currentPageId={currentPage}
        defaultDirection="left"
        defaultDuration={300}
      />

      {/* 底部导航 - 只在主页面显示 */}
      {currentPage === 'main' && (
        <BottomNavigation
          activeView="me"
          onViewChange={handleViewChange}
          newContentCount={newContentCount}
          forceShow={true}
        />
      )}

      {/* API设置模态框 */}
      <ApiSettingsModal
        isVisible={showApiSettings}
        onClose={handleApiSettingsClose}
        onSave={handleApiSettingsSave}
        currentConfig={apiConfig}
      />

      {/* 个人设置模态框 */}
      <PersonalSettingsModal
        isVisible={showPersonalSettings}
        onClose={() => setShowPersonalSettings(false)}
        onSave={handlePersonalSettingsSave}
        currentSettings={personalSettings}
      />

      {/* 数据备份管理模态框 */}
      {showDataBackup && (
        <DataBackupManager onClose={() => setShowDataBackup(false)} />
      )}
    </>
  );
} 