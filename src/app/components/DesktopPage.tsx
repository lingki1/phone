'use client';

import { useState, useEffect, useRef } from 'react';
import './DesktopPage.css';

// 电池管理器接口定义
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

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
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  
  // 拖拽和编辑状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [clickedApp, setClickedApp] = useState<string | null>(null);
  const [appTiles, setAppTiles] = useState<AppTile[]>([
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
  ]);

  // 长按检测相关
  const longPressRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const isLongPressRef = useRef<{ [key: string]: boolean }>({});

  // 获取电池信息
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery();
          
          const updateBatteryInfo = () => {
            setBatteryLevel(Math.round(battery.level * 100));
            setIsCharging(battery.charging);
          };

          // 初始更新
          updateBatteryInfo();

          // 监听电池状态变化
          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
          };
        }
      } catch {
        console.log('电池API不可用，使用默认值');
      }
    };

    getBatteryInfo();
  }, []);

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

  // 获取电池图标
  const getBatteryIcon = () => {
    if (isCharging) {
      return '🔌';
    }
    if (batteryLevel <= 20) {
      return '🔴';
    } else if (batteryLevel <= 50) {
      return '🟡';
    } else {
      return '🔋';
    }
  };

  // 处理长按开始
  const handleLongPressStart = (appId: string) => {
    if (longPressRefs.current[appId]) {
      clearTimeout(longPressRefs.current[appId]!);
    }
    
    longPressRefs.current[appId] = setTimeout(() => {
      isLongPressRef.current[appId] = true;
      setIsEditMode(true);
      setDraggedItem(appId);
    }, 500); // 500ms长按触发
  };

  // 处理长按结束
  const handleLongPressEnd = (appId: string) => {
    if (longPressRefs.current[appId]) {
      clearTimeout(longPressRefs.current[appId]!);
      longPressRefs.current[appId] = null;
    }
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    if (!isEditMode) return;
    
    console.log('开始拖拽:', appId);
    setDraggedItem(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', appId);
    
    // 设置拖拽图像
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    dragImage.style.transform = 'scale(1.1)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // 延迟移除拖拽图像
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    console.log('拖拽结束');
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent, targetAppId: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(targetAppId);
  };

  // 处理拖拽放置
  const handleDrop = (e: React.DragEvent, targetAppId: string) => {
    if (!isEditMode || !draggedItem || draggedItem === targetAppId) return;
    
    e.preventDefault();
    console.log('放置到:', targetAppId, '拖拽的是:', draggedItem);
    
    const draggedIndex = appTiles.findIndex(app => app.id === draggedItem);
    const targetIndex = appTiles.findIndex(app => app.id === targetAppId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newAppTiles = [...appTiles];
      const [draggedApp] = newAppTiles.splice(draggedIndex, 1);
      newAppTiles.splice(targetIndex, 0, draggedApp);
      setAppTiles(newAppTiles);
      console.log('排序完成:', newAppTiles.map(app => app.name));
    }
    
    setDragOverItem(null);
  };

  // 处理网格容器的拖拽事件
  const handleGridDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGridDrop = (e: React.DragEvent) => {
    if (!isEditMode || !draggedItem) return;
    
    e.preventDefault();
    console.log('放置到网格容器');
    
    // 如果放置到网格容器，将拖拽的项目放到最后
    const draggedIndex = appTiles.findIndex(app => app.id === draggedItem);
    if (draggedIndex !== -1) {
      const newAppTiles = [...appTiles];
      const [draggedApp] = newAppTiles.splice(draggedIndex, 1);
      newAppTiles.push(draggedApp);
      setAppTiles(newAppTiles);
      console.log('移动到末尾完成');
    }
  };

  // 切换应用大小
  const toggleAppSize = (appId: string) => {
    if (!isEditMode) return;
    
    setAppTiles(prev => prev.map(app => {
      if (app.id === appId) {
        const sizeMap = { small: 'medium', medium: 'large', large: 'small' } as const;
        return { ...app, size: sizeMap[app.size] };
      }
      return app;
    }));
  };

  // 退出编辑模式
  const exitEditMode = () => {
    setIsEditMode(false);
    setDraggedItem(null);
    Object.keys(isLongPressRef.current).forEach(key => {
      isLongPressRef.current[key] = false;
    });
  };

  // 处理应用点击
  const handleAppClick = (app: AppTile) => {
    if (isEditMode) {
      // 编辑模式下点击切换大小
      toggleAppSize(app.id);
      return;
    }

    if (app.status === 'coming-soon') {
      // 显示开发中提示
      alert(`${app.name} 功能正在开发中，敬请期待！`);
      return;
    }

    // 设置点击的应用，触发转场动画
    setClickedApp(app.id);

    // 延迟执行应用打开，让动画有时间播放
    setTimeout(() => {
    if (app.id === 'qq') {
      onOpenApp('qq');
    } else {
      console.log(`打开应用: ${app.name}`);
    }
      // 清除点击状态
      setClickedApp(null);
    }, 300); // 300ms动画时长
  };

  // 处理触摸事件（移动端长按）
  const handleTouchStart = (appId: string) => {
    handleLongPressStart(appId);
  };

  const handleTouchEnd = (appId: string) => {
    handleLongPressEnd(appId);
  };

  return (
    <div className="desktop-page">
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-left">
          <span className="signal-icon">📶</span>
        </div>
        <div className="status-right">
          <span className="battery-icon">{getBatteryIcon()}</span>
          <span className="battery-percentage">{batteryLevel}%</span>
        </div>
      </div>

      {/* 编辑模式提示 */}
      {isEditMode && (
        <div className="edit-mode-indicator">
          <span>编辑模式 - 点击图标切换大小，拖拽排序</span>
          <button className="exit-edit-btn" onClick={exitEditMode}>完成</button>
        </div>
      )}

      {/* 时间显示区域 */}
      <div className="time-section">
        <div className="current-time">{formatTime(currentTime)}</div>
        <div className="current-date">{formatDate(currentDate)}</div>
        <div className="greeting">美好的一天开始了</div>
      </div>

      {/* 应用方块网格 */}
      <div 
        className="app-grid"
        onDragOver={handleGridDragOver}
        onDrop={handleGridDrop}
      >
        {appTiles.map((app, index) => (
          <div
            key={app.id}
            className={`app-tile ${app.size} ${app.status} ${isEditMode ? 'edit-mode' : ''} ${draggedItem === app.id ? 'dragging' : ''} ${dragOverItem === app.id ? 'drag-over' : ''} ${clickedApp === app.id ? 'clicked' : ''}`}
            style={{ 
              background: app.gradient,
              animationDelay: `${index * 0.1}s`
            }}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, app.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, app.id)}
            onDrop={(e) => handleDrop(e, app.id)}
            onMouseDown={() => handleLongPressStart(app.id)}
            onMouseUp={() => handleLongPressEnd(app.id)}
            onMouseLeave={() => handleLongPressEnd(app.id)}
            onTouchStart={() => handleTouchStart(app.id)}
            onTouchEnd={() => handleTouchEnd(app.id)}
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
            {isEditMode && (
              <div className="size-indicator">
                {app.size === 'small' ? 'S' : app.size === 'medium' ? 'M' : 'L'}
              </div>
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