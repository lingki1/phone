'use client';

import { useState, useRef } from 'react';
import { dataManager } from '../../../utils/dataManager';
import { ChatItem, ApiConfig, WorldBook } from '../../../types/chat';
import { TransactionRecord } from '../../../types/money';
import { PresetConfig } from '../../../types/preset';
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
      setExportProgress(70);
      setCurrentOperation('正在收集世界书...');

      const worldBooks = await dataManager.getAllWorldBooks();
      setExportProgress(80);
      setCurrentOperation('正在收集预设配置...');

      const presets = await dataManager.getAllPresets();
      setExportProgress(90);
      setCurrentOperation('正在生成导出文件...');

      // 构建导出数据
      const exportData: BackupData = {
        chats,
        apiConfig,
        personalSettings,
        themeSettings,
        balance,
        transactions,
        worldBooks,
        presets,
        chatStatuses: [], // 暂时为空，后续可以扩展
        chatBackgrounds: [], // 暂时为空，后续可以扩展
        exportTime: new Date().toISOString(),
        version: '1.4'
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
          setImportProgress(30 + (i / importData.chats.length) * 20);
        }
      }

      // 导入API配置
      if (importData.apiConfig) {
        setCurrentOperation('正在导入API配置...');
        await dataManager.saveApiConfig(importData.apiConfig);
      }
      setImportProgress(55);

      // 导入个人信息
      if (importData.personalSettings) {
        setCurrentOperation('正在导入个人信息...');
        await dataManager.savePersonalSettings(importData.personalSettings);
      }
      setImportProgress(60);

      // 导入主题设置
      if (importData.themeSettings) {
        setCurrentOperation('正在导入主题设置...');
        await dataManager.saveThemeSettings(importData.themeSettings);
      }
      setImportProgress(65);

      // 导入余额
      if (typeof importData.balance === 'number') {
        setCurrentOperation('正在导入余额信息...');
        await dataManager.saveBalance(importData.balance);
      }
      setImportProgress(70);

      // 导入交易记录
      if (importData.transactions && Array.isArray(importData.transactions)) {
        setCurrentOperation('正在导入交易记录...');
        for (let i = 0; i < importData.transactions.length; i++) {
          await dataManager.addTransaction(importData.transactions[i]);
          setImportProgress(70 + (i / importData.transactions.length) * 10);
        }
      }

      // 导入世界书
      if (importData.worldBooks && Array.isArray(importData.worldBooks)) {
        setCurrentOperation('正在导入世界书...');
        for (let i = 0; i < importData.worldBooks.length; i++) {
          await dataManager.saveWorldBook(importData.worldBooks[i]);
          setImportProgress(80 + (i / importData.worldBooks.length) * 10);
        }
      }

      // 导入预设
      if (importData.presets && Array.isArray(importData.presets)) {
        setCurrentOperation('正在导入预设配置...');
        for (let i = 0; i < importData.presets.length; i++) {
          await dataManager.savePreset(importData.presets[i]);
          setImportProgress(90 + (i / importData.presets.length) * 5);
        }
      }

      setImportProgress(100);
      setCurrentOperation('导入完成！');
      setSuccess('数据导入成功！页面将在3秒后刷新以应用更改。');

      // 延迟刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Import failed:', error);
      setError(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsImporting(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setError('请选择JSON格式的文件');
        return;
      }
      handleImportData(file);
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 清空所有数据
  const handleClearAllData = async () => {
    if (!confirm('⚠️ 警告：此操作将清空所有数据，包括聊天记录、设置、余额等，此操作不可恢复！\n\n确定要继续吗？')) {
      return;
    }

    if (!confirm('最后确认：您真的要清空所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      setCurrentOperation('正在清空数据...');
      await dataManager.initDB();
      await dataManager.clearAllData();
      setSuccess('所有数据已清空！页面将在3秒后刷新。');
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Clear data failed:', error);
      setError(`清空数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="data-backup-manager theme-transition">
      <div className="backup-content">
        <div className="backup-header">
          <h2>数据备份管理</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span>✅ {success}</span>
          </div>
        )}

        {/* 进度条 */}
        {(isExporting || isImporting) && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${isExporting ? exportProgress : importProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">{currentOperation}</div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="backup-actions">
          <div className="action-group">
            <h3>📤 导出数据</h3>
            <p>将所有数据导出为JSON文件，包括：</p>
            <ul>
              <li>所有聊天记录和角色人设</li>
              <li>群聊数据</li>
              <li>API配置</li>
              <li>个人信息和头像</li>
              <li>余额和交易记录</li>
              <li>世界书</li>
              <li>预设配置</li>
              <li>主题设置</li>
            </ul>
            <button 
              className="export-btn"
              onClick={handleExportData}
              disabled={isExporting || isImporting}
            >
              {isExporting ? '导出中...' : '导出所有数据'}
            </button>
          </div>

          <div className="action-group">
            <h3>📥 导入数据</h3>
            <p>从JSON文件导入数据，将覆盖现有数据：</p>
            <ul>
              <li>支持从其他设备导出的备份文件</li>
              <li>导入前请确保已备份重要数据</li>
              <li>导入完成后页面将自动刷新</li>
            </ul>
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
              accept=".json,application/json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="action-group danger-zone">
            <h3>⚠️ 危险操作</h3>
            <p>清空所有数据，此操作不可恢复：</p>
            <button 
              className="clear-btn"
              onClick={handleClearAllData}
              disabled={isExporting || isImporting}
            >
              清空所有数据
            </button>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="backup-help">
          <h3>💡 使用说明</h3>
          <div className="help-content">
            <div className="help-item">
              <strong>导出数据：</strong>
              <p>点击&ldquo;导出所有数据&rdquo;按钮，系统会自动下载一个包含所有数据的JSON文件。建议定期导出备份重要数据。</p>
            </div>
            <div className="help-item">
              <strong>导入数据：</strong>
              <p>点击&ldquo;选择文件导入&rdquo;按钮，选择之前导出的JSON文件。导入将覆盖现有数据，请谨慎操作。</p>
            </div>
            <div className="help-item">
              <strong>数据安全：</strong>
              <p>导出的文件包含敏感信息，请妥善保管，不要分享给他人。建议在安全的环境下进行导入操作。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 