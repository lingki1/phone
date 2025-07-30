'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { dataManager } from '../../../utils/dataManager';
import ColorSettingsPage from '../../settings/ColorSettingsPage';
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
  const [balance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'color-settings'>('main');

  // 加载个人信息
  useEffect(() => {
    const loadPersonalSettings = async () => {
      try {
        await dataManager.initDB();
        const settings = await dataManager.getPersonalSettings();
        setPersonalSettings(settings);
      } catch (error) {
        console.error('Failed to load personal settings from database:', error);
        // 回退到localStorage
        const savedPersonalSettings = localStorage.getItem('personalSettings');
        if (savedPersonalSettings) {
          setPersonalSettings(JSON.parse(savedPersonalSettings));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonalSettings();
  }, []);

  // 处理选项点击
  const handleOptionClick = (option: string) => {
    switch (option) {
      case 'color-settings':
        setCurrentPage('color-settings');
        break;
      case 'settings':
        // TODO: 打开其他设置页面
        console.log('打开设置页面');
        break;
      case 'history':
        // TODO: 打开历史回忆页面
        console.log('打开历史回忆页面');
        break;
      default:
        break;
    }
  };

  // 处理返回主页面
  const handleBackToMain = () => {
    setCurrentPage('main');
  };

  // 处理余额信息显示
  const handleBalanceInfo = () => {
    setShowBalanceInfo(!showBalanceInfo);
  };

  if (isLoading) {
    return (
      <div className="me-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  // 如果当前页面是配色设置，显示配色设置页面
  if (currentPage === 'color-settings') {
    return <ColorSettingsPage onBack={handleBackToMain} />;
  }

  return (
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
              <p className="me-bio">{personalSettings.userBio || '这个人很懒，什么都没写~'}</p>
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
            onClick={() => handleOptionClick('settings')}
          >
            <div className="option-icon">⚙️</div>
            <div className="option-content">
              <div className="option-title">设置</div>
              <div className="option-subtitle">个人设置、隐私设置等</div>
            </div>
            <div className="option-arrow">›</div>
          </div>

          <div 
            className="option-item"
            onClick={() => handleOptionClick('history')}
          >
            <div className="option-icon">📚</div>
            <div className="option-content">
              <div className="option-title">历史回忆</div>
              <div className="option-subtitle">查看聊天历史记录</div>
            </div>
            <div className="option-arrow">›</div>
          </div>
        </div>
      </div>


    </div>
  );
} 