'use client';

import { useState, useEffect } from 'react';
import './DesktopPage.css';

interface DesktopPageProps {
  onOpenApp: (appName: string) => void;
}

interface AppTile {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  size: 'small' | 'medium' | 'large';
  notifications?: number;
  status?: 'coming-soon' | 'available';
}

export default function DesktopPage({ onOpenApp }: DesktopPageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());

  // 应用方块数据
  const appTiles: AppTile[] = [
    {
      id: 'qq',
      name: 'QQ',
      icon: '💬',
      color: '#12B7F5',
      gradient: 'linear-gradient(135deg, #12B7F5 0%, #0EA5E9 100%)',
      size: 'medium',
      notifications: 3,
      status: 'available'
    },
    {
      id: 'story',
      name: '故事模式',
      icon: '📖',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      size: 'medium',
      status: 'coming-soon'
    },
    {
      id: 'music',
      name: '音乐',
      icon: '🎵',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      size: 'medium',
      status: 'coming-soon'
    },
    {
      id: 'shopping',
      name: '购物',
      icon: '🛒',
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      size: 'medium',
      status: 'coming-soon'
    },
    {
      id: 'weibo',
      name: '微博',
      icon: '📱',
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      size: 'medium',
      status: 'coming-soon'
    }
  ];

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setCurrentDate(now);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 处理应用点击
  const handleAppClick = (app: AppTile) => {
    if (app.status === 'coming-soon') {
      // 显示开发中提示
      alert(`${app.name} 功能正在开发中，敬请期待！`);
      return;
    }

    if (app.id === 'qq') {
      onOpenApp('qq');
    } else {
      console.log(`打开应用: ${app.name}`);
    }
  };

  return (
    <div className="desktop-page">
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-left">
          <span className="signal-icon">📶</span>
          <span className="wifi-icon">📶</span>
        </div>
        <div className="status-right">
          <span className="battery-icon">🔋</span>
          <span className="battery-percentage">85%</span>
        </div>
      </div>

      {/* 时间显示区域 */}
      <div className="time-section">
        <div className="current-time">{formatTime(currentTime)}</div>
        <div className="current-date">{formatDate(currentDate)}</div>
        <div className="greeting">美好的一天开始了</div>
      </div>

      {/* 应用方块网格 */}
      <div className="app-grid">
        {appTiles.map((app, index) => (
          <div
            key={app.id}
            className={`app-tile ${app.size} ${app.status}`}
            style={{ 
              background: app.gradient,
              animationDelay: `${index * 0.1}s`
            }}
            onClick={() => handleAppClick(app)}
          >
            <div className="app-icon">
              <span className="icon-emoji">{app.icon}</span>
            </div>
            <div className="app-name">{app.name}</div>
            {app.notifications && app.notifications > 0 && (
              <div className="notification-badge">
                {app.notifications > 99 ? '99+' : app.notifications}
              </div>
            )}
            {app.status === 'coming-soon' && (
              <div className="coming-soon-badge">开发中</div>
            )}
            <div className="app-overlay"></div>
          </div>
        ))}
      </div>

      {/* 底部导航指示器 */}
      <div className="bottom-indicator">
        <div className="indicator-dot active"></div>
        <div className="indicator-dot"></div>
        <div className="indicator-dot"></div>
      </div>

      {/* 背景装饰 */}
      <div className="background-decoration">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>
    </div>
  );
} 