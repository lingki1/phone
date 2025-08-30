'use client';

import { useState, useEffect, useRef } from 'react';
import './DesktopPage.css';
import { AnnouncementDisplay, AnnouncementEditor, Announcement } from './announcement';
import { fetchAnnouncements } from './announcement/announcementService';
import { PublicChatRoom } from './chatroom';
import { BlackMarket } from './blackmarket';
import { ChatItem, WorldBook } from '../types/chat';
import { dataManager } from '../utils/dataManager';
import { databaseRecovery } from '../utils/databaseRecovery';
import { backupManager } from '../utils/backupManager';

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
  userBalance: number;
  isLoadingBalance: boolean;
  onLogout?: () => void;
}

interface AppTile {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  size: 'small' | 'medium' | 'large';
  notifications?: number;
  status?: 'coming-soon' | 'available' | 'insufficient-balance';
}

export default function DesktopPage({ onOpenApp, userBalance, isLoadingBalance, onLogout }: DesktopPageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  
  // 拖拽和编辑状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
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
  
  // 数据库恢复状态
  const [isRecovering, setIsRecovering] = useState(false);
  
  // 处理角色导入
  const handleImportCharacter = async (character: ChatItem) => {
    console.log('DesktopPage - 收到角色导入请求:', {
      characterName: character.name,
      characterId: character.id
    });
    
    try {
      await dataManager.saveChat(character);
      console.log('DesktopPage - 角色导入成功，已保存到数据库');
      alert('角色导入成功！');
    } catch (error) {
      console.error('DesktopPage - 保存导入角色失败:', error);
      alert('导入失败，请稍后重试');
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
      alert('世界书导入成功！');
    } catch (error) {
      console.error('DesktopPage - 保存导入世界书失败:', error);
      alert('导入失败，请稍后重试');
    }
  };
  const [appTiles, setAppTiles] = useState<AppTile[]>([
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
      status: 'coming-soon'
    },
    {
      id: 'shopping',
      name: '购物',
      icon: '🛒',
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      size: 'medium',
      status: userBalance >= 5 ? 'available' : 'insufficient-balance',
      notifications: userBalance < 5 ? 1 : undefined
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
  ]);

  // 长按检测相关
  const longPressRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const isLongPressRef = useRef<{ [key: string]: boolean }>({});
  
  // 时间点击重置定时器
  const timeClickResetTimer = useRef<NodeJS.Timeout | null>(null);

  // 更新购物应用状态当余额变化时
  useEffect(() => {
    setAppTiles(prev => prev.map(app => {
      if (app.id === 'shopping') {
        return {
          ...app,
          status: userBalance >= 5 ? 'available' : 'insufficient-balance',
          notifications: userBalance < 5 ? 1 : undefined
        };
      }
      return app;
    }));
  }, [userBalance]);

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

  // 数据库版本冲突检测和恢复
  useEffect(() => {
    const checkAndRecoverDatabase = async () => {
      try {
        // 检查是否有数据库版本冲突需要恢复
        const hasConflict = await databaseRecovery.detectVersionConflict();
        if (hasConflict) {
          console.log('检测到数据库版本冲突，开始自动恢复...');
          
          try {
            const recovered = await databaseRecovery.performFullRecovery();
            if (recovered) {
              console.log('数据库自动恢复成功！');
              // 显示成功提示
              alert('检测到数据库版本冲突，已自动恢复所有数据！');
            } else {
              console.log('数据库无需恢复');
            }
          } catch (recoveryError) {
            console.error('数据库自动恢复失败:', recoveryError);
            // 如果自动恢复失败，尝试手动恢复
            if (databaseRecovery.hasBackupData()) {
              console.log('尝试从备份恢复数据...');
              try {
                const backupData = databaseRecovery.getBackupData();
                if (backupData) {
                  await databaseRecovery.restoreDataToNewDatabase(backupData);
                  console.log('从备份恢复数据成功');
                  alert('从备份数据恢复成功！');
                }
              } catch (backupError) {
                console.error('从备份恢复数据失败:', backupError);
                alert('数据库恢复失败，请联系管理员！');
              }
            } else {
              alert('数据库版本冲突，但无法自动恢复。请手动备份数据后重新安装应用。');
            }
          }
        }
      } catch (error) {
        console.error('数据库版本冲突检测失败:', error);
      }
    };

    checkAndRecoverDatabase();
  }, []);

  // 获取当前用户信息
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success) {
          setCurrentUser(data.user);
        }
      } catch (_e) {
        // ignore
      }
    };
    fetchMe();
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
      if (batteryLevel <= 20) {
        return '🔌🔴'; // 充电中但电量低
      } else if (batteryLevel <= 50) {
        return '🔌🟡'; // 充电中电量中等
      } else {
        return '🔌🔋'; // 充电中电量充足
      }
    }
    
    if (batteryLevel <= 10) {
      return '🔴'; // 电量极低
    } else if (batteryLevel <= 20) {
      return '🟠'; // 电量很低
    } else if (batteryLevel <= 50) {
      return '🟡'; // 电量中等
    } else if (batteryLevel <= 80) {
      return '🟢'; // 电量良好
    } else {
      return '🔋'; // 电量充足
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
  const handleAppClick = async (app: AppTile) => {
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

    if (app.status === 'insufficient-balance') {
      // 显示余额不足提示
      alert(`余额不足！当前余额：¥${userBalance.toFixed(2)}，需要至少 ¥5.00 才能进入购物页面。\n\n您可以通过与AI角色聊天来获得虚拟货币。`);
      return;
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

    // 设置点击的应用，触发转场动画
    setClickedApp(app.id);

    // 延迟执行应用打开，让动画有时间播放
    setTimeout(async () => {
      await onOpenApp(app.id);
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
    const password = prompt('请输入管理密码：');
    if (password === 'WWh930117') {
      setIsAnnouncementEditorOpen(true);
      setTimeClickCount(0);
      setLastTimeClickTime(0);
    } else if (password !== null) {
      alert('密码错误！');
      setTimeClickCount(0);
      setLastTimeClickTime(0);
    }
  };

  // 手动触发数据库恢复
  const handleManualDatabaseRecovery = async () => {
    // 显示备份选项
    const availableBackups = await backupManager.getAvailableBackups();
    
    if (availableBackups.length === 0) {
      // 没有可用备份，创建新备份
      if (!confirm('没有找到现有备份。\n\n确定要创建新备份并执行数据库恢复吗？\n\n注意：此操作可能需要几分钟时间。')) {
        return;
      }
      
      await performFullRecovery();
      return;
    }
    
    // 有可用备份，让用户选择
    const backupOptions = availableBackups.map(backup => 
      `${backup.description} (${(backup.size / 1024 / 1024).toFixed(2)}MB)`
    ).join('\n');
    
    const choice = confirm(`找到以下可用备份：\n\n${backupOptions}\n\n选择操作：\n• 确定：创建新备份并执行完整恢复\n• 取消：从现有备份恢复`);
    
    if (choice) {
      await performFullRecovery();
    } else {
      await performBackupOnlyRecovery();
    }
  };

  // 执行完整恢复流程
  const performFullRecovery = async () => {
    setIsRecovering(true);
    try {
      console.log('开始完整数据库恢复...');
      
      // 1. 创建新备份
      const backupMetadata = await backupManager.createBackup('手动恢复备份');
      console.log('新备份创建成功:', backupMetadata);
      
      // 2. 清理并重建数据库
      await databaseRecovery.clearAndRebuildDatabase();
      console.log('数据库重建完成');
      
      // 3. 恢复数据到新数据库
      const backupData = await backupManager.restoreBackup(backupMetadata.id);
      if (!backupData) {
        throw new Error('无法获取备份数据');
      }
      
      await databaseRecovery.restoreDataToNewDatabase(backupData);
      console.log('数据恢复完成');
      
      alert(`数据库恢复成功！\n\n已恢复：\n• ${backupData.chats.length} 个聊天\n• ${backupData.worldBooks.length} 本世界书\n• ${backupData.presets.length} 个预设\n• ${backupData.transactions.length} 条交易记录\n\n请刷新页面以应用更改。`);
      
      // 刷新页面
      window.location.reload();
      
    } catch (error) {
      console.error('完整数据库恢复失败:', error);
      alert(`数据库恢复失败：${error instanceof Error ? error.message : '未知错误'}\n\n请检查控制台获取详细信息。`);
    } finally {
      setIsRecovering(false);
    }
  };

  // 从现有备份恢复
  const performBackupOnlyRecovery = async () => {
    setIsRecovering(true);
    try {
      console.log('开始从现有备份恢复...');
      
      // 获取可用备份
      const availableBackups = await backupManager.getAvailableBackups();
      if (availableBackups.length === 0) {
        throw new Error('没有找到可用备份');
      }
      
      // 使用最新的备份
      const latestBackup = availableBackups[0];
      const backupData = await backupManager.restoreBackup(latestBackup.id);
      if (!backupData) {
        throw new Error('无法获取备份数据');
      }
      
      // 清理并重建数据库
      await databaseRecovery.clearAndRebuildDatabase();
      console.log('数据库重建完成');
      
      // 恢复数据到新数据库
      await databaseRecovery.restoreDataToNewDatabase(backupData);
      console.log('数据恢复完成');
      
      alert(`从备份恢复成功！\n\n已恢复：\n• ${backupData.chats.length} 个聊天\n• ${backupData.worldBooks.length} 本世界书\n• ${backupData.presets.length} 个预设\n• ${backupData.transactions.length} 条交易记录\n\n请刷新页面以应用更改。`);
      
      // 刷新页面
      window.location.reload();
      
    } catch (error) {
      console.error('从备份恢复失败:', error);
      alert(`从备份恢复失败：${error instanceof Error ? error.message : '未知错误'}\n\n请检查控制台获取详细信息。`);
    } finally {
      setIsRecovering(false);
    }
  };

  // 处理退出登录
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // 清除本地存储的用户信息
        localStorage.removeItem('userToken');
        // 调用父组件的退出登录回调
        if (onLogout) {
          onLogout();
        }
      } else {
        alert('退出登录失败，请稍后重试');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('退出登录失败，请稍后重试');
    }
  };

  const getUserInitial = () => {
    const name: string | undefined = currentUser?.username || currentUser?.name;
    if (!name || typeof name !== 'string' || name.length === 0) return '👤';
    return name.charAt(0).toUpperCase();
  };

  const getUserGroupName = () => {
    const groupId: string | undefined = currentUser?.group || currentUser?.group_id;
    if (!groupId) return '未分组';
    if (groupId === 'default') return '默认分组';
    return groupId;
  };

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

  // 关闭公告
  const handleDismissAnnouncement = (id: string) => {
    // 这里可以记录用户关闭的公告，避免重复显示
    console.log('用户关闭公告:', id);
  };

  return (
    <div className="desktop-page">
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-left">
          <span className="signal-icon">📶</span>
          {!isLoadingBalance && (
            <span className="balance-display" title={`当前余额：¥${userBalance.toFixed(2)}`}>
              💰 ¥{userBalance.toFixed(2)}
            </span>
          )}
        </div>
        <div className="status-right">
          <div className="authuser-menu" ref={userMenuRef}>
            <button
              className="authuser-avatar-button"
              title={currentUser?.username || '用户'}
              onClick={() => setIsUserMenuOpen(v => !v)}
            >
              {getUserInitial()}
            </button>
            {isUserMenuOpen && (
              <div className="authuser-dropdown">
                <div className="authuser-header">
                  <div className="authuser-name">{currentUser?.username || '未登录'}</div>
                  <div className="authuser-meta">角色：{currentUser?.role || 'user'}</div>
                  <div className="authuser-meta">分组：{getUserGroupName()}</div>
                </div>
                <button 
                  className="authuser-item authuser-recovery" 
                  onClick={handleManualDatabaseRecovery}
                  disabled={isRecovering}
                >
                  {isRecovering ? '恢复中...' : '数据库恢复'}
                </button>
                <button className="authuser-item authuser-logout" onClick={handleLogout}>退出登录</button>
              </div>
            )}
          </div>
          <span className="battery-icon" title={`电池状态: ${batteryLevel}% ${isCharging ? '充电中' : '未充电'}`}>
            {getBatteryIcon()}
          </span>
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

      {/* 公告显示 */}
      <AnnouncementDisplay 
        announcements={announcements}
        onDismiss={handleDismissAnnouncement}
      />

      {/* 时间显示区域 */}
      <div className="time-section">
        <div 
          className="current-time" 
          onClick={handleTimeClick}
          style={{ userSelect: 'none' }}
        >
          {formatTime(currentTime)}
        </div>
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
            {app.status === 'insufficient-balance' && (
              <div className="insufficient-balance-badge">余额不足</div>
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

      {/* 公告编辑器 */}
      <AnnouncementEditor
        isOpen={isAnnouncementEditorOpen}
        onClose={() => setIsAnnouncementEditorOpen(false)}
        initialAnnouncements={announcements}
      />

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
    </div>
  );
} 