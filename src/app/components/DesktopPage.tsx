'use client';

import { useState, useEffect, useRef } from 'react';
import './DesktopPage.css';
import { AnnouncementEditor, Announcement, AnnouncementHistoryDrawer } from './announcement';
import { fetchAnnouncements } from './announcement/announcementService';
import { PublicChatRoom } from './chatroom';
import { BlackMarket } from './blackmarket';
import LocaleSwitcher from '../components/i18n/LocaleSwitcher';
import { ChatItem, WorldBook } from '../types/chat';
import { useI18n } from '../components/i18n/I18nProvider';
import { dataManager } from '../utils/dataManager';
import AuthModal from './auth/AuthModal';
import ChangePasswordModal from './auth/ChangePasswordModal';
import ApiSettingsModal from './qq/ApiSettingsModal';
import CreativeSpace from './creativespace/CreativeSpace';

// 不再需要StoredAnnouncement接口，因为现在使用API

// 电池管理器接口定义
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface NetworkInformation extends EventTarget {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface CurrentUser {
  username?: string;
  name?: string;
  role?: string;
  group?: string;
  group_id?: string;
}

interface DesktopPageProps {
  onOpenApp: (appName: string) => Promise<void>;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

interface AppTile {
  id: string;
  name: string;
  icon?: string;
  color: string;
  gradient: string;
  size: 'small' | 'medium' | 'large';
  notifications?: number;
  status?: 'coming-soon' | 'available' | 'insufficient-balance';
}

export default function DesktopPage({ onOpenApp, onLogout, isAuthenticated: _isAuthenticated }: DesktopPageProps) {
  const { t, locale } = useI18n();
  // PWA 安装事件类型声明（在部分浏览器中未内置）
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
  const MinimalIcon = ({ name }: { name: string }) => {
    const commonProps = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: '#000000', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
    switch (name) {
      case 'creativespace':
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.creativespace', '我的创意')}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'qq': // chat
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.qq', '聊天')}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 9h8M8 13h6"/>
          </svg>
        );
      case 'blackmarket': // store
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.blackmarket', '黑市')}>
            <path d="M3 10h18"/>
            <path d="M5 10l1.5-5h11L19 10"/>
            <path d="M6 10v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/>
            <path d="M10 14h4"/>
          </svg>
        );
      case 'music':
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.music', '音乐')}>
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        );
      case 'shopping':
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.shopping', '购物')}>
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        );
      case 'weibo': // hot/news
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.weibo', '热点')}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            <circle cx="18" cy="6" r="2" fill="currentColor"/>
          </svg>
        );
      case 'chatroom':
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.chatroom', '聊天室')}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M13 8H7M17 12H7"/>
            <circle cx="18" cy="8" r="2" fill="currentColor"/>
          </svg>
        );
      default:
        return (
          <svg {...commonProps} aria-label={t('Desktop.aria.app', '应用')}>
            <rect x="5" y="5" width="14" height="14" rx="4"/>
          </svg>
        );
    }
  };
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [apiConfig, setApiConfig] = useState({ proxyUrl: '', apiKey: '', model: '' });
  // PWA 安装按钮状态
  const [isInstallAvailable, setIsInstallAvailable] = useState(false);
  const deferredInstallPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  // 刷新后自动恢复登录：尝试获取用户信息，401 时静默忽略
  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      if (currentUser) return;
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data?.success) {
            setCurrentUser(data.user);
          }
        }
      } catch (_e) {
        // 未登录或请求失败时忽略
      }
    };
    loadUser();
    return () => { cancelled = true; };
  }, [currentUser]);
  
  const [clickedApp, setClickedApp] = useState<string | null>(null);
  
  // 公告系统状态
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementEditorOpen, setIsAnnouncementEditorOpen] = useState(false);
  const [timeClickCount, setTimeClickCount] = useState(0);
  const [lastTimeClickTime, setLastTimeClickTime] = useState(0);
  
  // 聊天室状态
  const [isChatRoomOpen, setIsChatRoomOpen] = useState(false);
  
  // 黑市状态
  const [isBlackMarketOpen, setIsBlackMarketOpen] = useState(false);
  
  // 我的创意状态
  const [isCreativeOpen, setIsCreativeOpen] = useState(false);
  
  // 背景色状态
  const [backgroundColor, setBackgroundColor] = useState<string>('linear-gradient(135deg, #f8c8dc 0%, #d1d5db 100%)');
  
  
  // 处理角色导入
  const handleImportCharacter = async (character: ChatItem) => {
    console.log('DesktopPage - 收到角色导入请求:', {
      characterName: character.name,
      characterId: character.id
    });
    
    try {
      await dataManager.saveChat(character);
      console.log('DesktopPage - 角色导入成功，已保存到数据库');
      alert(t('Desktop.alert.importCharacterSuccess', '角色导入成功！'));
    } catch (error) {
      console.error('DesktopPage - 保存导入角色失败:', error);
      alert(t('Desktop.alert.commonFailure', '导入失败，请稍后重试'));
    }
  };

  // 处理世界书导入
  const handleImportWorldBook = async (worldBook: WorldBook) => {
    console.log('DesktopPage - 收到世界书导入请求:', {
      worldBookName: worldBook.name,
      worldBookId: worldBook.id
    });
    
    try {
      await dataManager.saveWorldBook(worldBook);
      console.log('DesktopPage - 世界书导入成功，已保存到数据库');
      alert(t('Desktop.alert.importWorldBookSuccess', '世界书导入成功！'));
    } catch (error) {
      console.error('DesktopPage - 保存导入世界书失败:', error);
      alert(t('Desktop.alert.commonFailure', '导入失败，请稍后重试'));
    }
  };
  const [appTiles] = useState<AppTile[]>([
    {
      id: 'qq',
      name: 'QwQ',
      icon: '💬',
      color: '#12B7F5',
      gradient: 'linear-gradient(135deg, #12B7F5 0%, #0EA5E9 100%)',
      size: 'medium',
      notifications: 3,
      status: 'available'
    },

    {
      id: 'blackmarket',
      name: '黑市',
      icon: '🏪',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      size: 'medium',
      status: 'available'
    },
    {
      id: 'music',
      name: '音乐',
      icon: '🎵',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      size: 'medium',
      status: 'available'
    },
    {
      id: 'shopping',
      name: '购物',
      icon: '🛒',
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      size: 'medium',
      status: 'available'
    },
    {
      id: 'weibo',
      name: '热点',
      icon: '📱',
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
      size: 'medium',
      status: 'coming-soon'
    },
    {
      id: 'chatroom',
      name: '聊天室',
      icon: '🗣️',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      size: 'medium',
      status: 'available'
    }
    ,
    {
      id: 'creativespace',
      name: '我的创意',
      icon: '✨',
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      size: 'medium',
      status: 'available'
    }
  ]);
  
  // 时间点击重置定时器
  const timeClickResetTimer = useRef<NodeJS.Timeout | null>(null);

  // 移除购物应用状态更新逻辑，改为点击时动态检查

  // 初始化公告数据
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await fetchAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        console.error('加载公告数据失败:', error);
      }
    };

    loadAnnouncements();
    
    // 定期刷新公告数据（每5分钟）
    const interval = setInterval(loadAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 注册 Service Worker 并监听安装事件
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt.current = e as BeforeInstallPromptEvent;
      setIsInstallAvailable(true);
    };
    const handleAppInstalled = () => {
      setIsInstallAvailable(false);
      deferredInstallPrompt.current = null;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    try {
      const promptEvent = deferredInstallPrompt.current;
      if (!promptEvent) return;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallAvailable(false);
        deferredInstallPrompt.current = null;
      }
    } catch (_e) {}
  };

  // 打开API设置（与个人中心相同逻辑）
  const openApiSettings = async () => {
    try {
      await dataManager.initDB();
      const saved = await dataManager.getApiConfig();
      setApiConfig(saved);
    } catch (_e) {
      const saved = localStorage.getItem('apiConfig');
      if (saved) {
        try { setApiConfig(JSON.parse(saved)); } catch { /* noop */ }
      }
    } finally {
      setIsUserMenuOpen(false);
      setIsApiSettingsOpen(true);
    }
  };

  // 检测是否为移动设备
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 获取电池信息
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        // 检查是否支持电池 API
        if ('getBattery' in navigator) {
          const battery = await (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery();
          
          const updateBatteryInfo = () => {
            const newLevel = Math.round(battery.level * 100);
            const newCharging = battery.charging;
            
            setBatteryLevel(newLevel);
            setIsCharging(newCharging);
            
            // 电池状态更新日志已移除
          };

          // 初始更新
          updateBatteryInfo();

          // 监听电池状态变化
          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          // 对于移动设备，更频繁地检查电池状态
          const checkInterval = isMobileDevice() ? 15000 : 30000; // 移动设备15秒，桌面设备30秒
          const batteryCheckInterval = setInterval(() => {
            if (battery && typeof battery.level === 'number') {
              updateBatteryInfo();
            }
          }, checkInterval);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
            clearInterval(batteryCheckInterval);
          };
        } else {
          // 设备不支持电池API，使用默认值
          
          // 对于不支持电池API的设备，尝试使用其他方法
          if ('connection' in navigator) {
            // 监听网络状态变化，间接检测设备状态
            const connection = (navigator as Navigator & { connection: NetworkInformation }).connection;
            if (connection) {
                          connection.addEventListener('change', () => {
              // 网络状态变化监听
            });
            }
          }
          
          // 对于移动设备，尝试使用页面可见性API来检测设备状态
          if (isMobileDevice() && 'hidden' in document) {
            document.addEventListener('visibilitychange', () => {
              if (!document.hidden) {
                // 页面重新可见，可能需要更新电池状态
              }
            });
          }
        }
      } catch (error) {
        console.error('获取电池信息失败:', error);
        console.log('使用默认电池值');
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

  // 监听页面可见性变化，重新获取电池状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isMobileDevice()) {
        // 页面重新可见，尝试更新电池状态
        // 延迟一下再检查电池状态，确保设备完全唤醒
        setTimeout(() => {
          if ('getBattery' in navigator) {
            (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery()
              .then(battery => {
                setBatteryLevel(Math.round(battery.level * 100));
                setIsCharging(battery.charging);
                // 页面可见性变化后电池状态更新完成
              })
              .catch(error => {
                console.error('页面可见性变化后获取电池状态失败:', error);
              });
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 监听openApp事件
  useEffect(() => {
    const handleOpenApp = (event: CustomEvent) => {
      const appName = event.detail;
      console.log('DesktopPage - 收到openApp事件:', appName);
      onOpenApp(appName);
    };

    window.addEventListener('openApp', handleOpenApp as EventListener);
    
    return () => {
      window.removeEventListener('openApp', handleOpenApp as EventListener);
    };
  }, [onOpenApp]);

  // 移除自动数据库版本冲突检测
  // 让IndexedDB自己处理所有升级，只在用户手动点击时才执行恢复

  // 不在首页初始请求 /api/auth/me，仅在登录成功后由上层传递或刷新

  // 加载保存的背景色
  useEffect(() => {
    const savedBg = localStorage.getItem('desktop-background-color');
    if (savedBg) {
      setBackgroundColor(savedBg);
    }
  }, []);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isUserMenuOpen) return;
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 获取电池图标（iOS风格）
  const getBatteryIcon = () => {
    const level = Math.max(0, Math.min(100, batteryLevel));
    const bodyWidth = 22;
    const bodyHeight = 12;
    const tipWidth = 2.5;
    const tipHeight = 6;
    const corner = 2.5;
    const x = 1;
    const y = 1;
    const fillMaxWidth = bodyWidth - 4; // 内边距2px
    const fillWidth = Math.max(0.8, (level / 100) * fillMaxWidth);
    const fillColor = level <= 20 ? '#ff3b30' : level <= 50 ? '#ffcc00' : '#34c759';

    return (
      <svg width="30" height="16" viewBox="0 0 30 16" aria-hidden="true">
        {/* 外框 */}
        <rect x={x} y={y} rx={corner} ry={corner} width={bodyWidth} height={bodyHeight} fill="none" stroke="currentColor" strokeWidth="1.5"/>
        {/* 端子 */}
        <rect x={x + bodyWidth + 0.5} y={y + (bodyHeight - tipHeight) / 2} width={tipWidth} height={tipHeight} rx={1.2} ry={1.2} fill="currentColor"/>
        {/* 背景填充槽（浅色以体现玻璃感） */}
        <rect x={x + 2} y={y + 2} width={fillMaxWidth} height={bodyHeight - 4} rx={1.8} ry={1.8} fill="currentColor" opacity="0.12"/>
        {/* 电量填充 */}
        <rect x={x + 2} y={y + 2} width={fillWidth} height={bodyHeight - 4} rx={1.8} ry={1.8} fill={fillColor} />
        {/* 充电闪电标识 */}
        {isCharging && (
          <path d="M14 4 l2.5 0 -2 4 2.5 0 -4 6 0.8-4 -2.2 0 z" fill="#ffffff" opacity="0.9" transform="scale(0.7) translate(5,2)"/>
        )}
      </svg>
    );
  };

  // 已移除长按拖拽与大小切换功能

  // 处理应用点击
  const handleAppClick = async (app: AppTile) => {
    // 未登录统一拦截到登录弹窗（公告历史抽屉除外，由其内部按钮控制）
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (app.status === 'coming-soon') {
      // 显示开发中提示
      alert(t('Desktop.alert.comingSoon', '功能正在开发中，敬请期待！'));
      return;
    }

    // 处理购物应用：动态检查余额
    if (app.id === 'shopping') {
      try {
        await dataManager.initDB();
        const currentBalance = await dataManager.getBalance();
        if (currentBalance < 5) {
          alert(t('Desktop.alert.insufficientBalanceDetail', `余额不足！当前余额：¥${currentBalance.toFixed(2)}，需要至少 ¥5.00 才能进入购物页面。\n\n您可以通过与AI角色聊天来获得虚拟货币。`));
          return;
        }
      } catch (error) {
        console.error('检查余额失败:', error);
        alert(t('Desktop.alert.checkBalanceFailed', '检查余额失败，请稍后重试'));
        return;
      }
    }

    // 处理聊天室应用
    if (app.id === 'chatroom') {
      setClickedApp(app.id);
      setTimeout(() => {
        setIsChatRoomOpen(true);
        setClickedApp(null);
      }, 300);
      return;
    }

    // 处理黑市应用
    if (app.id === 'blackmarket') {
      setClickedApp(app.id);
      setTimeout(() => {
        setIsBlackMarketOpen(true);
        setClickedApp(null);
      }, 300);
      return;
    }

    // 处理我的创意应用
    if (app.id === 'creativespace') {
      setClickedApp(app.id);
      setTimeout(() => {
        setIsCreativeOpen(true);
        setClickedApp(null);
      }, 300);
      return;
    }

    // 音乐应用：打开全局播放器
    if (app.id === 'music') {
      setClickedApp(app.id);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('audio:open'));
        setClickedApp(null);
      }, 300);
      return;
    }

    // 设置点击的应用，触发转场动画
    setClickedApp(app.id);

    // 延迟执行应用打开，让动画有时间播放
    setTimeout(async () => {
      await onOpenApp(app.id);
      // 清除点击状态
      setClickedApp(null);
    }, 300); // 300ms动画时长
  };

  // 已移除移动端长按事件

  // 处理时间点击（隐藏入口）
  const handleTimeClick = () => {
    const now = Date.now();
    
    // 如果距离上次点击超过3秒，重置计数
    if (now - lastTimeClickTime > 3000) {
      setTimeClickCount(1);
    } else {
      setTimeClickCount(prev => prev + 1);
    }
    
    setLastTimeClickTime(now);
    
    // 清除之前的重置定时器
    if (timeClickResetTimer.current) {
      clearTimeout(timeClickResetTimer.current);
    }
    
    // 设置新的重置定时器
    timeClickResetTimer.current = setTimeout(() => {
      setTimeClickCount(0);
      setLastTimeClickTime(0);
    }, 3000);
    
    // 检查是否达到10次点击
    if (timeClickCount >= 9) { // 因为这次点击会让count变成10
      handleSecretEntrance();
    }
  };

  // 处理隐藏入口
  const handleSecretEntrance = () => {
    const password = prompt(t('Desktop.prompt.enterAdminPassword', '请输入管理密码：'));
    if (password === 'WWh930117') {
      setIsAnnouncementEditorOpen(true);
      setTimeClickCount(0);
      setLastTimeClickTime(0);
    } else if (password !== null) {
      alert(t('Desktop.alert.wrongPassword', '密码错误！'));
      setTimeClickCount(0);
      setLastTimeClickTime(0);
    }
  };


  // 处理退出登录
  const handleLogout = async () => {
    if (!confirm(t('Desktop.confirm.logout', '确定要退出登录吗？'))) {
      return;
    }

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // 清除本地存储的用户信息
        localStorage.removeItem('userToken');
        setCurrentUser(null);
        setIsUserMenuOpen(false);
        // 通知上层
        window.dispatchEvent(new CustomEvent('auth:logout'));
        // 调用父组件的退出登录回调
        if (onLogout) {
          onLogout();
        }
      } else {
        alert(t('Desktop.alert.logoutFailed', '退出登录失败，请稍后重试'));
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert(t('Desktop.alert.logoutFailed', '退出登录失败，请稍后重试'));
    }
  };

  const getUserInitial = () => {
    const name: string | undefined = currentUser?.username || currentUser?.name;
    if (!name || typeof name !== 'string' || name.length === 0) return '👤';
    return name.charAt(0).toUpperCase();
  };

  const getUserGroupName = () => {
    const groupId: string | undefined = currentUser?.group || currentUser?.group_id;
    if (!groupId) return t('Desktop.user.group.ungrouped', '未分组');
    if (groupId === 'default') return t('Desktop.user.group.default', '默认分组');
    return groupId;
  };

  // 处理背景色变更
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('desktop-background-color', color);
  };

  // 预设背景色选项
  const backgroundColors = [
    { name: '粉灰渐变', value: 'linear-gradient(135deg, #f8c8dc 0%, #d1d5db 100%)' },
    { name: '蓝紫渐变', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: '绿青渐变', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: '橙红渐变', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: '紫粉渐变', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { name: '深蓝渐变', value: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
    { name: '暖橙渐变', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    { name: '冷灰渐变', value: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)' }
  ];

  // 保存公告数据 - 现在不需要了，因为使用API实时保存
  // const handleSaveAnnouncements = (newAnnouncements: Announcement[]) => {
  //   try {
  //     localStorage.setItem('desktop-announcements', JSON.stringify(newAnnouncements));
  //     setAnnouncements(newAnnouncements);
  //   } catch (error) {
  //     console.error('保存公告数据失败:', error);
  //     alert('保存失败，请稍后重试');
  //   }
  // };

  // 关闭公告（已不再用于弹窗显示）

  return (
    <div className="desktop-page" style={{ background: backgroundColor }}>
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-left">
          {isInstallAvailable && (
            <button
              onClick={handleInstallClick}
              className="glass-chip"
              style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              title={t('Desktop.install.pwa', '安装到桌面')}
            >
              {t('Desktop.install.pwa', '安装到桌面')}
            </button>
          )}
        </div>
        <div className="status-right">
          {/* 语言下拉 - 紧挨登录按钮左侧 */}
          <div style={{ marginRight: 8 }}>
            <LocaleSwitcher compact />
          </div>
          <div className="authuser-menu" ref={userMenuRef}>
            <button
              className="authuser-avatar-button"
              title={currentUser ? (currentUser?.username || t('Desktop.user.title', '用户')) : t('Desktop.user.login', '登录')}
              onClick={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsUserMenuOpen(v => !v);
              }}
            >
              {currentUser ? getUserInitial() : t('Desktop.user.login', '登录')}
            </button>
            {currentUser && isUserMenuOpen && (
              <div className="authuser-dropdown">
                <div className="authuser-header">
                  <div className="authuser-name">{currentUser?.username || t('Desktop.user.notLoggedIn', '未登录')}</div>
                  <div className="authuser-meta">{t('Desktop.user.role', '角色：')}{currentUser?.role || 'user'}</div>
                  <div className="authuser-meta">{t('Desktop.user.group.label', '分组：')}{getUserGroupName()}</div>
                </div>
                
                {/* 背景色选择器 */}
                <div className="authuser-section">
                  <div className="authuser-section-title">{t('Desktop.theme.background', '背景主题')}</div>
                  <div className="background-color-grid">
                    {backgroundColors.map((color, index) => (
                      <button
                        key={index}
                        className={`background-color-option ${backgroundColor === color.value ? 'active' : ''}`}
                        style={{ background: color.value }}
                        onClick={() => handleBackgroundColorChange(color.value)}
                        title={color.name}
                      >
                        <span className="color-check">{backgroundColor === color.value ? '✓' : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button className="authuser-item" onClick={openApiSettings}>
                  {t('Desktop.user.settings', '设置')}
                </button>
                <button className="authuser-item" onClick={() => { setIsChangePwdOpen(true); setIsUserMenuOpen(false); }}>
                  {t('Desktop.user.changePassword', 'Change Password')}
                </button>
                
                <button className="authuser-item authuser-logout" onClick={handleLogout}>{t('Desktop.user.logout', '退出登录')}</button>
              </div>
            )}
          </div>
          <span className="glass-chip battery-chip" title={`${t('Desktop.battery.status', '电池状态')}: ${batteryLevel}% ${isCharging ? t('Desktop.battery.charging', '充电中') : t('Desktop.battery.notCharging', '未充电')}`}>
            {getBatteryIcon()}
            <span style={{ fontWeight: 700 }}>{batteryLevel}%</span>
          </span>
        </div>
      </div>

      {/* 编辑模式提示 */}
      {false && (
        <div className="edit-mode-indicator">
          <span></span>
          <button className="exit-edit-btn">完成</button>
        </div>
      )}

      {/* 公告显示已移除，改用抽屉浏览历史 */}

      {/* 全局搜索区域 */}
      <div className="desktop-search">
        <div className="desktop-search-box">
          <svg className="desktop-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            className="desktop-search-input" 
            type="text" 
            placeholder={t('Desktop.searchPlaceholder', '搜索应用、设置或网页...')}
          />
        </div>
      </div>

      {/* 时间显示区域 */}
      <div className="time-section">
        <div className="time-panel">
          <div 
            className="current-time" 
            onClick={handleTimeClick}
            style={{ userSelect: 'none' }}
          >
            {formatTime(currentTime)}
          </div>
          <div className="current-date">{formatDate(currentDate)}</div>
          <div className="greeting">{t('Desktop.greeting', '美好的一天开始了')}</div>
        </div>
      </div>

      {/* 应用方块网格 */}
      <div 
        className="app-grid"
      >
        {appTiles.map((app, index) => (
          <div
            key={app.id}
            className={`app-tile ${app.size} ${app.status} ${clickedApp === app.id ? 'clicked' : ''}`}
            style={{ 
              animationDelay: `${index * 0.1}s`
            }}
            onClick={() => handleAppClick(app)}
          >
            <div className="app-icon">
              <MinimalIcon name={app.id} />
            </div>
            <div className="app-name">{t(`Desktop.appName.${app.id}`, app.name)}</div>
            {app.notifications && app.notifications > 0 && (
              <div className="notification-badge">
                {app.notifications > 99 ? '99+' : app.notifications}
              </div>
            )}
            {app.status === 'coming-soon' && (
              <div className="coming-soon-badge">{t('Desktop.comingSoon', '开发中')}</div>
            )}
            {app.status === 'insufficient-balance' && (
              <div className="insufficient-balance-badge">{t('Desktop.insufficientBalance', '余额不足')}</div>
            )}
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

      {/* 公告编辑器 */}
      <AnnouncementEditor
        isOpen={isAnnouncementEditorOpen}
        onClose={() => setIsAnnouncementEditorOpen(false)}
        initialAnnouncements={announcements}
      />

      <AnnouncementHistoryDrawer announcements={announcements} disabled={isBlackMarketOpen || isChatRoomOpen} />

      {/* 公共聊天室 */}
      <PublicChatRoom
        isOpen={isChatRoomOpen}
        onClose={() => setIsChatRoomOpen(false)}
      />

      {/* 黑市 */}
      <BlackMarket
        isOpen={isBlackMarketOpen}
        onClose={() => setIsBlackMarketOpen(false)}
        onImportCharacter={handleImportCharacter}
        onImportWorldBook={handleImportWorldBook}
      />

      {/* 我的创意 */}
      <CreativeSpace
        isOpen={isCreativeOpen}
        onClose={() => setIsCreativeOpen(false)}
      />

      {/* 登录弹窗 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={async () => {
          try {
            const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              if (data?.success) {
                setCurrentUser(data.user);
                // 通知上层应用登录成功
                window.dispatchEvent(new CustomEvent('auth:login-success', { detail: { user: data.user } }));
              }
            }
          } catch (_e) {}
          setIsAuthModalOpen(false);
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePwdOpen}
        onClose={() => setIsChangePwdOpen(false)}
        onSuccess={() => {
          // 可选：修改密码成功后可触发额外操作
        }}
      />

      <ApiSettingsModal
        isVisible={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        onSave={async (cfg) => {
          try {
            await dataManager.initDB();
            await dataManager.saveApiConfig(cfg);
          } catch (_e) {
            localStorage.setItem('apiConfig', JSON.stringify(cfg));
          } finally {
            setApiConfig(cfg);
            setIsApiSettingsOpen(false);
          }
        }}
        currentConfig={apiConfig}
      />

    </div>
  );
} 