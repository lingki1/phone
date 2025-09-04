// 数据管理器 - 用于持久化存储聊天数据
import { ChatItem, GroupMember, ApiConfig, WorldBook } from '../types/chat';
import { TransactionRecord } from '../types/money';
import { PresetConfig } from '../types/preset';
import { DiscoverPost, DiscoverComment, DiscoverSettings, DiscoverNotification, DiscoverDraft, DiscoverStats } from '../types/discover';

const DB_NAME = 'ChatAppDB';
const DB_VERSION = 15; // 升级数据库版本以支持多面具
const CHAT_STORE = 'chats';
const API_CONFIG_STORE = 'apiConfig';
const SAVED_API_CONFIGS_STORE = 'savedApiConfigs';
const PERSONAL_SETTINGS_STORE = 'personalSettings';
const PERSONAL_SETTINGS_COLLECTION_STORE = 'personalSettingsCollection';
const THEME_SETTINGS_STORE = 'themeSettings';
const BALANCE_STORE = 'balance';
const TRANSACTION_STORE = 'transactions';
const WORLD_BOOK_STORE = 'worldBooks';
const PRESET_STORE = 'presets';
const CHAT_STATUS_STORE = 'chatStatus';
const CHAT_BACKGROUND_STORE = 'chatBackgrounds';
const EXTRA_INFO_STORE = 'extraInfo';
const DISCOVER_POSTS_STORE = 'discoverPosts';
const DISCOVER_COMMENTS_STORE = 'discoverComments';
const DISCOVER_SETTINGS_STORE = 'discoverSettings';
const DISCOVER_NOTIFICATIONS_STORE = 'discoverNotifications';
const DISCOVER_DRAFTS_STORE = 'discoverDrafts';
const DISCOVER_VIEW_STATE_STORE = 'discoverViewState';
const GLOBAL_DATA_STORE = 'globalData';
const STORY_MODE_MESSAGES_STORE = 'storyModeMessages';

class DataManager {
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async initDB(): Promise<void> {
    if (this.db) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.name || 'UnknownError'}`));
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
        if (!db.objectStoreNames.contains(SAVED_API_CONFIGS_STORE)) {
          db.createObjectStore(SAVED_API_CONFIGS_STORE, { keyPath: 'id' });
        }

        // 创建个人信息存储
        if (!db.objectStoreNames.contains(PERSONAL_SETTINGS_STORE)) {
          db.createObjectStore(PERSONAL_SETTINGS_STORE, { keyPath: 'id' });
        }

        // 创建个人信息集合存储（支持多套人设）
        if (!db.objectStoreNames.contains(PERSONAL_SETTINGS_COLLECTION_STORE)) {
          const coll = db.createObjectStore(PERSONAL_SETTINGS_COLLECTION_STORE, { keyPath: 'id' });
          coll.createIndex('createdAt', 'createdAt', { unique: false });
          coll.createIndex('isActive', 'isActive', { unique: false });
          coll.createIndex('userNickname', 'userNickname', { unique: false });
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

        // 创建额外信息存储
        if (!db.objectStoreNames.contains(EXTRA_INFO_STORE)) {
          db.createObjectStore(EXTRA_INFO_STORE, { keyPath: 'chatId' });
        }

        // 创建动态存储
        if (!db.objectStoreNames.contains(DISCOVER_POSTS_STORE)) {
          const postsStore = db.createObjectStore(DISCOVER_POSTS_STORE, { keyPath: 'id' });
          postsStore.createIndex('authorId', 'authorId', { unique: false });
          postsStore.createIndex('timestamp', 'timestamp', { unique: false });
          postsStore.createIndex('type', 'type', { unique: false });
          postsStore.createIndex('aiGenerated', 'aiGenerated', { unique: false });
        }

        // 创建评论存储
        if (!db.objectStoreNames.contains(DISCOVER_COMMENTS_STORE)) {
          const commentsStore = db.createObjectStore(DISCOVER_COMMENTS_STORE, { keyPath: 'id' });
          commentsStore.createIndex('postId', 'postId', { unique: false });
          commentsStore.createIndex('authorId', 'authorId', { unique: false });
          commentsStore.createIndex('timestamp', 'timestamp', { unique: false });
          commentsStore.createIndex('parentCommentId', 'parentCommentId', { unique: false });
        }

        // 创建动态设置存储
        if (!db.objectStoreNames.contains(DISCOVER_SETTINGS_STORE)) {
          db.createObjectStore(DISCOVER_SETTINGS_STORE, { keyPath: 'id' });
        }

        // 创建动态通知存储
        if (!db.objectStoreNames.contains(DISCOVER_NOTIFICATIONS_STORE)) {
          const notificationsStore = db.createObjectStore(DISCOVER_NOTIFICATIONS_STORE, { keyPath: 'id' });
          notificationsStore.createIndex('authorId', 'authorId', { unique: false });
          notificationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          notificationsStore.createIndex('isRead', 'isRead', { unique: false });
        }

        // 创建动态草稿存储
        if (!db.objectStoreNames.contains(DISCOVER_DRAFTS_STORE)) {
          const draftsStore = db.createObjectStore(DISCOVER_DRAFTS_STORE, { keyPath: 'id' });
          draftsStore.createIndex('lastSaved', 'lastSaved', { unique: false });
        }

        // 创建动态查看状态存储
        if (!db.objectStoreNames.contains(DISCOVER_VIEW_STATE_STORE)) {
          const viewStateStore = db.createObjectStore(DISCOVER_VIEW_STATE_STORE, { keyPath: 'userId' });
          viewStateStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // 创建全局数据存储（用于头像映射表等）
        if (!db.objectStoreNames.contains(GLOBAL_DATA_STORE)) {
          db.createObjectStore(GLOBAL_DATA_STORE, { keyPath: 'key' });
        }

        // 创建剧情模式消息存储
        if (!db.objectStoreNames.contains(STORY_MODE_MESSAGES_STORE)) {
          const storyModeMessagesStore = db.createObjectStore(STORY_MODE_MESSAGES_STORE, { keyPath: 'chatId' });
          storyModeMessagesStore.createIndex('timestamp', 'timestamp', { unique: false });
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

  // 多组API配置管理方法
  async saveApiConfigToCollection(config: {
    name: string;
    proxyUrl: string;
    apiKey: string;
    model: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SAVED_API_CONFIGS_STORE], 'readwrite');
      const store = transaction.objectStore(SAVED_API_CONFIGS_STORE);
      const configWithId = {
        ...config,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        createdAt: Date.now()
      };
      const request = store.put(configWithId);

      request.onerror = () => reject(new Error('Failed to save API config to collection'));
      request.onsuccess = () => resolve();
    });
  }

  async getAllSavedApiConfigs(): Promise<Array<{
    id: string;
    name: string;
    proxyUrl: string;
    apiKey: string;
    model: string;
    createdAt: number;
  }>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SAVED_API_CONFIGS_STORE], 'readonly');
      const store = transaction.objectStore(SAVED_API_CONFIGS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get saved API configs'));
      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.sort((a, b) => b.createdAt - a.createdAt)); // 按创建时间倒序
      };
    });
  }

  async deleteSavedApiConfig(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SAVED_API_CONFIGS_STORE], 'readwrite');
      const store = transaction.objectStore(SAVED_API_CONFIGS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete saved API config'));
      request.onsuccess = () => resolve();
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

  // ==================== 多套人设集合方法 ====================
  async addPersonalSettingsToCollection(settings: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
    // 可选：是否设为当前
    setActive?: boolean;
  }): Promise<{ id: string }> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONAL_SETTINGS_COLLECTION_STORE, PERSONAL_SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const record = {
        id,
        ...settings,
        isActive: Boolean(settings.setActive) || false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      } as const;

      const request = store.add(record as unknown as Record<string, unknown>);
      request.onerror = () => reject(new Error('Failed to add personal settings to collection'));
      request.onsuccess = async () => {
        try {
          if (settings.setActive) {
            // 同步设置到默认个人信息
            const defaultTx = this.db!.transaction([PERSONAL_SETTINGS_STORE], 'readwrite');
            const defaultStore = defaultTx.objectStore(PERSONAL_SETTINGS_STORE);
            await new Promise<void>((res, rej) => {
              const putReq = defaultStore.put({ id: 'default', userAvatar: settings.userAvatar, userNickname: settings.userNickname, userBio: settings.userBio });
              putReq.onerror = () => rej(new Error('Failed to set active personal settings'));
              putReq.onsuccess = () => res();
            });
            // 将其他记录 isActive 置为 false
            await this.setActivePersonalSettings(id);
          }
          resolve({ id });
        } catch (e) {
          reject(e as Error);
        }
      };
    });
  }

  async getAllPersonalSettingsFromCollection(): Promise<Array<{
    id: string;
    userAvatar: string;
    userNickname: string;
    userBio: string;
    isActive?: boolean;
    createdAt?: number;
    updatedAt?: number;
  }>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONAL_SETTINGS_COLLECTION_STORE], 'readonly');
      const store = transaction.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to get personal settings collection'));
      request.onsuccess = () => {
        type DBPersonalSettings = {
          id: string;
          userAvatar?: string;
          userNickname?: string;
          userBio?: string;
          isActive?: boolean;
          createdAt?: number;
          updatedAt?: number;
        };
        const results = (request.result || []) as DBPersonalSettings[];
        const mapped = results.map(r => ({
          id: String(r.id),
          userAvatar: String(r.userAvatar || ''),
          userNickname: String(r.userNickname || ''),
          userBio: String(r.userBio || ''),
          isActive: Boolean(r.isActive),
          createdAt: Number(r.createdAt || 0),
          updatedAt: Number(r.updatedAt || 0)
        }));
        // 按创建时间倒序
        resolve(mapped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      };
    });
  }

  async updatePersonalSettingsInCollection(id: string, updates: {
    userAvatar?: string;
    userNickname?: string;
    userBio?: string;
    setActive?: boolean;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PERSONAL_SETTINGS_COLLECTION_STORE, PERSONAL_SETTINGS_STORE], 'readwrite');
      const store = tx.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);

      const getReq = store.get(id);
      getReq.onerror = () => reject(new Error('Failed to get personal settings item'));
      getReq.onsuccess = async () => {
        const item = getReq.result;
        if (!item) {
          reject(new Error('Personal settings item not found'));
          return;
        }
        type DBPersonalSettings = {
          id: string;
          userAvatar?: string;
          userNickname?: string;
          userBio?: string;
          isActive?: boolean;
          createdAt?: number;
          updatedAt?: number;
        };
        const updated: DBPersonalSettings = {
          ...item,
          ...('userAvatar' in updates ? { userAvatar: updates.userAvatar } : {}),
          ...('userNickname' in updates ? { userNickname: updates.userNickname } : {}),
          ...('userBio' in updates ? { userBio: updates.userBio } : {}),
          ...('setActive' in updates ? { isActive: Boolean(updates.setActive) } : {}),
          updatedAt: Date.now()
        };

        const putReq = store.put(updated);
        putReq.onerror = () => reject(new Error('Failed to update personal settings item'));
        putReq.onsuccess = async () => {
          try {
            if (updates.setActive) {
              // 同步默认人设
              const defaultTx = this.db!.transaction([PERSONAL_SETTINGS_STORE], 'readwrite');
              const defaultStore = defaultTx.objectStore(PERSONAL_SETTINGS_STORE);
              await new Promise<void>((res, rej) => {
                const put = defaultStore.put({ id: 'default', userAvatar: updated.userAvatar || '', userNickname: updated.userNickname || '', userBio: updated.userBio || '' });
                put.onerror = () => rej(new Error('Failed to update default personal settings'));
                put.onsuccess = () => res();
              });
              await this.setActivePersonalSettings(id);
            }
            resolve();
          } catch (e) {
            reject(e as Error);
          }
        };
      };
    });
  }

  async deletePersonalSettingsFromCollection(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PERSONAL_SETTINGS_COLLECTION_STORE], 'readwrite');
      const store = transaction.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete personal settings item'));
      request.onsuccess = () => resolve();
    });
  }

  async setActivePersonalSettings(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([PERSONAL_SETTINGS_COLLECTION_STORE], 'readwrite');
      const store = tx.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);
      const getAllReq = store.getAll();

      getAllReq.onerror = () => reject(new Error('Failed to enumerate personal settings'));
      getAllReq.onsuccess = () => {
        type DBPersonalSettings = {
          id: string;
          userAvatar?: string;
          userNickname?: string;
          userBio?: string;
          isActive?: boolean;
          createdAt?: number;
          updatedAt?: number;
        };
        const items = (getAllReq.result || []) as DBPersonalSettings[];
        const updates = items.map((it) => ({ ...it, isActive: it.id === id }));

        let pending = updates.length;
        if (pending === 0) { resolve(); return; }
        updates.forEach(u => {
          const put = store.put({ ...u, updatedAt: Date.now() });
          put.onerror = () => reject(new Error('Failed to mark active personal settings'));
          put.onsuccess = () => { pending--; if (pending === 0) resolve(); };
        });
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
      lastReadTimestamp: Date.now(),
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
      const personalSettingsCollection = await this.getAllPersonalSettingsFromCollection();
      const themeSettings = await this.getThemeSettings();
      const balance = await this.getBalance();
      const transactions = await this.getTransactionHistory();
      const worldBooks = await this.getAllWorldBooks();
      const presets = await this.getAllPresets();
      
      // 收集聊天状态数据
      const chatStatuses: unknown[] = [];
      const chatBackgrounds: unknown[] = [];
      const storyModeMessages: unknown[] = [];
      
      // 为每个聊天收集状态、背景和剧情模式消息数据
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

          const storyMessages = await this.getStoryModeMessages(chat.id);
          if (storyMessages && storyMessages.length > 0) {
            storyModeMessages.push({ chatId: chat.id, messages: storyMessages });
          }
        } catch (error) {
          console.warn(`Failed to get status/background/story messages for chat ${chat.id}:`, error);
        }
      }
      
      // 收集动态数据
      const discoverPosts = await this.getAllDiscoverPosts();
      const discoverSettings = await this.getDiscoverSettings();
      const discoverDrafts = await this.getAllDiscoverDrafts();
      
      // 收集所有动态的通知
      const discoverNotifications: DiscoverNotification[] = [];
      for (const post of discoverPosts) {
        try {
          const notifications = await this.getDiscoverNotifications(post.authorId);
          discoverNotifications.push(...notifications);
        } catch (error) {
          console.warn(`Failed to get notifications for post ${post.id}:`, error);
        }
      }
      
      const exportData = {
        chats,
        apiConfig,
        personalSettings,
        personalSettingsCollection,
        themeSettings,
        balance,
        transactions,
        worldBooks,
        presets,
        chatStatuses,
        chatBackgrounds,
        storyModeMessages,
        discoverPosts,
        discoverComments: [], // 评论数据在posts中已包含
        discoverSettings,
        discoverNotifications,
        discoverDrafts,
        exportTime: new Date().toISOString(),
        version: '1.6'
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

      // 导入多套人设集合
      if (data.personalSettingsCollection && Array.isArray(data.personalSettingsCollection)) {
        await this.importPersonalSettingsCollection(data.personalSettingsCollection);
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

      // 导入剧情模式消息
      if (data.storyModeMessages && Array.isArray(data.storyModeMessages)) {
        for (const storyData of data.storyModeMessages) {
          await this.saveStoryModeMessages(storyData.chatId, storyData.messages);
        }
      }

      // 导入动态数据
      if (data.discoverPosts && Array.isArray(data.discoverPosts)) {
        for (const post of data.discoverPosts) {
          await this.saveDiscoverPost(post);
        }
      }

      // 导入动态设置
      if (data.discoverSettings) {
        await this.saveDiscoverSettings(data.discoverSettings);
      }

      // 导入动态通知
      if (data.discoverNotifications && Array.isArray(data.discoverNotifications)) {
        for (const notification of data.discoverNotifications) {
          await this.saveDiscoverNotification(notification);
        }
      }

      // 导入动态草稿
      if (data.discoverDrafts && Array.isArray(data.discoverDrafts)) {
        for (const draft of data.discoverDrafts) {
          await this.saveDiscoverDraft(draft);
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

  // 批量导入多人设集合（供外部/备份调用）
  async importPersonalSettingsCollection(items: Array<{
    id: string;
    userAvatar: string;
    userNickname: string;
    userBio: string;
    isActive?: boolean;
    createdAt?: number;
    updatedAt?: number;
  }>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction([PERSONAL_SETTINGS_COLLECTION_STORE], 'readwrite');
    const store = tx.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);
    await Promise.all(items.map(item => new Promise<void>((resolve, reject) => {
      const req = store.put({
        id: item.id,
        userAvatar: item.userAvatar,
        userNickname: item.userNickname,
        userBio: item.userBio,
        isActive: Boolean(item.isActive),
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      });
      req.onerror = () => reject(new Error('Failed to import personal settings item'));
      req.onsuccess = () => resolve();
    })));
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([
        CHAT_STORE, API_CONFIG_STORE, SAVED_API_CONFIGS_STORE, PERSONAL_SETTINGS_STORE, PERSONAL_SETTINGS_COLLECTION_STORE, THEME_SETTINGS_STORE, 
        BALANCE_STORE, TRANSACTION_STORE, WORLD_BOOK_STORE, PRESET_STORE, 
        CHAT_STATUS_STORE, CHAT_BACKGROUND_STORE, EXTRA_INFO_STORE, STORY_MODE_MESSAGES_STORE, DISCOVER_POSTS_STORE, 
        DISCOVER_COMMENTS_STORE, DISCOVER_SETTINGS_STORE, DISCOVER_NOTIFICATIONS_STORE, 
        DISCOVER_DRAFTS_STORE, DISCOVER_VIEW_STATE_STORE, GLOBAL_DATA_STORE
      ], 'readwrite');
      
      const chatStore = transaction.objectStore(CHAT_STORE);
      const apiStore = transaction.objectStore(API_CONFIG_STORE);
      const savedApiConfigsStore = transaction.objectStore(SAVED_API_CONFIGS_STORE);
      const personalStore = transaction.objectStore(PERSONAL_SETTINGS_STORE);
      const personalCollectionStore = transaction.objectStore(PERSONAL_SETTINGS_COLLECTION_STORE);
      const themeStore = transaction.objectStore(THEME_SETTINGS_STORE);
      const balanceStore = transaction.objectStore(BALANCE_STORE);
      const transactionStore = transaction.objectStore(TRANSACTION_STORE);
      const worldBookStore = transaction.objectStore(WORLD_BOOK_STORE);
      const presetStore = transaction.objectStore(PRESET_STORE);
      const chatStatusStore = transaction.objectStore(CHAT_STATUS_STORE);
      const chatBackgroundStore = transaction.objectStore(CHAT_BACKGROUND_STORE);
      const extraInfoStore = transaction.objectStore(EXTRA_INFO_STORE);
      const discoverPostsStore = transaction.objectStore(DISCOVER_POSTS_STORE);
      const discoverCommentsStore = transaction.objectStore(DISCOVER_COMMENTS_STORE);
      const discoverSettingsStore = transaction.objectStore(DISCOVER_SETTINGS_STORE);
      const discoverNotificationsStore = transaction.objectStore(DISCOVER_NOTIFICATIONS_STORE);
      const discoverDraftsStore = transaction.objectStore(DISCOVER_DRAFTS_STORE);
      const discoverViewStateStore = transaction.objectStore(DISCOVER_VIEW_STATE_STORE);
      const globalDataStore = transaction.objectStore(GLOBAL_DATA_STORE);
      const storyModeMessagesStore = transaction.objectStore(STORY_MODE_MESSAGES_STORE);
      
      const clearChats = chatStore.clear();
      const clearApi = apiStore.clear();
      const clearSavedApiConfigs = savedApiConfigsStore.clear();
      const clearPersonal = personalStore.clear();
      const clearPersonalCollection = personalCollectionStore.clear();
      const clearTheme = themeStore.clear();
      const clearBalance = balanceStore.clear();
      const clearTransactions = transactionStore.clear();
      const clearWorldBooks = worldBookStore.clear();
      const clearPresets = presetStore.clear();
      const clearChatStatus = chatStatusStore.clear();
      const clearChatBackground = chatBackgroundStore.clear();
      const clearExtraInfo = extraInfoStore.clear();
      const clearDiscoverPosts = discoverPostsStore.clear();
      const clearDiscoverComments = discoverCommentsStore.clear();
      const clearDiscoverSettings = discoverSettingsStore.clear();
      const clearDiscoverNotifications = discoverNotificationsStore.clear();
      const clearDiscoverDrafts = discoverDraftsStore.clear();
      const clearDiscoverViewState = discoverViewStateStore.clear();
      const clearGlobalData = globalDataStore.clear();
      const clearStoryModeMessages = storyModeMessagesStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 21) resolve();
      };

      clearChats.onerror = () => reject(new Error('Failed to clear chat data'));
      clearChats.onsuccess = checkComplete;

      clearApi.onerror = () => reject(new Error('Failed to clear API config'));
      clearApi.onsuccess = checkComplete;

      clearSavedApiConfigs.onerror = () => reject(new Error('Failed to clear saved API configs'));
      clearSavedApiConfigs.onsuccess = checkComplete;

      clearPersonal.onerror = () => reject(new Error('Failed to clear personal settings'));
      clearPersonal.onsuccess = checkComplete;

      clearPersonalCollection.onerror = () => reject(new Error('Failed to clear personal settings collection'));
      clearPersonalCollection.onsuccess = checkComplete;

      clearTheme.onerror = () => reject(new Error('Failed to clear theme settings'));
      clearTheme.onsuccess = checkComplete;

      clearBalance.onerror = () => reject(new Error('Failed to clear balance data'));
      clearBalance.onsuccess = checkComplete;

      clearTransactions.onerror = () => reject(new Error('Failed to clear transaction data'));
      clearTransactions.onsuccess = checkComplete;

      clearWorldBooks.onerror = () => reject(new Error('Failed to clear world book data'));
      clearWorldBooks.onsuccess = checkComplete;

      clearPresets.onerror = () => reject(new Error('Failed to clear preset data'));
      clearPresets.onsuccess = checkComplete;

      clearChatStatus.onerror = () => reject(new Error('Failed to clear chat status data'));
      clearChatStatus.onsuccess = checkComplete;

      clearChatBackground.onerror = () => reject(new Error('Failed to clear chat background data'));
      clearChatBackground.onsuccess = checkComplete;

      clearExtraInfo.onerror = () => reject(new Error('Failed to clear extra info data'));
      clearExtraInfo.onsuccess = checkComplete;

      clearDiscoverPosts.onerror = () => reject(new Error('Failed to clear discover posts data'));
      clearDiscoverPosts.onsuccess = checkComplete;

      clearDiscoverComments.onerror = () => reject(new Error('Failed to clear discover comments data'));
      clearDiscoverComments.onsuccess = checkComplete;

      clearDiscoverSettings.onerror = () => reject(new Error('Failed to clear discover settings data'));
      clearDiscoverSettings.onsuccess = checkComplete;

      clearDiscoverNotifications.onerror = () => reject(new Error('Failed to clear discover notifications data'));
      clearDiscoverNotifications.onsuccess = checkComplete;

      clearDiscoverDrafts.onerror = () => reject(new Error('Failed to clear discover drafts data'));
      clearDiscoverDrafts.onsuccess = checkComplete;

      clearDiscoverViewState.onerror = () => reject(new Error('Failed to clear discover view state data'));
      clearDiscoverViewState.onsuccess = checkComplete;

      clearGlobalData.onerror = () => reject(new Error('Failed to clear global data'));
      clearGlobalData.onsuccess = checkComplete;

      clearStoryModeMessages.onerror = () => reject(new Error('Failed to clear story mode messages data'));
      clearStoryModeMessages.onsuccess = checkComplete;
    });
  }

  // 获取数据库统计信息
  async getStats(): Promise<{
    totalChats: number;
    groupChats: number;
    privateChats: number;
    totalMessages: number;
    totalStoryModeMessages: number;
  }> {
    const chats = await this.getAllChats();
    const groupChats = chats.filter(chat => chat.isGroup);
    const privateChats = chats.filter(chat => !chat.isGroup);
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);

    // 统计剧情模式消息总数
    let totalStoryModeMessages = 0;
    for (const chat of chats) {
      try {
        const storyMessages = await this.getStoryModeMessages(chat.id);
        totalStoryModeMessages += storyMessages.length;
      } catch (error) {
        console.warn(`Failed to get story mode messages for chat ${chat.id}:`, error);
      }
    }

    return {
      totalChats: chats.length,
      groupChats: groupChats.length,
      privateChats: privateChats.length,
      totalMessages,
      totalStoryModeMessages
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
      request.onsuccess = () => {
        const worldBooks = request.result || [];
        // 为没有分类的旧数据添加默认分类
        const migratedWorldBooks = worldBooks.map(wb => {
          if (!wb.category) {
            return {
              ...wb,
              category: '未分类'
            };
          }
          return wb;
        });
        resolve(migratedWorldBooks);
      };
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
          const { chatId: _chatId, ...status } = result;
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

  // ==================== 动态功能相关方法 ====================

  // 保存动态
  async saveDiscoverPost(post: DiscoverPost): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_POSTS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_POSTS_STORE);
      const request = store.put(post);

      request.onerror = () => reject(new Error('Failed to save discover post'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有动态
  async getAllDiscoverPosts(): Promise<DiscoverPost[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_POSTS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_POSTS_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // 按时间倒序

      const results: DiscoverPost[] = [];
      request.onerror = () => reject(new Error('Failed to get discover posts'));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  // 获取单个动态
  async getDiscoverPost(id: string): Promise<DiscoverPost | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_POSTS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_POSTS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get discover post'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 删除动态
  async deleteDiscoverPost(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_POSTS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_POSTS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete discover post'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取用户的动态
  async getDiscoverPostsByAuthor(authorId: string): Promise<DiscoverPost[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_POSTS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_POSTS_STORE);
      const index = store.index('authorId');
      const request = index.getAll(IDBKeyRange.only(authorId));

      request.onerror = () => reject(new Error('Failed to get discover posts by author'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // 保存评论
  async saveDiscoverComment(comment: DiscoverComment): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_COMMENTS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_COMMENTS_STORE);
      const request = store.put(comment);

      request.onerror = () => reject(new Error('Failed to save discover comment'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取动态的评论
  async getDiscoverCommentsByPost(postId: string): Promise<DiscoverComment[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_COMMENTS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_COMMENTS_STORE);
      const index = store.index('postId');
      const request = index.getAll(IDBKeyRange.only(postId));

      request.onerror = () => reject(new Error('Failed to get discover comments by post'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // 删除评论
  async deleteDiscoverComment(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_COMMENTS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_COMMENTS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete discover comment'));
      request.onsuccess = () => resolve();
    });
  }

  // 保存动态设置
  async saveDiscoverSettings(settings: DiscoverSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_SETTINGS_STORE);
      const request = store.put({ ...settings, id: 'default' });

      request.onerror = () => reject(new Error('Failed to save discover settings'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取动态设置
  async getDiscoverSettings(): Promise<DiscoverSettings> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_SETTINGS_STORE);
      const request = store.get('default');

      request.onerror = () => reject(new Error('Failed to get discover settings'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result);
        } else {
          // 返回默认设置
          resolve({
            autoGeneratePosts: true,
            autoGenerateInterval: 5, // 改为5分钟，与UI最小值保持一致
            maxPostsPerDay: 10,
            allowAiComments: true,
            allowAiLikes: true,
            privacyLevel: 'public',
            notifyOnNewPosts: true,
            theme: 'default'
          });
        }
      };
    });
  }

  // 保存通知
  async saveDiscoverNotification(notification: DiscoverNotification): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_NOTIFICATIONS_STORE);
      const request = store.put(notification);

      request.onerror = () => reject(new Error('Failed to save discover notification'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取用户的通知
  async getDiscoverNotifications(authorId: string): Promise<DiscoverNotification[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_NOTIFICATIONS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_NOTIFICATIONS_STORE);
      const index = store.index('authorId');
      const request = index.getAll(IDBKeyRange.only(authorId));

      request.onerror = () => reject(new Error('Failed to get discover notifications'));
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  // 标记通知为已读
  async markDiscoverNotificationAsRead(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_NOTIFICATIONS_STORE);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(new Error('Failed to get discover notification'));
      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.isRead = true;
          const putRequest = store.put(notification);
          putRequest.onerror = () => reject(new Error('Failed to update discover notification'));
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  // 保存草稿
  async saveDiscoverDraft(draft: DiscoverDraft): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_DRAFTS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_DRAFTS_STORE);
      const request = store.put(draft);

      request.onerror = () => reject(new Error('Failed to save discover draft'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取草稿
  async getDiscoverDraft(id: string): Promise<DiscoverDraft | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_DRAFTS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_DRAFTS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to get discover draft'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 删除草稿
  async deleteDiscoverDraft(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_DRAFTS_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_DRAFTS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete discover draft'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有草稿
  async getAllDiscoverDrafts(): Promise<DiscoverDraft[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_DRAFTS_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_DRAFTS_STORE);
      const index = store.index('lastSaved');
      const request = index.openCursor(null, 'prev'); // 按时间倒序

      const results: DiscoverDraft[] = [];
      request.onerror = () => reject(new Error('Failed to get discover drafts'));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  // 获取动态统计信息
  async getDiscoverStats(): Promise<DiscoverStats> {
    const posts = await this.getAllDiscoverPosts();
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    const activeUsers = new Set(posts.map(post => post.authorId)).size;

    // 计算热门动态（按点赞数排序）
    const popularPosts = posts
      .sort((a, b) => b.likes.length - a.likes.length)
      .slice(0, 5)
      .map(post => post.id);

    // 提取热门话题（从标签中）
    const allTags = posts.flatMap(post => post.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const trendingTopics = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      activeUsers,
      popularPosts,
      trendingTopics
    };
  }

  // 保存用户查看状态
  async saveDiscoverViewState(userId: string, viewState: {
    lastViewedTimestamp: number;
    lastViewedPostId?: string;
    newPostsCount: number;
    newCommentsCount: number;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_VIEW_STATE_STORE], 'readwrite');
      const store = transaction.objectStore(DISCOVER_VIEW_STATE_STORE);
      const request = store.put({
        userId,
        ...viewState,
        lastUpdated: Date.now()
      });

      request.onerror = () => reject(new Error('Failed to save view state'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取用户查看状态
  async getDiscoverViewState(userId: string): Promise<{
    lastViewedTimestamp: number;
    lastViewedPostId?: string;
    newPostsCount: number;
    newCommentsCount: number;
    lastUpdated: number;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DISCOVER_VIEW_STATE_STORE], 'readonly');
      const store = transaction.objectStore(DISCOVER_VIEW_STATE_STORE);
      const request = store.get(userId);

      request.onerror = () => reject(new Error('Failed to get view state'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 更新用户查看状态（标记为已查看）
  async updateDiscoverViewState(userId: string, lastViewedTimestamp: number, lastViewedPostId?: string): Promise<void> {
    try {
      const currentState = await this.getDiscoverViewState(userId);
      const newState = {
        lastViewedTimestamp: Math.max(currentState?.lastViewedTimestamp || 0, lastViewedTimestamp),
        lastViewedPostId: lastViewedPostId || currentState?.lastViewedPostId,
        newPostsCount: 0, // 重置新动态计数
        newCommentsCount: 0, // 重置新评论计数
        lastUpdated: Date.now()
      };

      await this.saveDiscoverViewState(userId, newState);
    } catch (error) {
      console.warn('Failed to update discover view state:', error);
      // 静默失败，不影响主要功能
    }
  }

  // 更新评论查看状态（专门处理评论）
  async updateCommentsViewState(userId: string, lastViewedCommentTimestamp: number): Promise<void> {
    try {
      const currentState = await this.getDiscoverViewState(userId);
      const newState = {
        lastViewedTimestamp: Math.max(currentState?.lastViewedTimestamp || 0, lastViewedCommentTimestamp),
        lastViewedPostId: currentState?.lastViewedPostId,
        newPostsCount: currentState?.newPostsCount || 0,
        newCommentsCount: 0, // 重置新评论计数
        lastUpdated: Date.now()
      };

      await this.saveDiscoverViewState(userId, newState);
    } catch (error) {
      console.warn('Failed to update comments view state:', error);
      // 静默失败，不影响主要功能
    }
  }

  // 计算新内容数量
  async calculateNewContentCount(userId: string): Promise<{ newPostsCount: number; newCommentsCount: number }> {
    try {
      const viewState = await this.getDiscoverViewState(userId);
      const lastViewedTimestamp = viewState?.lastViewedTimestamp || 0;

      const allPosts = await this.getAllDiscoverPosts();
      const allComments = await Promise.all(
        allPosts.map(post => this.getDiscoverCommentsByPost(post.id))
      );

      // 计算新动态数量
      const newPostsCount = allPosts.filter(post => 
        post.timestamp > lastViewedTimestamp && post.authorId !== userId
      ).length;

      // 计算新评论数量
      const newCommentsCount = allComments.flat().filter(comment => 
        comment.timestamp > lastViewedTimestamp && comment.authorId !== userId
      ).length;

      return { newPostsCount, newCommentsCount };
    } catch (error) {
      console.warn('Failed to calculate new content count, returning 0:', error);
      return { newPostsCount: 0, newCommentsCount: 0 };
    }
  }

  // 获取聊天消息总数
  async getChatMessageCount(chatId: string): Promise<number> {
    try {
      await this.initDB();
      const chat = await this.getChat(chatId);
      return chat ? chat.messages.length : 0;
    } catch (error) {
      console.error('Failed to get chat message count:', error);
      return 0;
    }
  }

  // 获取指定时间戳之前的消息（用于分页加载）
  async getChatMessagesBefore(chatId: string, timestamp: number, limit: number = 20): Promise<import('../types/chat').Message[]> {
    try {
      await this.initDB();
      const chat = await this.getChat(chatId);
      
      if (!chat || !chat.messages || chat.messages.length === 0) {
        return [];
      }

      console.log('getChatMessagesBefore called:', {
        chatId,
        timestamp,
        limit,
        totalMessages: chat.messages.length,
        messageTimestamps: chat.messages.map(msg => msg.timestamp).slice(0, 5) // 显示前5个时间戳
      });

      // 过滤出时间戳小于指定时间的消息，按时间戳降序排列
      const olderMessages = chat.messages
        .filter(msg => msg.timestamp < timestamp)
        .sort((a, b) => b.timestamp - a.timestamp) // 降序排列，最新的在前面
        .slice(0, limit);

      console.log('getChatMessagesBefore result:', {
        filteredCount: olderMessages.length,
        oldestTimestamp: olderMessages.length > 0 ? Math.min(...olderMessages.map(msg => msg.timestamp)) : null,
        newestTimestamp: olderMessages.length > 0 ? Math.max(...olderMessages.map(msg => msg.timestamp)) : null
      });

      // 返回时按时间戳升序排列，保持正确的显示顺序
      return olderMessages.reverse();
    } catch (error) {
      console.error('Failed to get chat messages before timestamp:', error);
      return [];
    }
  }

  // 获取指定时间戳之后的消息（用于加载新消息）
  async getChatMessagesAfter(chatId: string, timestamp: number, limit: number = 20): Promise<import('../types/chat').Message[]> {
    try {
      await this.initDB();
      const chat = await this.getChat(chatId);
      
      if (!chat || !chat.messages || chat.messages.length === 0) {
        return [];
      }

      // 过滤出时间戳大于指定时间的消息，按时间戳升序排列
      const newerMessages = chat.messages
        .filter(msg => msg.timestamp > timestamp)
        .sort((a, b) => a.timestamp - b.timestamp) // 升序排列
        .slice(0, limit);

      return newerMessages;
    } catch (error) {
      console.error('Failed to get chat messages after timestamp:', error);
      return [];
    }
  }

  // 全局数据存储方法
  async saveGlobalData(key: string, data: unknown): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([GLOBAL_DATA_STORE], 'readwrite');
      const store = transaction.objectStore(GLOBAL_DATA_STORE);
      const request = store.put({ key, data });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取全局数据
  async getGlobalData(key: string): Promise<unknown> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([GLOBAL_DATA_STORE], 'readonly');
      const store = transaction.objectStore(GLOBAL_DATA_STORE);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data || null);
    });
  }

  // ==================== 剧情模式消息相关方法 ====================

  // 保存剧情模式消息
  async saveStoryModeMessages(chatId: string, messages: import('../types/chat').Message[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORY_MODE_MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(STORY_MODE_MESSAGES_STORE);
      const request = store.put({
        chatId,
        messages,
        timestamp: Date.now()
      });

      request.onerror = () => reject(new Error('Failed to save story mode messages'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取剧情模式消息
  async getStoryModeMessages(chatId: string): Promise<import('../types/chat').Message[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORY_MODE_MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(STORY_MODE_MESSAGES_STORE);
      const request = store.get(chatId);

      request.onerror = () => reject(new Error('Failed to get story mode messages'));
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.messages : []);
      };
    });
  }

  // 删除剧情模式消息
  async deleteStoryModeMessages(chatId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORY_MODE_MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(STORY_MODE_MESSAGES_STORE);
      const request = store.delete(chatId);

      request.onerror = () => reject(new Error('Failed to delete story mode messages'));
      request.onsuccess = () => resolve();
    });
  }

  // 添加单条剧情模式消息
  async addStoryModeMessage(chatId: string, message: import('../types/chat').Message): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORY_MODE_MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(STORY_MODE_MESSAGES_STORE);
      
      // 先获取现有消息
      const getRequest = store.get(chatId);
      
      getRequest.onerror = () => reject(new Error('Failed to get existing story mode messages'));
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        const existingMessages = result ? result.messages : [];
        const updatedMessages = [...existingMessages, message];
        
        // 保存更新后的消息列表
        const putRequest = store.put({
          chatId,
          messages: updatedMessages,
          timestamp: Date.now()
        });
        
        putRequest.onerror = () => reject(new Error('Failed to save updated story mode messages'));
        putRequest.onsuccess = () => resolve();
      };
    });
  }

  // ==================== 记忆互通相关方法 ====================

  // 获取聊天记忆（包括普通消息和剧情模式消息）
  async getChatMemory(chatId: string, includeStoryMode: boolean = true): Promise<import('../types/chat').Message[]> {
    try {
      // 获取普通聊天消息
      const chat = await this.getChat(chatId);
      const normalMessages = chat ? chat.messages : [];
      
      if (!includeStoryMode) {
        return normalMessages;
      }
      
      // 获取剧情模式消息
      const storyModeMessages = await this.getStoryModeMessages(chatId);
      
      // 合并消息并按时间排序
      const allMessages = [...normalMessages, ...storyModeMessages];
      return allMessages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get chat memory:', error);
      return [];
    }
  }

  // 获取聊天记忆摘要（用于AI上下文）
  async getChatMemorySummary(chatId: string, maxMessages: number = 20): Promise<{
    recentMessages: import('../types/chat').Message[];
    totalMessages: number;
    lastInteractionTime: number;
    memoryType: 'normal' | 'story' | 'mixed';
  }> {
    try {
      const allMessages = await this.getChatMemory(chatId, true);
      
      if (allMessages.length === 0) {
        return {
          recentMessages: [],
          totalMessages: 0,
          lastInteractionTime: 0,
          memoryType: 'normal'
        };
      }
      
      // 获取最近的消息
      const recentMessages = allMessages
        .slice(-maxMessages)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant');
      
      // 确定记忆类型
      const normalMessages = allMessages.filter(msg => !msg.id.includes('_story_'));
      const storyMessages = allMessages.filter(msg => msg.id.includes('_story_'));
      
      let memoryType: 'normal' | 'story' | 'mixed' = 'normal';
      if (storyMessages.length > 0 && normalMessages.length > 0) {
        memoryType = 'mixed';
      } else if (storyMessages.length > 0) {
        memoryType = 'story';
      }
      
      return {
        recentMessages,
        totalMessages: allMessages.length,
        lastInteractionTime: Math.max(...allMessages.map(msg => msg.timestamp)),
        memoryType
      };
    } catch (error) {
      console.error('Failed to get chat memory summary:', error);
      return {
        recentMessages: [],
        totalMessages: 0,
        lastInteractionTime: 0,
        memoryType: 'normal'
      };
    }
  }

  // 获取跨模式记忆（用于模式切换时的上下文传递）
  async getCrossModeMemory(chatId: string, targetMode: 'normal' | 'story'): Promise<{
    contextMessages: import('../types/chat').Message[];
    modeTransition: string;
    lastMode: 'normal' | 'story' | 'unknown';
  }> {
    try {
      const allMessages = await this.getChatMemory(chatId, true);
      
      if (allMessages.length === 0) {
        return {
          contextMessages: [],
          modeTransition: '首次对话',
          lastMode: 'unknown'
        };
      }
      
      // 分析消息模式
      const normalMessages = allMessages.filter(msg => !msg.id.includes('_story_'));
      const storyMessages = allMessages.filter(msg => msg.id.includes('_story_'));
      
      // 确定最后使用的模式
      let lastMode: 'normal' | 'story' | 'unknown' = 'unknown';
      if (normalMessages.length > 0 && storyMessages.length > 0) {
        const lastNormalTime = Math.max(...normalMessages.map(msg => msg.timestamp));
        const lastStoryTime = Math.max(...storyMessages.map(msg => msg.timestamp));
        lastMode = lastNormalTime > lastStoryTime ? 'normal' : 'story';
      } else if (normalMessages.length > 0) {
        lastMode = 'normal';
      } else if (storyMessages.length > 0) {
        lastMode = 'story';
      }
      
      // 生成模式转换描述
      let modeTransition = '';
      if (lastMode === 'unknown') {
        modeTransition = '首次对话';
      } else if (lastMode === targetMode) {
        modeTransition = '继续当前模式';
      } else if (lastMode === 'normal' && targetMode === 'story') {
        modeTransition = '从线上聊天切换到线下剧情';
      } else if (lastMode === 'story' && targetMode === 'normal') {
        modeTransition = '从线下剧情切换到线上聊天';
      }
      
      // 获取最近的上下文消息（最近10条）
      const contextMessages = allMessages
        .slice(-10)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant');
      
      return {
        contextMessages,
        modeTransition,
        lastMode
      };
    } catch (error) {
      console.error('Failed to get cross mode memory:', error);
      return {
        contextMessages: [],
        modeTransition: '获取记忆失败',
        lastMode: 'unknown'
      };
    }
  }

  // ==================== 额外信息相关方法 ====================

  // 保存额外信息配置
  async saveExtraInfoConfig(chatId: string, config: {
    enabled: boolean;
    description: string;
    lastUpdate: number;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EXTRA_INFO_STORE], 'readwrite');
      const store = transaction.objectStore(EXTRA_INFO_STORE);
      const request = store.put({
        chatId,
        ...config
      });

      request.onerror = () => reject(new Error('Failed to save extra info config'));
      request.onsuccess = () => resolve();
    });
  }

  // 获取额外信息配置
  async getExtraInfoConfig(chatId: string): Promise<{
    enabled: boolean;
    description: string;
    lastUpdate: number;
  } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EXTRA_INFO_STORE], 'readonly');
      const store = transaction.objectStore(EXTRA_INFO_STORE);
      const request = store.get(chatId);

      request.onerror = () => reject(new Error('Failed to get extra info config'));
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const { chatId: _chatId, ...config } = result;
          resolve(config);
        } else {
          resolve(null);
        }
      };
    });
  }

  // 删除额外信息配置
  async deleteExtraInfoConfig(chatId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([EXTRA_INFO_STORE], 'readwrite');
      const store = transaction.objectStore(EXTRA_INFO_STORE);
      const request = store.delete(chatId);

      request.onerror = () => reject(new Error('Failed to delete extra info config'));
      request.onsuccess = () => resolve();
    });
  }

  // 保存模式切换记录
  async saveModeTransition(chatId: string, fromMode: 'normal' | 'story', toMode: 'normal' | 'story'): Promise<void> {
    try {
      const transitionRecord = {
        chatId,
        fromMode,
        toMode,
        timestamp: Date.now(),
        transitionType: `${fromMode}_to_${toMode}`
      };
      
      // 保存到全局数据存储
      await this.saveGlobalData(`mode_transition_${chatId}_${Date.now()}`, transitionRecord);
    } catch (error) {
      console.error('Failed to save mode transition:', error);
    }
  }

  // 获取聊天记忆统计信息
  async getChatMemoryStats(chatId: string): Promise<{
    normalMessageCount: number;
    storyMessageCount: number;
    totalInteractions: number;
    lastNormalInteraction: number;
    lastStoryInteraction: number;
    memoryBalance: 'normal' | 'story' | 'balanced';
  }> {
    try {
      const allMessages = await this.getChatMemory(chatId, true);
      
      const normalMessages = allMessages.filter(msg => !msg.id.includes('_story_'));
      const storyMessages = allMessages.filter(msg => msg.id.includes('_story_'));
      
      const lastNormalInteraction = normalMessages.length > 0 
        ? Math.max(...normalMessages.map(msg => msg.timestamp))
        : 0;
      
      const lastStoryInteraction = storyMessages.length > 0
        ? Math.max(...storyMessages.map(msg => msg.timestamp))
        : 0;
      
      // 确定记忆平衡
      let memoryBalance: 'normal' | 'story' | 'balanced' = 'balanced';
      const normalRatio = normalMessages.length / allMessages.length;
      if (normalRatio > 0.7) {
        memoryBalance = 'normal';
      } else if (normalRatio < 0.3) {
        memoryBalance = 'story';
      }
      
      return {
        normalMessageCount: normalMessages.length,
        storyMessageCount: storyMessages.length,
        totalInteractions: allMessages.length,
        lastNormalInteraction,
        lastStoryInteraction,
        memoryBalance
      };
    } catch (error) {
      console.error('Failed to get chat memory stats:', error);
      return {
        normalMessageCount: 0,
        storyMessageCount: 0,
        totalInteractions: 0,
        lastNormalInteraction: 0,
        lastStoryInteraction: 0,
        memoryBalance: 'balanced'
      };
    }
  }

}

// 创建单例实例
export const dataManager = new DataManager(); 