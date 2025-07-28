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
  backContent?: string; // 背面内容
}

export default function DesktopPage({ onOpenApp }: DesktopPageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [flippedTiles, setFlippedTiles] = useState<Set<string>>(new Set());

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
      status: 'available',
      backContent: '3条新消息'
    },
    {
      id: 'story',
      name: '故事模式',
      icon: '📖',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      size: 'medium',
      status: 'coming-soon',
      backContent: '创作你的故事'
    },
    {
      id: 'music',
      name: '音乐',
      icon: '🎵',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      size: 'medium',
      status: 'coming-soon',
      backContent: '发现新音乐'
    },
    {
      id: 'shopping',
      name: '购物',
      icon: '🛒',
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      size: 'medium',
      status: 'coming-soon',
      backContent: '限时优惠'
    },
    {
      id: 'weibo',
      name: '微博',
      icon: '📱',
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      size: 'medium',
      status: 'coming-soon',
      backContent: '热门话题'
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

  // 定期自动翻转方块
  useEffect(() => {
    const autoFlipInterval = setInterval(() => {
      setFlippedTiles(prev => {
        const newSet = new Set(prev);
        // 随机选择一个方块进行翻转
        const randomIndex = Math.floor(Math.random() * appTiles.length);
        const randomTile = appTiles[randomIndex];
        
        if (newSet.has(randomTile.id)) {
          newSet.delete(randomTile.id); // 翻回正面
        } else {
          newSet.add(randomTile.id); // 翻转到背面
        }
        
        return newSet;
      });
    }, 5000); // 每5秒自动翻转一个方块

    return () => clearInterval(autoFlipInterval);
  }, [appTiles.length]);

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
    // 先执行翻转动画
    setFlippedTiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(app.id)) {
        newSet.delete(app.id); // 翻回正面
      } else {
        newSet.add(app.id); // 翻转到背面
      }
      return newSet;
    });

    // 延迟执行应用打开逻辑，等待动画完成
    setTimeout(() => {
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
    }, 300); // 等待翻转动画完成
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
            className={`app-tile ${app.size} ${app.status} ${flippedTiles.has(app.id) ? 'flipped' : ''}`}
            style={{ 
              background: app.gradient,
              animationDelay: `${index * 0.1}s`
            }}
            onClick={() => handleAppClick(app)}
          >
            {/* 正面内容 */}
            <div className="tile-front">
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
            </div>

            {/* 背面内容 */}
            <div className="tile-back">
              <div className="back-content">
                <div className="back-icon">
                  <span className="icon-emoji">{app.icon}</span>
                </div>
                <div className="back-text">{app.backContent}</div>
              </div>
            </div>

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