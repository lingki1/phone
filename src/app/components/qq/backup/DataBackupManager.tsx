'use client';

import { useState, useRef } from 'react';
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
  exportTime: string;
  version: string;
}

interface DataBackupManagerProps {
  onClose: () => void;
}

export default function DataBackupManager({ onClose }: DataBackupManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setCurrentOperation('正在收集动态数据...');

      const discoverPosts = await dataManager.getAllDiscoverPosts();
      setExportProgress(87);
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

      setExportProgress(89);
      setCurrentOperation('正在收集动态设置...');

      const discoverSettings = await dataManager.getDiscoverSettings();
      setExportProgress(91);
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

      setExportProgress(93);
      setCurrentOperation('正在收集动态草稿...');

      const discoverDrafts = await dataManager.getAllDiscoverDrafts();
      
      setExportProgress(95);
      setCurrentOperation('正在生成导出文件...');

      // 构建导出数据
      const exportData: BackupData = {
        chats,
        apiConfig,
        personalSettings,
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
        exportTime: new Date().toISOString(),
        version: '1.6' // 更新版本号
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
          setImportProgress(30 + (i / importData.chats.length) * 15);
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

  return (
    <div className="backup-overlay" onClick={onClose}>
      <div className="backup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="backup-header">
          <h2>数据备份管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="backup-content">
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
              <p>将所有数据导出为JSON文件，包括聊天记录、设置、送礼记录等</p>
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