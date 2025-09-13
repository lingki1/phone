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
import { useI18n } from '../../i18n/I18nProvider';
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
  const { t } = useI18n();
  const _onBackToDesktop = onBackToDesktop; // 暂时保留参数，避免 ESLint 警告
  const [personalSettings, setPersonalSettings] = useState<PersonalSettings>({
    userAvatar: '/avatars/user-avatar.svg',
    userNickname: t('QQ.ChatInterface.Me.MePage.defaultUser', '用户'),
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

  // 余额作弊功能状态
  const [balanceClickCount, setBalanceClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

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

  // 监听数据导入和清空事件
  useEffect(() => {
    const handleDataImported = async () => {
      try {
        console.log(t('QQ.ChatInterface.Me.MePage.logs.dataImportDetected', 'MePage - 检测到数据导入事件，刷新页面数据...'));
        setIsLoading(true);
        
        // 重新加载所有数据
        await dataManager.initDB();
        
        // 重新加载个人信息
        const settings = await dataManager.getPersonalSettings();
        setPersonalSettings(settings);
        
        // 重新加载余额
        const userBalance = await dataManager.getBalance();
        setBalance(userBalance);
        
        // 重新加载API配置
        try {
          const savedApiConfig = await dataManager.getApiConfig();
          setApiConfig(savedApiConfig);
        } catch (error) {
          console.error('Failed to reload API config after import:', error);
        }
        
        // 重新加载新内容计数
        const { newPostsCount, newCommentsCount } = await dataManager.calculateNewContentCount('user');
        setNewContentCount({
          moments: newPostsCount + newCommentsCount
        });
        
        console.log(t('QQ.ChatInterface.Me.MePage.logs.dataImportRefreshComplete', 'MePage - 数据导入后刷新完成'));
      } catch (error) {
        console.error('Failed to refresh data after import:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleDataCleared = async () => {
      try {
        console.log(t('QQ.ChatInterface.Me.MePage.logs.dataClearDetected', 'MePage - 检测到数据清空事件，重置页面数据...'));
        setIsLoading(true);
        
        // 重置所有数据到默认状态
        setPersonalSettings({
          userAvatar: '/avatars/user-avatar.svg',
          userNickname: t('QQ.ChatInterface.Me.MePage.defaultUser', '用户'),
          userBio: ''
        });
        
        setBalance(0);
        setApiConfig({
          proxyUrl: '',
          apiKey: '',
          model: ''
        });
        
        setNewContentCount({});
        
        console.log(t('QQ.ChatInterface.Me.MePage.logs.dataClearResetComplete', 'MePage - 数据清空后重置完成'));
      } catch (error) {
        console.error('Failed to reset data after clear:', error);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('dataImported', handleDataImported);
    window.addEventListener('dataCleared', handleDataCleared);
    
    return () => {
      window.removeEventListener('dataImported', handleDataImported);
      window.removeEventListener('dataCleared', handleDataCleared);
    };
  }, [t]);

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
          console.log(t('QQ.ChatInterface.Me.MePage.logs.loadApiConfigFromDB', 'MePage - 从数据库加载API配置:'), {
            proxyUrl: savedApiConfig.proxyUrl,
            apiKey: savedApiConfig.apiKey ? t('QQ.ChatInterface.Me.MePage.apiKeyStatus.set', '已设置') : t('QQ.ChatInterface.Me.MePage.apiKeyStatus.notSet', '未设置'),
            model: savedApiConfig.model
          });
          setApiConfig(savedApiConfig);
        } catch (error) {
          console.error('Failed to load API config from database:', error);
          // 回退到localStorage
          const savedApiConfig = localStorage.getItem('apiConfig');
          if (savedApiConfig) {
            const parsedConfig = JSON.parse(savedApiConfig);
            console.log(t('QQ.ChatInterface.Me.MePage.logs.loadApiConfigFromLocalStorage', 'MePage - 从localStorage加载API配置:'), {
              proxyUrl: parsedConfig.proxyUrl,
              apiKey: parsedConfig.apiKey ? t('QQ.ChatInterface.Me.MePage.apiKeyStatus.set', '已设置') : t('QQ.ChatInterface.Me.MePage.apiKeyStatus.notSet', '未设置'),
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
  }, [t]);

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
    console.log(t('QQ.ChatInterface.Me.MePage.logs.optionClick', 'MePage - 选项点击:'), option);
    
    switch (option) {
      case 'api-settings':
        console.log(t('QQ.ChatInterface.Me.MePage.logs.openApiSettings', 'MePage - 打开API设置'));
        setShowApiSettings(true);
        break;
      case 'personal-settings':
        console.log(t('QQ.ChatInterface.Me.MePage.logs.openPersonalSettings', 'MePage - 打开个人设置'));
        setShowPersonalSettings(true);
        break;
      case 'color-settings':
        console.log(t('QQ.ChatInterface.Me.MePage.logs.openColorSettings', 'MePage - 打开配色设置'));
        setCurrentPage('color-settings');
        break;
      case 'preset-manager':
        console.log(t('QQ.ChatInterface.Me.MePage.logs.openPresetManager', 'MePage - 打开预设管理'));
        setCurrentPage('preset-manager');
        break;
      case 'data-backup':
        console.log(t('QQ.ChatInterface.Me.MePage.logs.openDataBackup', 'MePage - 打开数据备份管理'));
        setShowDataBackup(true);
        break;
      default:
        console.log(t('QQ.ChatInterface.Me.MePage.logs.unknownOption', 'MePage - 未知选项:'), option);
        break;
    }
  };

  // 处理返回主页面
  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  // 处理API设置保存
  const handleApiSettingsSave = async (config: { proxyUrl: string; apiKey: string; model: string }) => {
    console.log(t('QQ.ChatInterface.Me.MePage.logs.saveApiConfig', 'MePage - 保存API配置:'), {
      proxyUrl: config.proxyUrl,
      apiKey: config.apiKey ? t('QQ.ChatInterface.Me.MePage.apiKeyStatus.set', '已设置') : t('QQ.ChatInterface.Me.MePage.apiKeyStatus.notSet', '未设置'),
      model: config.model
    });
    
    setApiConfig(config);
    
    try {
      // 保存到数据库
      await dataManager.initDB();
      await dataManager.saveApiConfig(config);
      console.log(t('QQ.ChatInterface.Me.MePage.logs.apiConfigSavedToDB', 'MePage - API配置已保存到数据库:'), {
        proxyUrl: config.proxyUrl,
        apiKey: config.apiKey ? t('QQ.ChatInterface.Me.MePage.apiKeyStatus.set', '已设置') : t('QQ.ChatInterface.Me.MePage.apiKeyStatus.notSet', '未设置'),
        model: config.model
      });
      
      // 触发API配置变更事件，通知其他组件
      window.dispatchEvent(new CustomEvent('apiConfigChanged'));
      console.log(t('QQ.ChatInterface.Me.MePage.logs.apiConfigChangedEvent', 'MePage - 已触发apiConfigChanged事件'));
    } catch (error) {
      console.error('Failed to save API config to database:', error);
      // 如果数据库保存失败，回退到localStorage
      localStorage.setItem('apiConfig', JSON.stringify(config));
      console.log(t('QQ.ChatInterface.Me.MePage.logs.apiConfigSavedToLocalStorage', 'MePage - API配置已保存到localStorage'));
      
      // 即使保存到localStorage也要触发事件
      window.dispatchEvent(new CustomEvent('apiConfigChanged'));
      console.log(t('QQ.ChatInterface.Me.MePage.logs.apiConfigChangedEventLocalStorage', 'MePage - 已触发apiConfigChanged事件（localStorage）'));
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
      console.log(t('QQ.ChatInterface.Me.MePage.logs.personalSettingsSaved', '个人设置已保存到数据库:'), settings);
      
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

  // 处理余额点击作弊功能
  const handleBalanceClick = async () => {
    const now = Date.now();
    
    // 如果距离上次点击超过5秒，重置计数
    if (now - lastClickTime > 5000) {
      setBalanceClickCount(1);
      setLastClickTime(now);
      return;
    }
    
    const newCount = balanceClickCount + 1;
    setBalanceClickCount(newCount);
    setLastClickTime(now);
    
    // 达到10次点击时触发作弊
    if (newCount >= 10) {
      try {
        await dataManager.initDB();
        const currentBalance = await dataManager.getBalance();
        const newBalance = currentBalance + 10000;
        
        // 保存到数据库
        await dataManager.saveBalance(newBalance);
        
        // 更新本地状态
        setBalance(newBalance);
        
        // 重置计数
        setBalanceClickCount(0);
        
        // 显示成功提示
        alert(t('QQ.ChatInterface.Me.MePage.cheat.success', '🎉 作弊成功！余额已增加 ¥10,000\n当前余额：¥{{balance}}').replace('{{balance}}', newBalance.toFixed(2)));
        
        console.log(t('QQ.ChatInterface.Me.MePage.logs.cheatSuccess', '余额作弊成功，新余额:'), newBalance);
      } catch (error) {
        console.error('余额作弊失败:', error);
        alert(t('QQ.ChatInterface.Me.MePage.cheat.failed', '作弊失败，请重试'));
      }
    }
  };

  // 处理底部导航切换
  const handleViewChange = (view: string) => {
    if (view === 'messages') {
      // 跳转到消息页面
      window.dispatchEvent(new CustomEvent('navigateToChat'));
    } else if (view === 'moments') {
      // 跳转到动态页面
      window.dispatchEvent(new CustomEvent('navigateToDiscover'));
    } else if (view === 'recollection') {
      // 跳转到回忆页面
      window.dispatchEvent(new CustomEvent('navigateToRecollection'));
    }
    // 'me' 已经在当前页面，不需要处理
  };

  if (isLoading) {
    return (
      <div className="me-page loading">
        <div className="loading-spinner">{t('QQ.ChatInterface.Me.MePage.loading', '加载中...')}</div>
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
                  <p className="me-bio">{personalSettings.userBio ? (personalSettings.userBio.length > 10 ? personalSettings.userBio.slice(0, 10) + '…' : personalSettings.userBio) : t('QQ.ChatInterface.Me.MePage.defaultBio', '这个人很懒，什么都没写~')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 余额显示区域 */}
          <div className="me-balance-section">
            <div className="balance-card" onClick={handleBalanceClick}>
              <div className="balance-icon">💰</div>
              <div className="balance-info">
                <div className="balance-label">{t('QQ.ChatInterface.Me.MePage.balance.label', '我的余额')}</div>
                <div className="balance-amount">¥ {balance.toFixed(2)}</div>
              </div>
              <div className="balance-action">
                <button className="balance-info-btn" onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  handleBalanceInfo();
                }}>
                  {t('QQ.ChatInterface.Me.MePage.balance.howToGet', '如何获得余额')}
                </button>
              </div>
            </div>
            

            
            {/* 余额信息弹窗 */}
            {showBalanceInfo && (
              <div className="balance-info-modal">
                <div className="balance-info-content">
                  <div className="balance-info-header">
                    <h3>{t('QQ.ChatInterface.Me.MePage.balanceInfo.title', '虚拟货币说明')}</h3>
                    <button 
                      className="close-btn"
                      onClick={handleBalanceInfo}
                    >
                      ×
                    </button>
                  </div>
                  <div className="balance-info-body">
                    <p>{t('QQ.ChatInterface.Me.MePage.balanceInfo.description1', '此为虚拟货币，您可以通过与你创建AI角色聊天，AI角色会转账和给你红包。')}</p>
                    <p>{t('QQ.ChatInterface.Me.MePage.balanceInfo.description2', '此虚拟货币可以用于购物等其他功能。')}</p>
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
                  <div className="option-title">{t('QQ.ChatInterface.Me.MePage.options.personalSettings.title', '个人设置')}</div>
                  <div className="option-subtitle">{t('QQ.ChatInterface.Me.MePage.options.personalSettings.subtitle', '修改头像、昵称和个人介绍')}</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('api-settings')}
              >
                <div className="option-icon">🔧</div>
                <div className="option-content">
                  <div className="option-title">{t('QQ.ChatInterface.Me.MePage.options.apiSettings.title', 'API设置')}</div>
                  <div className="option-subtitle">{t('QQ.ChatInterface.Me.MePage.options.apiSettings.subtitle', '配置AI连接和模型选择')}</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('color-settings')}
              >
                <div className="option-icon">🎨</div>
                <div className="option-content">
                  <div className="option-title">{t('QQ.ChatInterface.Me.MePage.options.colorSettings.title', '配色设置')}</div>
                  <div className="option-subtitle">{t('QQ.ChatInterface.Me.MePage.options.colorSettings.subtitle', '选择你喜欢的主题配色')}</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={() => handleOptionClick('preset-manager')}
              >
                <div className="option-icon">⚙️</div>
                <div className="option-content">
                  <div className="option-title">{t('QQ.ChatInterface.Me.MePage.options.presetManager.title', 'AI 预设管理')}</div>
                  <div className="option-subtitle">{t('QQ.ChatInterface.Me.MePage.options.presetManager.subtitle', '管理 AI 模型的参数配置')}</div>
                </div>
                <div className="option-arrow">›</div>
              </div>

              <div 
                className="option-item"
                onClick={(e) => {
                  console.log(t('QQ.ChatInterface.Me.MePage.logs.dataBackupOptionClicked', 'MePage - 数据备份选项被点击'));
                  console.log(t('QQ.ChatInterface.Me.MePage.logs.eventObject', 'MePage - 事件对象:'), e);
                  console.log(t('QQ.ChatInterface.Me.MePage.logs.currentShowDataBackupState', 'MePage - 当前 showDataBackup 状态:'), showDataBackup);
                  e.stopPropagation();
                  handleOptionClick('data-backup');
                  console.log(t('QQ.ChatInterface.Me.MePage.logs.handleOptionClickComplete', 'MePage - handleOptionClick 调用完成'));
                }}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <div className="option-icon">💾</div>
                <div className="option-content">
                  <div className="option-title">{t('QQ.ChatInterface.Me.MePage.options.dataBackup.title', '数据备份管理')}</div>
                  <div className="option-subtitle">{t('QQ.ChatInterface.Me.MePage.options.dataBackup.subtitle', '导入导出所有数据，包括聊天记录、设置等')}</div>
                </div>
                <div className="option-arrow">›</div>
              </div>
            </div>
          </div>
        </div>
      ),
      direction: 'down' as const,
      duration: 0
    },
    {
      id: 'color-settings',
      component: <ColorSettingsPage onBack={handleBackToMain} />,
      direction: 'left' as const,
      duration: 0
    },
    {
      id: 'preset-manager',
      component: <PresetManagerPage onBack={handleBackToMain} />,
      direction: 'left' as const,
      duration: 0
    }
  ];

  return (
    <>
      <PageTransitionManager
        pages={pages}
        currentPageId={currentPage}
        defaultDirection="left"
        defaultDuration={0}
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