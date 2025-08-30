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

  // 检测数据库版本冲突 - 增强版，支持手机端
  async detectVersionConflict(): Promise<boolean> {
    try {
      console.log('开始检测数据库版本冲突...');
      
      // 方法1: 尝试打开数据库，检查版本冲突
      const hasConflict = await this.checkVersionConflict();
      if (hasConflict) {
        console.log('检测到数据库版本冲突');
        return true;
      }
      
      // 方法2: 检查数据库是否能正常初始化
      try {
        await dataManager.initDB();
        console.log('数据库初始化成功，无版本冲突');
        return false;
      } catch (error) {
        console.warn('数据库初始化失败，可能存在版本冲突:', error);
        return true;
      }
      
    } catch (error) {
      console.error('检测数据库版本冲突时出错:', error);
      return true; // 出错时保守地认为是冲突
    }
  }

  // 检查版本冲突的具体实现 - 增强版，支持版本降级检测
  private async checkVersionConflict(): Promise<boolean> {
    return new Promise((resolve) => {
      // 先尝试不指定版本打开，看看当前数据库的实际版本
      const request = indexedDB.open('ChatAppDB');
      
      const timeout = setTimeout(() => {
        console.warn('数据库打开超时，可能存在版本冲突');
        resolve(true);
      }, 5000); // 增加超时时间，适应手机端

      const cleanup = () => {
        clearTimeout(timeout);
        try {
          request.onerror = null;
          request.onsuccess = null;
          request.onupgradeneeded = null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (request as any).onblocked = null;
        } catch {}
      };

      request.onerror = () => {
        cleanup();
        const error = request.error;
        console.warn('数据库打开错误:', error?.name, error?.message);
        
        if (error && (
          error.name === 'VersionError' || 
          error.name === 'InvalidStateError' ||
          error.name === 'QuotaExceededError' ||
          error.name === 'UnknownError'
        )) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      request.onsuccess = () => {
        cleanup();
        try {
          const db = request.result;
          const currentVersion = db.version;
          console.log('当前数据库版本:', currentVersion);
          db.close();
          
          // 如果数据库版本高于当前代码版本，说明存在版本冲突
          if (currentVersion > 12) {
            console.warn(`检测到版本冲突：数据库版本(${currentVersion}) > 代码版本(12)`);
            resolve(true);
          } else {
            console.log('数据库版本正常，无冲突');
            resolve(false);
          }
        } catch (error) {
          console.warn('数据库关闭时出错:', error);
          resolve(true);
        }
      };

      request.onupgradeneeded = () => {
        cleanup();
        console.log('数据库需要升级，存在版本冲突');
        resolve(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).onblocked = () => {
        cleanup();
        console.warn('数据库被其他标签页阻塞，可能存在版本冲突');
        resolve(true);
      };
    });
  }

  // 强制备份所有数据 - 增强版，支持锁定数据库的数据提取
  async forceBackupAllData(): Promise<RecoveryData> {
    console.log('开始强制备份所有数据...');
    
    try {
      // 方法1: 尝试使用备份管理器创建备份
      console.log('尝试使用备份管理器创建备份...');
      const backupMetadata = await backupManager.createBackup('数据库恢复备份');
      console.log('备份创建成功:', backupMetadata);
      
      // 获取备份数据
      const backupData = await backupManager.restoreBackup(backupMetadata.id);
      if (!backupData) {
        throw new Error('无法获取备份数据');
      }
      
      return backupData as RecoveryData;
      
    } catch (error) {
      console.error('备份管理器失败，尝试强制数据提取:', error);
      
      // 方法2: 强制数据提取（即使数据库被锁定）
      try {
        const extractedData = await this.forceExtractDataFromLockedDatabase();
        if (extractedData && this.hasValidData(extractedData)) {
          console.log('强制数据提取成功');
          return extractedData;
        }
      } catch (extractError) {
        console.error('强制数据提取失败:', extractError);
      }
      
      // 方法3: 回退到localStorage
      console.log('使用localStorage回退方案');
      return this.extractDataFromLocalStorage();
    }
  }

  // 强制从锁定的数据库中提取数据
  private async forceExtractDataFromLockedDatabase(): Promise<RecoveryData | null> {
    console.log('尝试强制从锁定的数据库中提取数据...');
    
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

    // 尝试多种方式打开数据库 - 支持版本降级场景
    const extractionMethods = [
      // 从可能的最高版本开始尝试（降级场景）
      () => this.tryOpenDatabaseWithVersion(15),
      () => this.tryOpenDatabaseWithVersion(14),
      () => this.tryOpenDatabaseWithVersion(13),
      // 当前版本
      () => this.tryOpenDatabaseWithVersion(12),
      // 历史版本
      () => this.tryOpenDatabaseWithVersion(11),
      () => this.tryOpenDatabaseWithVersion(10),
      // 不指定版本（让浏览器自动选择）
      () => this.tryOpenDatabaseWithoutVersion(),
      // 最低版本
      () => this.tryOpenDatabaseWithLowerVersion()
    ];

    for (const method of extractionMethods) {
      try {
        console.log('尝试数据提取方法...');
        const db = await method();
        if (db) {
          console.log('成功打开数据库，开始提取数据...');
          
          // 提取各种数据
          await this.extractDataFromDatabase(db, backupData);
          db.close();
          
          console.log('数据提取完成');
          return backupData;
        }
      } catch (error) {
        console.warn('数据提取方法失败:', error);
        continue;
      }
    }

    console.log('所有数据提取方法都失败了');
    return null;
  }

  // 尝试用指定版本打开数据库 - 增强版，支持版本降级
  private async tryOpenDatabaseWithVersion(version: number): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('ChatAppDB', version);
      
      const timeout = setTimeout(() => {
        console.log(`尝试版本 ${version} 超时`);
        resolve(null);
      }, 3000);

      request.onerror = () => {
        clearTimeout(timeout);
        const error = request.error;
        console.log(`尝试版本 ${version} 失败:`, error?.name);
        resolve(null);
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        const db = request.result;
        console.log(`成功打开数据库，版本: ${db.version}`);
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        clearTimeout(timeout);
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`数据库版本不匹配，请求版本: ${version}，实际版本: ${db.version}`);
        
        // 如果是降级场景（请求版本 < 实际版本），我们可以尝试继续
        if (version < db.version) {
          console.log(`检测到版本降级，尝试继续使用版本 ${db.version}`);
          // 不立即失败，让数据库继续打开
        } else {
          console.log(`版本升级场景，继续处理`);
        }
      };
    });
  }

  // 尝试不指定版本打开数据库
  private async tryOpenDatabaseWithoutVersion(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('ChatAppDB');
      
      const timeout = setTimeout(() => {
        resolve(null);
      }, 3000);

      request.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve(request.result);
      };
    });
  }

  // 尝试用更低版本打开数据库
  private async tryOpenDatabaseWithLowerVersion(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('ChatAppDB', 1);
      
      const timeout = setTimeout(() => {
        resolve(null);
      }, 3000);

      request.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve(request.result);
      };
    });
  }

  // 从数据库中提取数据
  private async extractDataFromDatabase(db: IDBDatabase, backupData: RecoveryData): Promise<void> {
    try {
      // 提取聊天数据
      if (db.objectStoreNames.contains('chats')) {
        const transaction = db.transaction(['chats'], 'readonly');
        const store = transaction.objectStore('chats');
        const request = store.getAll();
        
        request.onsuccess = () => {
          if (request.result) {
            backupData.chats = request.result;
            console.log('提取到聊天数据:', request.result.length, '个');
          }
        };
      }

      // 提取API配置
      if (db.objectStoreNames.contains('apiConfig')) {
        const transaction = db.transaction(['apiConfig'], 'readonly');
        const store = transaction.objectStore('apiConfig');
        const request = store.get('config');
        
        request.onsuccess = () => {
          if (request.result) {
            backupData.apiConfig = request.result;
            console.log('提取到API配置');
          }
        };
      }

      // 提取个人设置
      if (db.objectStoreNames.contains('personalSettings')) {
        const transaction = db.transaction(['personalSettings'], 'readonly');
        const store = transaction.objectStore('personalSettings');
        const request = store.get('settings');
        
        request.onsuccess = () => {
          if (request.result) {
            backupData.personalSettings = request.result;
            console.log('提取到个人设置');
          }
        };
      }

      // 提取其他数据...
      // 这里可以继续添加其他数据类型的提取逻辑

    } catch (error) {
      console.warn('从数据库提取数据时出错:', error);
    }
  }

  // 检查提取的数据是否有效
  private hasValidData(data: RecoveryData): boolean {
    return data.chats.length > 0 || 
           data.apiConfig.apiKey !== '' || 
           data.personalSettings.userNickname !== '用户' ||
           data.worldBooks.length > 0 ||
           data.presets.length > 0;
  }

  // 从localStorage提取数据
  private extractDataFromLocalStorage(): RecoveryData {
    console.log('从localStorage提取数据...');
    
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
      try {
        backupData.chats = JSON.parse(savedChats);
        console.log('从localStorage提取到聊天数据:', backupData.chats.length, '个');
      } catch (error) {
        console.warn('解析localStorage聊天数据失败:', error);
      }
    }

    const savedApiConfig = localStorage.getItem('apiConfig');
    if (savedApiConfig) {
      try {
        backupData.apiConfig = JSON.parse(savedApiConfig);
        console.log('从localStorage提取到API配置');
      } catch (error) {
        console.warn('解析localStorage API配置失败:', error);
      }
    }

    const savedPersonalSettings = localStorage.getItem('personalSettings');
    if (savedPersonalSettings) {
      try {
        backupData.personalSettings = JSON.parse(savedPersonalSettings);
        console.log('从localStorage提取到个人设置');
      } catch (error) {
        console.warn('解析localStorage个人设置失败:', error);
      }
    }

    const savedBalance = localStorage.getItem('balance');
    if (savedBalance) {
      try {
        backupData.balance = parseFloat(savedBalance);
        console.log('从localStorage提取到余额:', backupData.balance);
      } catch (error) {
        console.warn('解析localStorage余额失败:', error);
      }
    }

    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        backupData.transactions = JSON.parse(savedTransactions);
        console.log('从localStorage提取到交易记录:', backupData.transactions.length, '条');
      } catch (error) {
        console.warn('解析localStorage交易记录失败:', error);
      }
    }

    const savedWorldBooks = localStorage.getItem('worldBooks');
    if (savedWorldBooks) {
      try {
        backupData.worldBooks = JSON.parse(savedWorldBooks);
        console.log('从localStorage提取到世界书:', backupData.worldBooks.length, '本');
      } catch (error) {
        console.warn('解析localStorage世界书失败:', error);
      }
    }

    const savedPresets = localStorage.getItem('presets');
    if (savedPresets) {
      try {
        backupData.presets = JSON.parse(savedPresets);
        console.log('从localStorage提取到预设:', backupData.presets.length, '个');
      } catch (error) {
        console.warn('解析localStorage预设失败:', error);
      }
    }
    
    return backupData;
  }

  // 清理并重建数据库 - 增强版，支持手机端强制删除
  async clearAndRebuildDatabase(): Promise<void> {
    console.log('开始清理并重建数据库...');
    
    try {
      // 步骤1: 关闭所有现有连接
      await this.closeAllConnections();
      
      // 步骤2: 强制删除数据库（多次尝试）
      await this.forceDeleteDatabase();
      
      // 步骤3: 等待删除完成
      await this.waitForDatabaseDeletion();
      
      console.log('数据库删除成功');
      
    } catch (error) {
      console.error('清理数据库时出错:', error);
      throw error;
    }
  }

  // 关闭所有数据库连接
  private async closeAllConnections(): Promise<void> {
    console.log('关闭所有数据库连接...');
    
    try {
      // 关闭dataManager的连接
      if (dataManager['db']) {
        dataManager['db'].close();
        dataManager['db'] = null;
      }
      
      // 关闭backupManager的连接
      if (backupManager['backupDB']) {
        backupManager['backupDB'].close();
        backupManager['backupDB'] = null;
      }
      
      // 等待一小段时间确保连接完全关闭
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.warn('关闭连接时出错:', error);
    }
  }

  // 强制删除数据库
  private async forceDeleteDatabase(): Promise<void> {
    console.log('强制删除数据库...');
    
    const maxAttempts = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`删除数据库尝试 ${attempt}/${maxAttempts}`);
        
        const deleteRequest = indexedDB.deleteDatabase('ChatAppDB');
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`删除数据库超时 (尝试 ${attempt})`));
          }, 10000); // 增加超时时间

          deleteRequest.onerror = () => {
            clearTimeout(timeout);
            const error = deleteRequest.error;
            console.warn(`删除数据库失败 (尝试 ${attempt}):`, error?.name, error?.message);
            reject(new Error(`删除数据库失败: ${error?.name || 'Unknown'}`));
          };

          deleteRequest.onsuccess = () => {
            clearTimeout(timeout);
            console.log(`数据库删除成功 (尝试 ${attempt})`);
            resolve();
          };

          deleteRequest.onblocked = () => {
            console.warn(`数据库删除被阻塞 (尝试 ${attempt})`);
            // 不立即失败，等待一段时间
            setTimeout(() => {
              if (deleteRequest.readyState === 'done') {
                clearTimeout(timeout);
                resolve();
              }
            }, 2000);
          };
        });
        
        // 如果成功，跳出循环
        return;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`删除数据库尝试 ${attempt} 失败:`, error);
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // 所有尝试都失败了
    throw new Error(`删除数据库失败，已尝试 ${maxAttempts} 次: ${lastError?.message}`);
  }

  // 等待数据库删除完成
  private async waitForDatabaseDeletion(): Promise<void> {
    console.log('等待数据库删除完成...');
    
    // 等待一段时间确保删除操作完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 验证数据库是否真的被删除了
    try {
      const request = indexedDB.open('ChatAppDB');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('验证数据库删除状态超时'));
        }, 5000);

        request.onsuccess = () => {
          clearTimeout(timeout);
          const db = request.result;
          console.log('数据库仍然存在，版本:', db.version);
          db.close();
          // 数据库仍然存在，但这是正常的，因为删除操作可能还在进行中
          resolve();
        };

        request.onerror = () => {
          clearTimeout(timeout);
          console.log('数据库已成功删除');
          resolve();
        };
      });
    } catch (error) {
      console.warn('验证数据库删除状态时出错:', error);
      // 不抛出错误，因为删除可能仍在进行中
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
