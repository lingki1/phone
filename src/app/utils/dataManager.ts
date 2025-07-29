// 数据管理器 - 用于持久化存储聊天数据
import { ChatItem, GroupMember, ApiConfig } from '../types/chat';

const DB_NAME = 'ChatAppDB';
const DB_VERSION = 2; // 升级数据库版本
const CHAT_STORE = 'chats';
const API_CONFIG_STORE = 'apiConfig';
const PERSONAL_SETTINGS_STORE = 'personalSettings';

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

  // 导出数据
  async exportData(): Promise<string> {
    const chats = await this.getAllChats();
    const apiConfig = await this.getApiConfig();
    const personalSettings = await this.getPersonalSettings();
    
    const exportData = {
      chats,
      apiConfig,
      personalSettings,
      exportTime: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  // 导入数据
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.chats && Array.isArray(data.chats)) {
        for (const chat of data.chats) {
          await this.saveChat(chat);
        }
      }

      if (data.apiConfig) {
        await this.saveApiConfig(data.apiConfig);
      }

      if (data.personalSettings) {
        await this.savePersonalSettings(data.personalSettings);
      }
    } catch {
      throw new Error('Invalid import data format');
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHAT_STORE, API_CONFIG_STORE, PERSONAL_SETTINGS_STORE], 'readwrite');
      
      const chatStore = transaction.objectStore(CHAT_STORE);
      const apiStore = transaction.objectStore(API_CONFIG_STORE);
      const personalStore = transaction.objectStore(PERSONAL_SETTINGS_STORE);
      
      const clearChats = chatStore.clear();
      const clearApi = apiStore.clear();
      const clearPersonal = personalStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 3) resolve();
      };

      clearChats.onerror = () => reject(new Error('Failed to clear chat data'));
      clearChats.onsuccess = checkComplete;

      clearApi.onerror = () => reject(new Error('Failed to clear API config'));
      clearApi.onsuccess = checkComplete;

      clearPersonal.onerror = () => reject(new Error('Failed to clear personal settings'));
      clearPersonal.onsuccess = checkComplete;
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
}

// 创建单例实例
export const dataManager = new DataManager(); 