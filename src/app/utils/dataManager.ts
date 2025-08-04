// 数据管理器 - 用于持久化存储聊天数据
import { ChatItem, GroupMember, ApiConfig, WorldBook } from '../types/chat';
import { TransactionRecord } from '../types/money';
import { PresetConfig } from '../types/preset';

const DB_NAME = 'ChatAppDB';
const DB_VERSION = 8; // 升级数据库版本以支持聊天背景功能
const CHAT_STORE = 'chats';
const API_CONFIG_STORE = 'apiConfig';
const PERSONAL_SETTINGS_STORE = 'personalSettings';
const THEME_SETTINGS_STORE = 'themeSettings';
const BALANCE_STORE = 'balance';
const TRANSACTION_STORE = 'transactions';
const WORLD_BOOK_STORE = 'worldBooks';
const PRESET_STORE = 'presets';
const CHAT_STATUS_STORE = 'chatStatus';
const CHAT_BACKGROUND_STORE = 'chatBackgrounds';

class DataManager {
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建聊天存储
        if (!db.objectStoreNames.contains(CHAT_STORE)) {
          const chatStore = db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
          chatStore.createIndex('isGroup', 'isGroup', { unique: false });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建API配置存储
        if (!db.objectStoreNames.contains(API_CONFIG_STORE)) {
          db.createObjectStore(API_CONFIG_STORE, { keyPath: 'id' });
        }

        // 创建个人信息存储
        if (!db.objectStoreNames.contains(PERSONAL_SETTINGS_STORE)) {
          db.createObjectStore(PERSONAL_SETTINGS_STORE, { keyPath: 'id' });
        }

        // 创建主题设置存储
        if (!db.objectStoreNames.contains(THEME_SETTINGS_STORE)) {
          db.createObjectStore(THEME_SETTINGS_STORE, { keyPath: 'id' });
        }

        // 创建余额存储
        if (!db.objectStoreNames.contains(BALANCE_STORE)) {
          db.createObjectStore(BALANCE_STORE, { keyPath: 'id' });
        }

        // 创建交易记录存储
        if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
          const transactionStore = db.createObjectStore(TRANSACTION_STORE, { keyPath: 'id' });
          transactionStore.createIndex('chatId', 'chatId', { unique: false });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
        }

        // 创建世界书存储
        if (!db.objectStoreNames.contains(WORLD_BOOK_STORE)) {
          const worldBookStore = db.createObjectStore(WORLD_BOOK_STORE, { keyPath: 'id' });
          worldBookStore.createIndex('name', 'name', { unique: false });
          worldBookStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建预设存储
        if (!db.objectStoreNames.contains(PRESET_STORE)) {
          const presetStore = db.createObjectStore(PRESET_STORE, { keyPath: 'id' });
          presetStore.createIndex('name', 'name', { unique: false });
          presetStore.createIndex('isDefault', 'isDefault', { unique: false });
          presetStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建聊天状态存储
        if (!db.objectStoreNames.contains(CHAT_STATUS_STORE)) {
          const statusStore = db.createObjectStore(CHAT_STATUS_STORE, { keyPath: 'chatId' });
          statusStore.createIndex('lastUpdate', 'lastUpdate', { unique: false });
        }

        // 创建聊天背景存储
        if (!db.objectStoreNames.contains(CHAT_BACKGROUND_STORE)) {
          db.createObjectStore(CHAT_BACKGROUND_STORE, { keyPath: 'chatId' });
        }
      };
    });
  }

  // 保存聊天数据
  async saveChat(chat: ChatItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_STORE);
      const request = store.put(chat);

      request.onerror = () => reject(new Error('Failed to save chat'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有聊天
  async getAllChats(): Promise<ChatItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE], 'readonly');
      const store = transaction.objectStore(CHAT_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get chats'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // 获取单个聊天
  async getChat(id: string): Promise<ChatItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE], 'readonly');
      const store = transaction.objectStore(CHAT_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get chat'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 删除聊天
  async deleteChat(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete chat'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取群聊列表
  async getGroupChats(): Promise<ChatItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE], 'readonly');
      const store = transaction.objectStore(CHAT_STORE);
      const index = store.index('isGroup');
      const request = index.getAll(IDBKeyRange.only(true));

      request.onerror = () => reject(new Error('Failed to get group chats'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // 保存API配置
  async saveApiConfig(config: ApiConfig): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([API_CONFIG_STORE], 'readwrite');
      const store = transaction.objectStore(API_CONFIG_STORE);
      const request = store.put({ ...config, id: 'default' });

      request.onerror = () => reject(new Error('Failed to save API config'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取API配置
  async getApiConfig(): Promise<ApiConfig> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([API_CONFIG_STORE], 'readonly');
      const store = transaction.objectStore(API_CONFIG_STORE);
      const request = store.get('default');

      request.onerror = () => reject(new Error('Failed to get API config'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            proxyUrl: result.proxyUrl || '',
            apiKey: result.apiKey || '',
            model: result.model || ''
          });
        } else {
          resolve({
            proxyUrl: '',
            apiKey: '',
            model: ''
          });
        }
      };
    });
  }

  // 保存个人信息
  async savePersonalSettings(settings: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONAL_SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(PERSONAL_SETTINGS_STORE);
      const request = store.put({ ...settings, id: 'default' });

      request.onerror = () => reject(new Error('Failed to save personal settings'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取个人信息
  async getPersonalSettings(): Promise<{
    userAvatar: string;
    userNickname: string;
    userBio: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONAL_SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(PERSONAL_SETTINGS_STORE);
      const request = store.get('default');

      request.onerror = () => reject(new Error('Failed to get personal settings'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            userAvatar: result.userAvatar || '/avatars/user-avatar.svg',
            userNickname: result.userNickname || '用户',
            userBio: result.userBio || ''
          });
        } else {
          resolve({
            userAvatar: '/avatars/user-avatar.svg',
            userNickname: '用户',
            userBio: ''
          });
        }
      };
    });
  }

  // 创建默认群聊数据
  createDefaultGroupChat(members: GroupMember[]): ChatItem {
    const groupId = Date.now().toString();
    const groupName = members.length > 0 ? `${members.map(m => m.groupNickname).join('、')}` : '新群聊';
    
    return {
      id: groupId,
      name: groupName,
      avatar: '/avatars/default-avatar.svg',
      lastMessage: '群聊已创建',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isGroup: true,
      unreadCount: 0,
      messages: [{
        id: `${groupId}_welcome`,
        role: 'system',
        content: '群聊已创建，开始愉快地聊天吧！',
        timestamp: Date.now(),
        type: 'text'
      }],
      persona: '这是一个群聊，成员可以自由交流。',
      members: members,
      notice: '',
      settings: {
        aiPersona: '群聊助手',
        myPersona: '群成员',
        myNickname: '我',
        maxMemory: 20,
        aiAvatar: '/avatars/default-avatar.svg',
        myAvatar: '/avatars/user-avatar.svg',
        groupAvatar: '/avatars/default-avatar.svg',
        background: 'default',
        theme: 'light',
        fontSize: 14,
        customCss: '',
        linkedWorldBookIds: [],
        aiAvatarLibrary: [],
        aiAvatarFrame: '',
        myAvatarFrame: ''
      }
    };
  }

  // 导出所有数据
  async exportAllData(): Promise<string> {
    try {
      // 收集所有数据
      const chats = await this.getAllChats();
      const apiConfig = await this.getApiConfig();
      const personalSettings = await this.getPersonalSettings();
      const themeSettings = await this.getThemeSettings();
      const balance = await this.getBalance();
      const transactions = await this.getTransactionHistory();
      const worldBooks = await this.getAllWorldBooks();
      const presets = await this.getAllPresets();
      
      // 收集聊天状态数据
      const chatStatuses: unknown[] = [];
      const chatBackgrounds: unknown[] = [];
      
      // 为每个聊天收集状态和背景数据
      for (const chat of chats) {
        try {
          const status = await this.getChatStatus(chat.id);
          if (status) {
            chatStatuses.push({ chatId: chat.id, ...status });
          }
          
          const background = await this.getChatBackground(chat.id);
          if (background) {
            chatBackgrounds.push({ chatId: chat.id, background });
          }
        } catch (error) {
          console.warn(`Failed to get status/background for chat ${chat.id}:`, error);
        }
      }
      
      const exportData = {
        chats,
        apiConfig,
        personalSettings,
        themeSettings,
        balance,
        transactions,
        worldBooks,
        presets,
        chatStatuses,
        chatBackgrounds,
        exportTime: new Date().toISOString(),
        version: '1.4'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 导入所有数据
  async importAllData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      // 验证数据格式
      if (!data.version || !data.exportTime) {
        throw new Error('无效的备份文件格式');
      }
      
      // 导入聊天数据
      if (data.chats && Array.isArray(data.chats)) {
        for (const chat of data.chats) {
          await this.saveChat(chat);
        }
      }

      // 导入API配置
      if (data.apiConfig) {
        await this.saveApiConfig(data.apiConfig);
      }

      // 导入个人信息
      if (data.personalSettings) {
        await this.savePersonalSettings(data.personalSettings);
      }

      // 导入主题设置
      if (data.themeSettings) {
        await this.saveThemeSettings(data.themeSettings);
      }

      // 导入余额
      if (typeof data.balance === 'number') {
        await this.saveBalance(data.balance);
      }

      // 导入交易记录
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const transaction of data.transactions) {
          await this.addTransaction(transaction);
        }
      }

      // 导入世界书
      if (data.worldBooks && Array.isArray(data.worldBooks)) {
        for (const worldBook of data.worldBooks) {
          await this.saveWorldBook(worldBook);
        }
      }

      // 导入预设
      if (data.presets && Array.isArray(data.presets)) {
        for (const preset of data.presets) {
          await this.savePreset(preset);
        }
      }

      // 导入聊天状态
      if (data.chatStatuses && Array.isArray(data.chatStatuses)) {
        for (const status of data.chatStatuses) {
          const { chatId, ...statusData } = status;
          await this.saveChatStatus(chatId, statusData);
        }
      }

      // 导入聊天背景
      if (data.chatBackgrounds && Array.isArray(data.chatBackgrounds)) {
        for (const bg of data.chatBackgrounds) {
          await this.saveChatBackground(bg.chatId, bg.background);
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 导出数据（保持向后兼容）
  async exportData(): Promise<string> {
    return this.exportAllData();
  }

  // 导入数据（保持向后兼容）
  async importData(jsonData: string): Promise<void> {
    return this.importAllData(jsonData);
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE, API_CONFIG_STORE, PERSONAL_SETTINGS_STORE, THEME_SETTINGS_STORE, BALANCE_STORE, TRANSACTION_STORE, WORLD_BOOK_STORE], 'readwrite');
      
      const chatStore = transaction.objectStore(CHAT_STORE);
      const apiStore = transaction.objectStore(API_CONFIG_STORE);
      const personalStore = transaction.objectStore(PERSONAL_SETTINGS_STORE);
      const themeStore = transaction.objectStore(THEME_SETTINGS_STORE);
      const balanceStore = transaction.objectStore(BALANCE_STORE);
      const transactionStore = transaction.objectStore(TRANSACTION_STORE);
      const worldBookStore = transaction.objectStore(WORLD_BOOK_STORE);
      
      const clearChats = chatStore.clear();
      const clearApi = apiStore.clear();
      const clearPersonal = personalStore.clear();
      const clearTheme = themeStore.clear();
      const clearBalance = balanceStore.clear();
      const clearTransactions = transactionStore.clear();
      const clearWorldBooks = worldBookStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 7) resolve();
      };

      clearChats.onerror = () => reject(new Error('Failed to clear chat data'));
      clearChats.onsuccess = checkComplete;

      clearApi.onerror = () => reject(new Error('Failed to clear API config'));
      clearApi.onsuccess = checkComplete;

      clearPersonal.onerror = () => reject(new Error('Failed to clear personal settings'));
      clearPersonal.onsuccess = checkComplete;

      clearTheme.onerror = () => reject(new Error('Failed to clear theme settings'));
      clearTheme.onsuccess = checkComplete;

      clearBalance.onerror = () => reject(new Error('Failed to clear balance data'));
      clearBalance.onsuccess = checkComplete;

      clearTransactions.onerror = () => reject(new Error('Failed to clear transaction data'));
      clearTransactions.onsuccess = checkComplete;

      clearWorldBooks.onerror = () => reject(new Error('Failed to clear world book data'));
      clearWorldBooks.onsuccess = checkComplete;
    });
  }

  // 获取数据库统计信息
  async getStats(): Promise<{
    totalChats: number;
    groupChats: number;
    privateChats: number;
    totalMessages: number;
  }> {
    const chats = await this.getAllChats();
    const groupChats = chats.filter(chat => chat.isGroup);
    const privateChats = chats.filter(chat => !chat.isGroup);
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);

    return {
      totalChats: chats.length,
      groupChats: groupChats.length,
      privateChats: privateChats.length,
      totalMessages
    };
  }

  // 保存主题设置
  async saveThemeSettings(settings: {
    selectedTheme: string;
    lastUpdated: number;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([THEME_SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(THEME_SETTINGS_STORE);
      const request = store.put({ ...settings, id: 'default' });

      request.onerror = () => reject(new Error('Failed to save theme settings'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取主题设置
  async getThemeSettings(): Promise<{
    selectedTheme: string;
    lastUpdated: number;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([THEME_SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(THEME_SETTINGS_STORE);
      const request = store.get('default');

      request.onerror = () => reject(new Error('Failed to get theme settings'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            selectedTheme: result.selectedTheme || 'default',
            lastUpdated: result.lastUpdated || Date.now()
          });
        } else {
          resolve(null);
        }
      };
    });
  }

  // 保存用户余额
  async saveBalance(balance: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BALANCE_STORE], 'readwrite');
      const store = transaction.objectStore(BALANCE_STORE);
      const request = store.put({ 
        id: 'default', 
        balance: balance, 
        lastUpdated: Date.now() 
      });

      request.onerror = () => reject(new Error('Failed to save balance'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取用户余额
  async getBalance(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([BALANCE_STORE], 'readonly');
      const store = transaction.objectStore(BALANCE_STORE);
      const request = store.get('default');

      request.onerror = () => reject(new Error('Failed to get balance'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.balance || 0);
        } else {
          // 如果没有余额记录，初始化为0并保存
          this.saveBalance(0).then(() => resolve(0)).catch(() => resolve(0));
        }
      };
    });
  }

  // 添加交易记录
  async addTransaction(transaction: {
    id: string;
    type: 'send' | 'receive';
    amount: number;
    chatId: string;
    fromUser: string;
    toUser: string;
    message?: string;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const dbTransaction = this.db!.transaction([TRANSACTION_STORE], 'readwrite');
      const store = dbTransaction.objectStore(TRANSACTION_STORE);
      const request = store.put(transaction);

      request.onerror = () => reject(new Error('Failed to add transaction'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取交易历史记录
  async getTransactionHistory(limit?: number): Promise<{
    id: string;
    type: 'send' | 'receive';
    amount: number;
    chatId: string;
    fromUser: string;
    toUser: string;
    message?: string;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
  }[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSACTION_STORE], 'readonly');
      const store = transaction.objectStore(TRANSACTION_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // 按时间倒序

      const results: TransactionRecord[] = [];
      let count = 0;

      request.onerror = () => reject(new Error('Failed to get transaction history'));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && (!limit || count < limit)) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  // 根据聊天ID获取交易记录
  async getTransactionsByChatId(chatId: string): Promise<{
    id: string;
    type: 'send' | 'receive';
    amount: number;
    chatId: string;
    fromUser: string;
    toUser: string;
    message?: string;
    timestamp: number;
    status: 'pending' | 'completed' | 'failed';
  }[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRANSACTION_STORE], 'readonly');
      const store = transaction.objectStore(TRANSACTION_STORE);
      const index = store.index('chatId');
      const request = index.getAll(IDBKeyRange.only(chatId));

      request.onerror = () => reject(new Error('Failed to get transactions by chat ID'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // ==================== 世界书相关方法 ====================

  // 保存世界书
  async saveWorldBook(worldBook: WorldBook): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([WORLD_BOOK_STORE], 'readwrite');
      const store = transaction.objectStore(WORLD_BOOK_STORE);
      const request = store.put(worldBook);

      request.onerror = () => reject(new Error('Failed to save world book'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有世界书
  async getAllWorldBooks(): Promise<WorldBook[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([WORLD_BOOK_STORE], 'readonly');
      const store = transaction.objectStore(WORLD_BOOK_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get world books'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // 获取单个世界书
  async getWorldBook(id: string): Promise<WorldBook | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([WORLD_BOOK_STORE], 'readonly');
      const store = transaction.objectStore(WORLD_BOOK_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get world book'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 删除世界书
  async deleteWorldBook(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([WORLD_BOOK_STORE], 'readwrite');
      const store = transaction.objectStore(WORLD_BOOK_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete world book'));
      request.onsuccess = () => resolve();
    });
  }

  // 更新世界书
  async updateWorldBook(worldBook: WorldBook): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([WORLD_BOOK_STORE], 'readwrite');
      const store = transaction.objectStore(WORLD_BOOK_STORE);
      const request = store.put(worldBook);

      request.onerror = () => reject(new Error('Failed to update world book'));
      request.onsuccess = () => resolve();
    });
  }

  // 预设相关方法
  async savePreset(preset: PresetConfig): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRESET_STORE], 'readwrite');
      const store = transaction.objectStore(PRESET_STORE);
      const request = store.put(preset);

      request.onerror = () => reject(new Error('Failed to save preset'));
      request.onsuccess = () => resolve();
    });
  }

  async getAllPresets(): Promise<PresetConfig[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRESET_STORE], 'readonly');
      const store = transaction.objectStore(PRESET_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get presets'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getPreset(id: string): Promise<PresetConfig | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRESET_STORE], 'readonly');
      const store = transaction.objectStore(PRESET_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get preset'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async deletePreset(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRESET_STORE], 'readwrite');
      const store = transaction.objectStore(PRESET_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete preset'));
      request.onsuccess = () => resolve();
    });
  }

  async getDefaultPreset(): Promise<PresetConfig | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PRESET_STORE], 'readonly');
      const store = transaction.objectStore(PRESET_STORE);
      const index = store.index('isDefault');
      const request = index.get(1);

      request.onerror = () => reject(new Error('Failed to get default preset'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 聊天状态相关方法
  async saveChatStatus(chatId: string, status: {
    isOnline: boolean;
    mood: string;
    location: string;
    outfit: string;
    lastUpdate: number;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STATUS_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_STATUS_STORE);
      const request = store.put({
        chatId,
        ...status
      });

      request.onerror = () => reject(new Error('Failed to save chat status'));
      request.onsuccess = () => resolve();
    });
  }

  async getChatStatus(chatId: string): Promise<{
    isOnline: boolean;
    mood: string;
    location: string;
    outfit: string;
    lastUpdate: number;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STATUS_STORE], 'readonly');
      const store = transaction.objectStore(CHAT_STATUS_STORE);
      const request = store.get(chatId);

      request.onerror = () => reject(new Error('Failed to get chat status'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { chatId: _, ...status } = result;
          resolve(status);
        } else {
          resolve(null);
        }
      };
    });
  }

  async deleteChatStatus(chatId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STATUS_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_STATUS_STORE);
      const request = store.delete(chatId);

      request.onerror = () => reject(new Error('Failed to delete chat status'));
      request.onsuccess = () => resolve();
    });
  }

  // 聊天背景相关方法
  async saveChatBackground(chatId: string, background: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_BACKGROUND_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_BACKGROUND_STORE);
      const request = store.put({
        chatId,
        background,
        timestamp: Date.now()
      });

      request.onerror = () => reject(new Error('Failed to save chat background'));
      request.onsuccess = () => resolve();
    });
  }

  async getChatBackground(chatId: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_BACKGROUND_STORE], 'readonly');
      const store = transaction.objectStore(CHAT_BACKGROUND_STORE);
      const request = store.get(chatId);

      request.onerror = () => reject(new Error('Failed to get chat background'));
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.background : null);
      };
    });
  }

  async deleteChatBackground(chatId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_BACKGROUND_STORE], 'readwrite');
      const store = transaction.objectStore(CHAT_BACKGROUND_STORE);
      const request = store.delete(chatId);

      request.onerror = () => reject(new Error('Failed to delete chat background'));
      request.onsuccess = () => resolve();
    });
  }
}

// 创建单例实例
export const dataManager = new DataManager(); 