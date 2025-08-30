// 数据库版本冲突自动恢复工具
import { dataManager } from './dataManager';
import { backupManager } from './backupManager';
import type { ChatItem, ApiConfig, WorldBook } from '../types/chat';
import type { TransactionRecord } from '../types/money';
import type { PresetConfig } from '../types/preset';
import type { DiscoverPost, DiscoverComment, DiscoverSettings, DiscoverNotification, DiscoverDraft } from '../types/discover';

interface RecoveryData {
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
  storyModeMessages: Array<{
    chatId: string;
    messages: import('../types/chat').Message[];
  }>;
  discoverPosts: DiscoverPost[];
  discoverComments: DiscoverComment[];
  discoverSettings: DiscoverSettings;
  discoverNotifications: DiscoverNotification[];
  discoverDrafts: DiscoverDraft[];
  exportTime: string;
  version: string;
}

class DatabaseRecovery {
  private static instance: DatabaseRecovery;
  
  static getInstance(): DatabaseRecovery {
    if (!DatabaseRecovery.instance) {
      DatabaseRecovery.instance = new DatabaseRecovery();
    }
    return DatabaseRecovery.instance;
  }

  // 检测数据库版本冲突
  async detectVersionConflict(): Promise<boolean> {
    try {
      // 尝试打开数据库，如果出现版本错误，说明有冲突
      const request = indexedDB.open('ChatAppDB', 12);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(true); // 超时也认为是冲突
        }, 3000);

        request.onerror = () => {
          clearTimeout(timeout);
          const error = request.error;
          if (error && (error.name === 'VersionError' || error.name === 'InvalidStateError')) {
            console.warn('检测到数据库版本冲突:', error.name);
            resolve(true);
          } else {
            resolve(false);
          }
        };

        request.onsuccess = () => {
          clearTimeout(timeout);
          request.result.close();
          resolve(false);
        };

        request.onupgradeneeded = () => {
          clearTimeout(timeout);
          // 如果需要升级，说明版本不匹配
          resolve(true);
        };
      });
    } catch (error) {
      console.error('检测数据库版本冲突时出错:', error);
      return true; // 出错时保守地认为是冲突
    }
  }

  // 强制备份所有数据
  async forceBackupAllData(): Promise<RecoveryData> {
    console.log('开始强制备份所有数据...');
    
    try {
      // 使用新的备份管理器创建备份
      const backupMetadata = await backupManager.createBackup('数据库恢复备份');
      console.log('备份创建成功:', backupMetadata);
      
      // 获取备份数据
      const backupData = await backupManager.restoreBackup(backupMetadata.id);
      if (!backupData) {
        throw new Error('无法获取备份数据');
      }
      
      return backupData as RecoveryData;
      
    } catch (error) {
      console.error('备份失败，使用localStorage回退:', error);
      
      // 回退到localStorage
      const backupData: RecoveryData = {
        chats: [],
        apiConfig: { proxyUrl: '', apiKey: '', model: '' },
        personalSettings: {
          userAvatar: '/avatars/user-avatar.svg',
          userNickname: '用户',
          userBio: ''
        },
        themeSettings: {
          selectedTheme: 'default',
          lastUpdated: Date.now()
        },
        balance: 0,
        transactions: [],
        worldBooks: [],
        presets: [],
        chatStatuses: [],
        chatBackgrounds: [],
        storyModeMessages: [],
        discoverPosts: [],
        discoverComments: [],
        discoverSettings: {
          autoGeneratePosts: true,
          autoGenerateInterval: 5,
          maxPostsPerDay: 10,
          allowAiComments: true,
          allowAiLikes: true,
          privacyLevel: 'public',
          notifyOnNewPosts: true,
          theme: 'default'
        },
        discoverNotifications: [],
        discoverDrafts: [],
        exportTime: new Date().toISOString(),
        version: '1.6'
      };

      // 从localStorage获取数据
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        backupData.chats = JSON.parse(savedChats);
      }

      const savedApiConfig = localStorage.getItem('apiConfig');
      if (savedApiConfig) {
        backupData.apiConfig = JSON.parse(savedApiConfig);
      }

      const savedPersonalSettings = localStorage.getItem('personalSettings');
      if (savedPersonalSettings) {
        backupData.personalSettings = JSON.parse(savedPersonalSettings);
      }

      const savedBalance = localStorage.getItem('balance');
      if (savedBalance) {
        backupData.balance = parseFloat(savedBalance);
      }

      const savedTransactions = localStorage.getItem('transactions');
      if (savedTransactions) {
        backupData.transactions = JSON.parse(savedTransactions);
      }

      const savedWorldBooks = localStorage.getItem('worldBooks');
      if (savedWorldBooks) {
        backupData.worldBooks = JSON.parse(savedWorldBooks);
      }

      const savedPresets = localStorage.getItem('presets');
      if (savedPresets) {
        backupData.presets = JSON.parse(savedPresets);
      }
      
      return backupData;
    }
  }

  // 清理并重建数据库
  async clearAndRebuildDatabase(): Promise<void> {
    console.log('开始清理并重建数据库...');
    
    try {
      // 关闭现有连接
      if (dataManager['db']) {
        dataManager['db'].close();
        dataManager['db'] = null;
      }
      
      // 删除数据库
      const deleteRequest = indexedDB.deleteDatabase('ChatAppDB');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('删除数据库超时'));
        }, 5000);

        deleteRequest.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('删除数据库失败'));
        };

        deleteRequest.onsuccess = () => {
          clearTimeout(timeout);
          console.log('数据库删除成功');
          resolve();
        };
      });
    } catch (error) {
      console.error('清理数据库时出错:', error);
      throw error;
    }
  }

  // 恢复数据到新数据库
  async restoreDataToNewDatabase(backupData: RecoveryData): Promise<void> {
    console.log('开始恢复数据到新数据库...');
    
    try {
      // 重新初始化数据库
      await dataManager.initDB();
      
      // 恢复聊天数据
      if (backupData.chats && backupData.chats.length > 0) {
        for (const chat of backupData.chats) {
          await dataManager.saveChat(chat);
        }
        console.log('已恢复聊天数据:', backupData.chats.length, '个聊天');
      }
      
      // 恢复API配置
      if (backupData.apiConfig) {
        await dataManager.saveApiConfig(backupData.apiConfig);
        console.log('已恢复API配置');
      }
      
      // 恢复个人设置
      if (backupData.personalSettings) {
        await dataManager.savePersonalSettings(backupData.personalSettings);
        console.log('已恢复个人设置');
      }
      
      // 恢复主题设置
      if (backupData.themeSettings) {
        await dataManager.saveThemeSettings(backupData.themeSettings);
        console.log('已恢复主题设置');
      }
      
      // 恢复余额
      if (typeof backupData.balance === 'number') {
        await dataManager.saveBalance(backupData.balance);
        console.log('已恢复余额:', backupData.balance);
      }
      
      // 恢复交易记录
      if (backupData.transactions && backupData.transactions.length > 0) {
        for (const transaction of backupData.transactions) {
          await dataManager.addTransaction(transaction);
        }
        console.log('已恢复交易记录:', backupData.transactions.length, '条');
      }
      
      // 恢复世界书
      if (backupData.worldBooks && backupData.worldBooks.length > 0) {
        for (const worldBook of backupData.worldBooks) {
          await dataManager.saveWorldBook(worldBook);
        }
        console.log('已恢复世界书:', backupData.worldBooks.length, '本');
      }
      
      // 恢复预设
      if (backupData.presets && backupData.presets.length > 0) {
        for (const preset of backupData.presets) {
          await dataManager.savePreset(preset);
        }
        console.log('已恢复预设:', backupData.presets.length, '个');
      }
      
      // 恢复聊天状态
      if (backupData.chatStatuses && backupData.chatStatuses.length > 0) {
        for (const status of backupData.chatStatuses) {
          const { chatId, ...statusData } = status;
          await dataManager.saveChatStatus(chatId, statusData);
        }
        console.log('已恢复聊天状态:', backupData.chatStatuses.length, '个');
      }
      
      // 恢复聊天背景
      if (backupData.chatBackgrounds && backupData.chatBackgrounds.length > 0) {
        for (const bg of backupData.chatBackgrounds) {
          await dataManager.saveChatBackground(bg.chatId, bg.background);
        }
        console.log('已恢复聊天背景:', backupData.chatBackgrounds.length, '个');
      }
      
      // 恢复剧情模式消息
      if (backupData.storyModeMessages && backupData.storyModeMessages.length > 0) {
        for (const storyData of backupData.storyModeMessages) {
          await dataManager.saveStoryModeMessages(storyData.chatId, storyData.messages);
        }
        console.log('已恢复剧情模式消息:', backupData.storyModeMessages.length, '个聊天');
      }
      
      // 恢复动态数据
      if (backupData.discoverPosts && backupData.discoverPosts.length > 0) {
        for (const post of backupData.discoverPosts) {
          await dataManager.saveDiscoverPost(post);
        }
        console.log('已恢复动态:', backupData.discoverPosts.length, '条');
      }
      
      // 恢复动态设置
      if (backupData.discoverSettings) {
        await dataManager.saveDiscoverSettings(backupData.discoverSettings);
        console.log('已恢复动态设置');
      }
      
      // 恢复动态评论
      if (backupData.discoverComments && backupData.discoverComments.length > 0) {
        for (const comment of backupData.discoverComments) {
          await dataManager.saveDiscoverComment(comment);
        }
        console.log('已恢复动态评论:', backupData.discoverComments.length, '条');
      }
      
      // 恢复动态通知
      if (backupData.discoverNotifications && backupData.discoverNotifications.length > 0) {
        for (const notification of backupData.discoverNotifications) {
          await dataManager.saveDiscoverNotification(notification);
        }
        console.log('已恢复动态通知:', backupData.discoverNotifications.length, '条');
      }
      
      // 恢复动态草稿
      if (backupData.discoverDrafts && backupData.discoverDrafts.length > 0) {
        for (const draft of backupData.discoverDrafts) {
          await dataManager.saveDiscoverDraft(draft);
        }
        console.log('已恢复动态草稿:', backupData.discoverDrafts.length, '个');
      }
      
      console.log('数据恢复完成！');
      
    } catch (error) {
      console.error('恢复数据时出错:', error);
      throw error;
    }
  }

  // 执行完整的数据库恢复流程
  async performFullRecovery(): Promise<boolean> {
    console.log('开始执行完整的数据库恢复流程...');
    
    try {
      // 1. 检测版本冲突
      const hasConflict = await this.detectVersionConflict();
      if (!hasConflict) {
        console.log('未检测到数据库版本冲突');
        return false;
      }
      
      console.log('检测到数据库版本冲突，开始恢复流程...');
      
      // 2. 强制备份所有数据
      const backupData = await this.forceBackupAllData();
      console.log('数据备份完成');
      
      // 3. 清理并重建数据库
      await this.clearAndRebuildDatabase();
      console.log('数据库重建完成');
      
      // 4. 恢复数据到新数据库
      await this.restoreDataToNewDatabase(backupData);
      console.log('数据恢复完成');
      
      // 5. 清理备份标记
      localStorage.removeItem('databaseRecoveryBackup');
      
      console.log('数据库恢复流程完成！');
      return true;
      
    } catch (error) {
      console.error('数据库恢复流程失败:', error);
      
      // 尝试从localStorage恢复备份
      try {
        const backupJson = localStorage.getItem('databaseRecoveryBackup');
        if (backupJson) {
          const backupData = JSON.parse(backupJson);
          await this.restoreDataToNewDatabase(backupData);
          console.log('从备份恢复了数据');
          return true;
        }
      } catch (backupError) {
        console.error('从备份恢复失败:', backupError);
      }
      
      throw error;
    }
  }

  // 检查是否有可用的备份数据
  hasBackupData(): boolean {
    return !!localStorage.getItem('databaseRecoveryBackup');
  }

  // 获取备份数据
  getBackupData(): RecoveryData | null {
    try {
      const backupJson = localStorage.getItem('databaseRecoveryBackup');
      if (backupJson) {
        return JSON.parse(backupJson);
      }
    } catch (error) {
      console.error('获取备份数据失败:', error);
    }
    return null;
  }
}

export const databaseRecovery = DatabaseRecovery.getInstance();
