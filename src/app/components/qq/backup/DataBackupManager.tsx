'use client';

import { useState, useRef, useEffect } from 'react';
import { dataManager } from '../../../utils/dataManager';
import { ChatItem, ApiConfig, WorldBook } from '../../../types/chat';
import { TransactionRecord } from '../../../types/money';
import { PresetConfig } from '../../../types/preset';
import { DiscoverPost, DiscoverComment, DiscoverSettings, DiscoverNotification, DiscoverDraft } from '../../../types/discover';
import './DataBackupManager.css';

interface BackupData {
  chats: ChatItem[];
  apiConfig: ApiConfig;
  personalSettings: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  };
  personalSettingsCollection?: Array<{
    id: string;
    userAvatar: string;
    userNickname: string;
    userBio: string;
    isActive?: boolean;
    createdAt?: number;
    updatedAt?: number;
  }>;
  themeSettings: {
    selectedTheme: string;
    lastUpdated: number;
  };
  balance: number;
  transactions: TransactionRecord[];
  giftRecords: Array<{
    id: string;
    type: 'send' | 'receive';
    amount: number;
    chatId: string;
    fromUser: string;
    toUser: string;
    message?: string;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
  }>;
  worldBooks: WorldBook[];
  presets: PresetConfig[];
  chatStatuses: Array<{
    chatId: string;
    isOnline: boolean;
    mood: string;
    location: string;
    outfit: string;
    lastUpdate: number;
  }>;
  chatBackgrounds: Array<{
    chatId: string;
    background: string;
  }>;
  discoverPosts: DiscoverPost[];
  discoverComments: DiscoverComment[];
  discoverSettings: DiscoverSettings;
  discoverNotifications: DiscoverNotification[];
  discoverDrafts: DiscoverDraft[];
  storyModeMessages: Array<{
    chatId: string;
    messages: import('../../../types/chat').Message[];
    timestamp: number;
  }>;
  exportTime: string;
  version: string;
}

interface DataBackupManagerProps {
  onClose: () => void;
}

export default function DataBackupManager({ onClose }: DataBackupManagerProps) {
  console.log('DataBackupManager - 组件渲染');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动备份相关状态
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24); // 默认24小时
  const [autoBackupUnit, setAutoBackupUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [nextBackupTime, setNextBackupTime] = useState<string>('');
  const [autoBackupTimer, setAutoBackupTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAutoBackupSettings, setShowAutoBackupSettings] = useState(false);

  // 加载自动备份设置
  useEffect(() => {
    loadAutoBackupSettings();
    
    // 将全局备份函数挂载到window对象
    (window as Window & { performGlobalBackup?: typeof performGlobalBackup }).performGlobalBackup = performGlobalBackup;
    console.log('全局备份函数已挂载到window对象');
    
    // 监听全局自动备份事件
    const handleAutoBackupTriggered = () => {
      console.log('收到全局自动备份事件，执行备份');
      // 使用全局备份函数，不依赖组件状态
      const globalBackup = (window as Window & { performGlobalBackup?: typeof performGlobalBackup }).performGlobalBackup;
      if (globalBackup) {
        console.log('调用全局备份函数');
        globalBackup();
      } else {
        console.error('全局备份函数未找到');
        alert('自动备份失败：备份函数未找到');
      }
    };
    
    window.addEventListener('autoBackupTriggered', handleAutoBackupTriggered);
    console.log('全局自动备份事件监听器已添加');
    
    // 清理事件监听器
    return () => {
      window.removeEventListener('autoBackupTriggered', handleAutoBackupTriggered);
      // 注意：不清理全局函数，让它继续工作
      console.log('组件卸载，但保留全局备份函数');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 保存自动备份设置到localStorage
  const saveAutoBackupSettings = () => {
    const settings = {
      enabled: autoBackupEnabled,
      interval: autoBackupInterval,
      unit: autoBackupUnit,
      nextBackupTime: nextBackupTime
    };
    localStorage.setItem('autoBackupSettings', JSON.stringify(settings));
  };

  // 加载自动备份设置
  const loadAutoBackupSettings = () => {
    try {
      const settings = localStorage.getItem('autoBackupSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoBackupEnabled(parsed.enabled || false);
        setAutoBackupInterval(parsed.interval || 24);
        setAutoBackupUnit(parsed.unit || 'hours');
        setNextBackupTime(parsed.nextBackupTime || '');
        
        // 如果启用了自动备份，启动定时器
        if (parsed.enabled) {
          console.log('加载设置时发现自动备份已启用，启动定时器');
          startAutoBackupTimer();
        }
      }
    } catch (error) {
      console.error('加载自动备份设置失败:', error);
    }
  };

  // 启动自动备份定时器
  const startAutoBackupTimer = () => {
    console.log('启动自动备份定时器');
    
    // 清除现有定时器
    if (autoBackupTimer) {
      console.log('清除现有定时器:', autoBackupTimer);
      clearTimeout(autoBackupTimer);
    }
    
    // 清除全局定时器
    const existingGlobalTimer = (window as Window & { globalAutoBackupTimer?: NodeJS.Timeout }).globalAutoBackupTimer;
    if (existingGlobalTimer) {
      console.log('清除全局定时器:', existingGlobalTimer);
      clearTimeout(existingGlobalTimer);
    }

    if (!autoBackupEnabled) {
      console.log('自动备份已禁用');
      setNextBackupTime('');
      return;
    }

    // 计算下次备份时间
    const now = new Date();
    const intervalMs = autoBackupUnit === 'minutes' 
      ? autoBackupInterval * 60 * 1000 
      : autoBackupUnit === 'hours' 
        ? autoBackupInterval * 60 * 60 * 1000 
        : autoBackupInterval * 24 * 60 * 60 * 1000;
    
    const nextBackup = new Date(now.getTime() + intervalMs);
    setNextBackupTime(nextBackup.toLocaleString('zh-CN'));

    console.log('自动备份设置:', {
      enabled: autoBackupEnabled,
      interval: autoBackupInterval,
      unit: autoBackupUnit,
      intervalMs,
      nextBackup: nextBackup.toLocaleString('zh-CN')
    });

    // 设置全局定时器（不会因为组件卸载而清除）
    const globalTimer = setTimeout(() => {
      console.log('全局定时器触发，准备弹出确认对话框');
      console.log('当前时间:', new Date().toLocaleString('zh-CN'));
      
      // 使用全局函数触发备份
      if (confirm('自动备份时间到了！是否现在进行数据备份？')) {
        console.log('用户确认备份');
        // 直接调用全局备份函数，不通过事件
        const globalBackup = (window as Window & { performGlobalBackup?: typeof performGlobalBackup }).performGlobalBackup;
        if (globalBackup) {
          console.log('直接调用全局备份函数');
          globalBackup();
        } else {
          console.error('全局备份函数未找到，尝试触发事件');
          window.dispatchEvent(new CustomEvent('autoBackupTriggered'));
        }
      } else {
        console.log('用户取消备份');
      }
      
      // 重新启动定时器
      setTimeout(() => {
        startAutoBackupTimer();
      }, 1000);
    }, intervalMs);

    // 保存全局定时器ID
    (window as Window & { globalAutoBackupTimer?: NodeJS.Timeout }).globalAutoBackupTimer = globalTimer;
    
    // 同时设置组件内的定时器（用于显示状态）
    const timer = setTimeout(() => {
      console.log('组件定时器触发（仅用于状态更新）');
    }, intervalMs);

    setAutoBackupTimer(timer);
    saveAutoBackupSettings();
    
    console.log('全局定时器已设置，ID:', globalTimer);
    console.log('组件定时器已设置，ID:', timer);
  };

  // 触发自动备份（已废弃，使用全局备份函数）
  const _triggerAutoBackup = () => {
    console.log('触发自动备份函数');
    console.log('当前时间:', new Date().toLocaleString('zh-CN'));
    
    if (confirm('自动备份时间到了！是否现在进行数据备份？')) {
      console.log('用户确认备份');
      handleExportData();
      // 备份完成后重新启动定时器
      setTimeout(() => {
        startAutoBackupTimer();
      }, 1000);
    } else {
      console.log('用户取消备份');
      // 用户取消，重新启动定时器
      startAutoBackupTimer();
    }
  };

  // 保存自动备份设置
  const handleSaveAutoBackupSettings = () => {
    console.log('保存自动备份设置');
    console.log('设置状态:', {
      autoBackupEnabled,
      autoBackupInterval,
      autoBackupUnit
    });
    
    if (autoBackupEnabled) {
      startAutoBackupTimer();
    } else {
      // 禁用自动备份
      if (autoBackupTimer) {
        clearTimeout(autoBackupTimer);
        setAutoBackupTimer(null);
      }
      // 清理全局定时器
      const existingGlobalTimer = (window as Window & { globalAutoBackupTimer?: NodeJS.Timeout }).globalAutoBackupTimer;
      if (existingGlobalTimer) {
        console.log('禁用自动备份，清理全局定时器:', existingGlobalTimer);
        clearTimeout(existingGlobalTimer);
        (window as Window & { globalAutoBackupTimer?: NodeJS.Timeout }).globalAutoBackupTimer = undefined;
      }
      setNextBackupTime('');
    }
    
    saveAutoBackupSettings();
    setShowAutoBackupSettings(false);
    setSuccess('自动备份设置已保存！');
    
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (autoBackupTimer) {
        console.log('组件卸载，清理组件定时器:', autoBackupTimer);
        clearTimeout(autoBackupTimer);
      }
      // 注意：不清理全局定时器，让它继续工作
    };
  }, [autoBackupTimer]);

  // 测试定时器功能
  const testTimer = () => {
    console.log('测试定时器功能');
    const testTimerId = setTimeout(() => {
      console.log('测试定时器触发成功！');
      alert('测试定时器工作正常！');
    }, 5000); // 5秒后触发
    console.log('测试定时器ID:', testTimerId);
  };

  // 全局备份函数（不依赖组件状态）
  const performGlobalBackup = async () => {
    console.log('开始执行全局备份');
    
    try {
      // 初始化数据库
      await dataManager.initDB();
      console.log('数据库初始化完成');

      // 收集所有数据
      const chats = await dataManager.getAllChats();
      console.log('聊天数据收集完成:', chats.length);

      const apiConfig = await dataManager.getApiConfig();
      const personalSettings = await dataManager.getPersonalSettings();
      const personalSettingsCollection = await dataManager.getAllPersonalSettingsFromCollection();
      const themeSettings = await dataManager.getThemeSettings() || {
        selectedTheme: 'default',
        lastUpdated: Date.now()
      };
      const balance = await dataManager.getBalance();
      const transactions = await dataManager.getTransactionHistory();
      const worldBooks = await dataManager.getAllWorldBooks();
      const presets = await dataManager.getAllPresets();
      const discoverPosts = await dataManager.getAllDiscoverPosts();
      const discoverSettings = await dataManager.getDiscoverSettings();
      const discoverDrafts = await dataManager.getAllDiscoverDrafts();

      // 收集送礼记录
      const giftRecords: Array<{
        id: string;
        type: 'send' | 'receive';
        amount: number;
        chatId: string;
        fromUser: string;
        toUser: string;
        message?: string;
        timestamp: number;
        status: 'pending' | 'completed' | 'failed';
      }> = [];
      
      for (const chat of chats) {
        try {
          const chatTransactions = await dataManager.getTransactionsByChatId(chat.id);
          const giftTransactions = chatTransactions.filter(tx => 
            tx.message && typeof tx.message === 'string' && 
            (tx.message.includes('gift_purchase') || tx.message.includes('gift'))
          );
          giftRecords.push(...giftTransactions);
        } catch (error) {
          console.warn(`Failed to get gift records for chat ${chat.id}:`, error);
        }
      }

      // 收集剧情模式消息
      const storyModeMessages: Array<{
        chatId: string;
        messages: import('../../../types/chat').Message[];
        timestamp: number;
      }> = [];
      
      for (const chat of chats) {
        try {
          const messages = await dataManager.getStoryModeMessages(chat.id);
          if (messages && messages.length > 0) {
            storyModeMessages.push({
              chatId: chat.id,
              messages,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.warn(`Failed to get story mode messages for chat ${chat.id}:`, error);
        }
      }

      // 收集动态评论
      const discoverComments: DiscoverComment[] = [];
      for (const post of discoverPosts) {
        try {
          const comments = await dataManager.getDiscoverCommentsByPost(post.id);
          discoverComments.push(...comments);
        } catch (error) {
          console.warn(`Failed to get comments for post ${post.id}:`, error);
        }
      }

      // 收集动态通知
      const discoverNotifications: DiscoverNotification[] = [];
      for (const post of discoverPosts) {
        try {
          const notifications = await dataManager.getDiscoverNotifications(post.authorId);
          discoverNotifications.push(...notifications);
        } catch (error) {
          console.warn(`Failed to get notifications for post ${post.id}:`, error);
        }
      }

      // 优化聊天数据
      const optimizedChats = chats.map(chat => {
        if (!chat.avatarMap) {
          chat.avatarMap = {};
        }
        
        chat.messages.forEach(msg => {
          const msgWithOldField = msg as typeof msg & { senderAvatar?: string };
          
          if (msgWithOldField.senderAvatar && !msg.senderAvatarId) {
            const avatarData = msgWithOldField.senderAvatar;
            const avatarId = msg.role === 'user' 
              ? `user_${chat.id}` 
              : `member_${msg.senderName || chat.name}`;
            
            chat.avatarMap![avatarId] = avatarData;
            msg.senderAvatarId = avatarId;
            delete msgWithOldField.senderAvatar;
          }
        });
        
        return chat;
      });

      // 构建导出数据
      const exportData: BackupData = {
        chats: optimizedChats,
        apiConfig,
        personalSettings,
        personalSettingsCollection,
        themeSettings,
        balance,
        transactions,
        giftRecords,
        worldBooks,
        presets,
        chatStatuses: [],
        chatBackgrounds: [],
        discoverPosts,
        discoverComments,
        discoverSettings,
        discoverNotifications,
        discoverDrafts,
        storyModeMessages,
        exportTime: new Date().toISOString(),
        version: '1.8'
      };

      console.log('导出数据构建完成，准备下载文件');
      console.log('导出数据大小:', JSON.stringify(exportData).length, '字符');

      // 创建并下载文件
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json'
      });
      
      console.log('Blob创建完成，大小:', blob.size, '字节');
      
      const url = URL.createObjectURL(blob);
      console.log('URL创建完成:', url);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.style.display = 'none';
      
      console.log('准备触发下载，文件名:', a.download);
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('全局备份完成，文件已下载');
      alert('自动备份完成！文件已下载到您的设备。');

    } catch (error) {
      console.error('全局备份失败:', error);
      alert(`自动备份失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 导出所有数据
  const handleExportData = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);
    setExportProgress(0);
    setCurrentOperation('正在准备导出数据...');

    try {
      // 初始化数据库
      await dataManager.initDB();
      setExportProgress(10);
      setCurrentOperation('正在收集聊天数据...');

      // 收集所有数据
      const chats = await dataManager.getAllChats();
      setExportProgress(20);
      setCurrentOperation('正在收集API配置...');

      const apiConfig = await dataManager.getApiConfig();
      setExportProgress(30);
      setCurrentOperation('正在收集个人信息...');

      const personalSettings = await dataManager.getPersonalSettings();
      setExportProgress(40);
      setCurrentOperation('正在收集主题设置...');

      const themeSettings = await dataManager.getThemeSettings() || {
        selectedTheme: 'default',
        lastUpdated: Date.now()
      };
      setExportProgress(50);
      setCurrentOperation('正在收集余额信息...');

      const balance = await dataManager.getBalance();
      setExportProgress(60);
      setCurrentOperation('正在收集交易记录...');

      const transactions = await dataManager.getTransactionHistory();
      setExportProgress(65);
      setCurrentOperation('正在收集送礼记录...');

      // 收集所有聊天的送礼记录
      const giftRecords: Array<{
        id: string;
        type: 'send' | 'receive';
        amount: number;
        chatId: string;
        fromUser: string;
        toUser: string;
        message?: string;
        timestamp: number;
        status: 'pending' | 'completed' | 'failed';
      }> = [];
      
      for (const chat of chats) {
        try {
          const chatTransactions = await dataManager.getTransactionsByChatId(chat.id);
          // 过滤出送礼相关的交易记录
          const giftTransactions = chatTransactions.filter(tx => 
            tx.message && typeof tx.message === 'string' && 
            (tx.message.includes('gift_purchase') || tx.message.includes('gift'))
          );
          giftRecords.push(...giftTransactions);
        } catch (error) {
          console.warn(`Failed to get gift records for chat ${chat.id}:`, error);
        }
      }

      setExportProgress(70);
      setCurrentOperation('正在收集世界书...');

      const worldBooks = await dataManager.getAllWorldBooks();
      setExportProgress(80);
      setCurrentOperation('正在收集预设配置...');

      const presets = await dataManager.getAllPresets();
      setExportProgress(85);
      setCurrentOperation('正在收集剧情模式消息...');

      // 收集所有聊天的剧情模式消息
      const storyModeMessages: Array<{
        chatId: string;
        messages: import('../../../types/chat').Message[];
        timestamp: number;
      }> = [];
      
      for (const chat of chats) {
        try {
          const messages = await dataManager.getStoryModeMessages(chat.id);
          if (messages && messages.length > 0) {
            storyModeMessages.push({
              chatId: chat.id,
              messages,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.warn(`Failed to get story mode messages for chat ${chat.id}:`, error);
        }
      }

      setExportProgress(87);
      setCurrentOperation('正在收集动态数据...');

      const discoverPosts = await dataManager.getAllDiscoverPosts();
      setExportProgress(89);
      setCurrentOperation('正在收集动态评论...');

      // 收集所有动态的评论
      const discoverComments: DiscoverComment[] = [];
      for (const post of discoverPosts) {
        try {
          const comments = await dataManager.getDiscoverCommentsByPost(post.id);
          discoverComments.push(...comments);
        } catch (error) {
          console.warn(`Failed to get comments for post ${post.id}:`, error);
        }
      }

      setExportProgress(91);
      setCurrentOperation('正在收集动态设置...');

      const discoverSettings = await dataManager.getDiscoverSettings();
      setExportProgress(93);
      setCurrentOperation('正在收集动态通知...');

      // 收集所有动态的通知
      const discoverNotifications: DiscoverNotification[] = [];
      for (const post of discoverPosts) {
        try {
          const notifications = await dataManager.getDiscoverNotifications(post.authorId);
          discoverNotifications.push(...notifications);
        } catch (error) {
          console.warn(`Failed to get notifications for post ${post.id}:`, error);
        }
      }

      setExportProgress(95);
      setCurrentOperation('正在收集动态草稿...');

      const discoverDrafts = await dataManager.getAllDiscoverDrafts();
      
      setExportProgress(97);
      setCurrentOperation('正在生成导出文件...');

      // 优化聊天数据 - 确保头像数据正确存储在avatarMap中
      const optimizedChats = chats.map(chat => {
        // 确保每个聊天都有avatarMap
        if (!chat.avatarMap) {
          chat.avatarMap = {};
        }
        
        // 检查消息中是否有旧的senderAvatar字段，迁移到avatarMap
        chat.messages.forEach(msg => {
          // 类型断言为包含旧字段的消息类型
          const msgWithOldField = msg as typeof msg & { senderAvatar?: string };
          
          // 如果消息有旧的senderAvatar字段，迁移到avatarMap
          if (msgWithOldField.senderAvatar && !msg.senderAvatarId) {
            const avatarData = msgWithOldField.senderAvatar;
            const avatarId = msg.role === 'user' 
              ? `user_${chat.id}` 
              : `member_${msg.senderName || chat.name}`;
            
            chat.avatarMap![avatarId] = avatarData;
            msg.senderAvatarId = avatarId;
            // 删除旧字段
            delete msgWithOldField.senderAvatar;
          }
        });
        
        return chat;
      });

      // 收集多人设列表
      const personalSettingsCollection = await dataManager.getAllPersonalSettingsFromCollection();

      // 构建导出数据
      const exportData: BackupData = {
        chats: optimizedChats,
        apiConfig,
        personalSettings,
        personalSettingsCollection,
        themeSettings,
        balance,
        transactions,
        giftRecords, // 新增送礼记录
        worldBooks,
        presets,
        chatStatuses: [], // 暂时为空，后续可以扩展
        chatBackgrounds: [], // 暂时为空，后续可以扩展
        discoverPosts,
        discoverComments, // 使用收集到的评论数据
        discoverSettings,
        discoverNotifications,
        discoverDrafts,
        storyModeMessages, // 新增剧情模式消息
        exportTime: new Date().toISOString(),
        version: '1.8' // 更新版本号以支持剧情模式消息备份
      };

      // 创建并下载文件
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setCurrentOperation('导出完成！');
      setSuccess('数据导出成功！文件已下载到您的设备。');

      // 延迟关闭
      setTimeout(() => {
        setIsExporting(false);
        setSuccess(null);
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setError(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsExporting(false);
    }
  };

  // 导入数据
  const handleImportData = async (file: File) => {
    setIsImporting(true);
    setError(null);
    setSuccess(null);
    setImportProgress(0);
    setCurrentOperation('正在读取文件...');

    try {
      const text = await file.text();
      setImportProgress(10);
      setCurrentOperation('正在解析数据...');

      const importData: BackupData = JSON.parse(text);
      setImportProgress(20);

      // 验证数据格式
      if (!importData.version || !importData.exportTime) {
        throw new Error('无效的备份文件格式');
      }

      setCurrentOperation('正在初始化数据库...');
      await dataManager.initDB();
      setImportProgress(30);

      // 导入聊天数据
      if (importData.chats && Array.isArray(importData.chats)) {
        setCurrentOperation('正在导入聊天数据...');
        for (let i = 0; i < importData.chats.length; i++) {
          await dataManager.saveChat(importData.chats[i]);
          setImportProgress(30 + (i / importData.chats.length) * 10);
        }
      }

      // 导入剧情模式消息
      if (importData.storyModeMessages && Array.isArray(importData.storyModeMessages)) {
        setCurrentOperation('正在导入剧情模式消息...');
        for (let i = 0; i < importData.storyModeMessages.length; i++) {
          const storyData = importData.storyModeMessages[i];
          await dataManager.saveStoryModeMessages(storyData.chatId, storyData.messages);
          setImportProgress(40 + (i / importData.storyModeMessages.length) * 5);
        }
      }

      // 导入API配置
      if (importData.apiConfig) {
        setCurrentOperation('正在导入API配置...');
        await dataManager.saveApiConfig(importData.apiConfig);
      }
      setImportProgress(50);

      // 导入个人信息
      if (importData.personalSettings) {
        setCurrentOperation('正在导入个人信息...');
        await dataManager.savePersonalSettings(importData.personalSettings);
      }
      setImportProgress(55);

      // 导入多人设列表
      if (importData.personalSettingsCollection && Array.isArray(importData.personalSettingsCollection)) {
        setCurrentOperation('正在导入人设列表...');
        await dataManager.importPersonalSettingsCollection(importData.personalSettingsCollection);
      }

      // 导入主题设置
      if (importData.themeSettings) {
        setCurrentOperation('正在导入主题设置...');
        await dataManager.saveThemeSettings(importData.themeSettings);
      }
      setImportProgress(60);

      // 导入余额
      if (typeof importData.balance === 'number') {
        setCurrentOperation('正在导入余额信息...');
        await dataManager.saveBalance(importData.balance);
      }
      setImportProgress(65);

      // 导入交易记录
      if (importData.transactions && Array.isArray(importData.transactions)) {
        setCurrentOperation('正在导入交易记录...');
        for (let i = 0; i < importData.transactions.length; i++) {
          await dataManager.addTransaction(importData.transactions[i]);
          setImportProgress(65 + (i / importData.transactions.length) * 5);
        }
      }

      // 导入送礼记录（新增）
      if (importData.giftRecords && Array.isArray(importData.giftRecords)) {
        setCurrentOperation('正在导入送礼记录...');
        for (let i = 0; i < importData.giftRecords.length; i++) {
          await dataManager.addTransaction(importData.giftRecords[i]);
          setImportProgress(70 + (i / importData.giftRecords.length) * 5);
        }
      }

      // 导入世界书
      if (importData.worldBooks && Array.isArray(importData.worldBooks)) {
        setCurrentOperation('正在导入世界书...');
        for (let i = 0; i < importData.worldBooks.length; i++) {
          await dataManager.saveWorldBook(importData.worldBooks[i]);
          setImportProgress(75 + (i / importData.worldBooks.length) * 5);
        }
      }

      // 导入预设
      if (importData.presets && Array.isArray(importData.presets)) {
        setCurrentOperation('正在导入预设配置...');
        for (let i = 0; i < importData.presets.length; i++) {
          await dataManager.savePreset(importData.presets[i]);
          setImportProgress(80 + (i / importData.presets.length) * 5);
        }
      }

      // 导入动态数据
      if (importData.discoverPosts && Array.isArray(importData.discoverPosts)) {
        setCurrentOperation('正在导入动态数据...');
        for (let i = 0; i < importData.discoverPosts.length; i++) {
          await dataManager.saveDiscoverPost(importData.discoverPosts[i]);
          setImportProgress(85 + (i / importData.discoverPosts.length) * 2);
        }
      }

      // 导入动态评论
      if (importData.discoverComments && Array.isArray(importData.discoverComments)) {
        setCurrentOperation('正在导入动态评论...');
        for (let i = 0; i < importData.discoverComments.length; i++) {
          await dataManager.saveDiscoverComment(importData.discoverComments[i]);
          setImportProgress(87 + (i / importData.discoverComments.length) * 2);
        }
      }

      // 导入动态设置
      if (importData.discoverSettings) {
        setCurrentOperation('正在导入动态设置...');
        await dataManager.saveDiscoverSettings(importData.discoverSettings);
      }
      setImportProgress(90);

      // 导入动态通知
      if (importData.discoverNotifications && Array.isArray(importData.discoverNotifications)) {
        setCurrentOperation('正在导入动态通知...');
        for (let i = 0; i < importData.discoverNotifications.length; i++) {
          await dataManager.saveDiscoverNotification(importData.discoverNotifications[i]);
          setImportProgress(90 + (i / importData.discoverNotifications.length) * 2);
        }
      }

      // 导入动态草稿
      if (importData.discoverDrafts && Array.isArray(importData.discoverDrafts)) {
        setCurrentOperation('正在导入动态草稿...');
        for (let i = 0; i < importData.discoverDrafts.length; i++) {
          await dataManager.saveDiscoverDraft(importData.discoverDrafts[i]);
          setImportProgress(92 + (i / importData.discoverDrafts.length) * 2);
        }
      }

      setImportProgress(100);
      setCurrentOperation('导入完成！');
      setSuccess('数据导入成功！');

      // 触发全局事件，通知其他组件刷新数据
      window.dispatchEvent(new CustomEvent('dataImported'));

      // 延迟关闭
      setTimeout(() => {
        setIsImporting(false);
        setSuccess(null);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Import failed:', error);
      setError(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportData(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleClearAllData = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      setCurrentOperation('正在清空数据...');
      await dataManager.clearAllData();
      setSuccess('所有数据已清空！');
      
      // 触发全局事件，通知其他组件刷新数据
      window.dispatchEvent(new CustomEvent('dataCleared'));
      
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Clear data failed:', error);
      setError(`清空数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  console.log('DataBackupManager - 渲染模态框');
  console.log('DataBackupManager - 当前状态:', { isExporting, isImporting, error, success });
  
  return (
    <div className="data-backup-manager" onClick={onClose} style={{ zIndex: 10002 }}>
      <div className="backup-content" onClick={(e) => e.stopPropagation()}>
        <div className="backup-header">
          <h2>数据备份管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="backup-actions">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="backup-actions">
            <div className="action-section">
              <h3>导出数据</h3>
              <p>将所有数据导出为JSON文件，包括聊天记录、剧情模式消息、设置、送礼记录等</p>
              <button 
                className="export-btn"
                onClick={handleExportData}
                disabled={isExporting || isImporting}
              >
                {isExporting ? '导出中...' : '导出数据'}
              </button>
              
              {isExporting && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">{currentOperation}</div>
                  <div className="progress-percentage">{Math.round(exportProgress)}%</div>
                </div>
              )}
            </div>

            <div className="action-section">
              <h3>自动备份设置</h3>
              <p>设置定时自动备份，到达指定时间后会自动提醒您进行数据备份</p>
              
              <div className="auto-backup-status">
                <div className="status-info">
                  <span className="status-label">自动备份状态：</span>
                  <span className={`status-value ${autoBackupEnabled ? 'enabled' : 'disabled'}`}>
                    {autoBackupEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
                
                {autoBackupEnabled && nextBackupTime && (
                  <div className="next-backup-info">
                    <span className="next-backup-label">下次备份时间：</span>
                    <span className="next-backup-time">{nextBackupTime}</span>
                  </div>
                )}
              </div>

                             <div className="auto-backup-actions">
                 <button 
                   className="settings-btn"
                   onClick={() => setShowAutoBackupSettings(!showAutoBackupSettings)}
                   disabled={isExporting || isImporting}
                 >
                   {showAutoBackupSettings ? '隐藏设置' : '设置自动备份'}
                 </button>
                 
                 <button 
                   className="test-btn"
                   onClick={testTimer}
                   style={{ 
                     marginLeft: '10px',
                     background: '#ff6b6b',
                     color: 'white',
                     border: 'none',
                     padding: '8px 16px',
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '0.9rem'
                   }}
                 >
                   测试定时器(5秒)
                 </button>
               </div>

                             {showAutoBackupSettings && (
                 <div className="auto-backup-settings">
                   <div className="setting-item">
                     <label className="setting-label">
                       <input
                         type="checkbox"
                         checked={autoBackupEnabled}
                         onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                         className="setting-checkbox"
                       />
                       启用自动备份
                     </label>
                   </div>

                   {autoBackupEnabled && (
                     <div className="setting-item">
                       <label className="setting-label">备份间隔：</label>
                       <div className="interval-inputs">
                         <input
                           type="number"
                           min="1"
                           max={autoBackupUnit === 'minutes' ? 60 : autoBackupUnit === 'hours' ? 168 : 365}
                           value={autoBackupInterval}
                           onChange={(e) => setAutoBackupInterval(parseInt(e.target.value) || 1)}
                           className="interval-input"
                         />
                         <select
                           value={autoBackupUnit}
                           onChange={(e) => setAutoBackupUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                           className="unit-select"
                         >
                           <option value="minutes">分钟</option>
                           <option value="hours">小时</option>
                           <option value="days">天</option>
                         </select>
                       </div>
                     </div>
                   )}

                   <div className="setting-item">
                     <button 
                       className="save-settings-btn"
                       onClick={handleSaveAutoBackupSettings}
                       disabled={isExporting || isImporting}
                     >
                       保存设置
                     </button>
                   </div>
                 </div>
               )}
            </div>

            <div className="action-section">
              <h3>导入数据</h3>
              <p>从备份文件中恢复所有数据，将覆盖当前数据</p>
              <button 
                className="import-btn"
                onClick={triggerFileSelect}
                disabled={isExporting || isImporting}
              >
                {isImporting ? '导入中...' : '选择文件导入'}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              {isImporting && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">{currentOperation}</div>
                  <div className="progress-percentage">{Math.round(importProgress)}%</div>
                </div>
              )}
            </div>

            <div className="action-section danger-zone">
              <h3>危险操作</h3>
              <p>清空所有数据，此操作不可恢复</p>
              <button 
                className="clear-btn"
                onClick={handleClearAllData}
                disabled={isExporting || isImporting}
              >
                清空所有数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 