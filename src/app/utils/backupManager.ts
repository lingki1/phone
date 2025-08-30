// 大数据备份管理器 - 解决localStorage 5MB限制问题
import { ChatItem, ApiConfig, WorldBook } from '../types/chat';
import { TransactionRecord } from '../types/money';
import { PresetConfig } from '../types/preset';
import { DiscoverPost, DiscoverComment, DiscoverSettings, DiscoverNotification, DiscoverDraft } from '../types/discover';

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

interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  type: 'indexeddb' | 'localstorage' | 'file';
  version: string;
  description?: string;
}

class BackupManager {
  private static instance: BackupManager;
  private backupDB: IDBDatabase | null = null;
  
  // 备份数据库配置
  private readonly BACKUP_DB_NAME = 'ChatAppBackupDB';
  private readonly BACKUP_DB_VERSION = 1;
  private readonly BACKUP_STORE = 'backups';
  private readonly CHUNK_SIZE = 800000; // 800KB per chunk for localStorage
  
  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  // 初始化备份数据库
  private async initBackupDB(): Promise<void> {
    if (this.backupDB) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.BACKUP_DB_NAME, this.BACKUP_DB_VERSION);
      
      request.onerror = () => reject(new Error('Failed to open backup database'));
      
      request.onsuccess = () => {
        this.backupDB = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.BACKUP_STORE)) {
          const store = db.createObjectStore(this.BACKUP_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // 创建完整备份数据
  private async createBackupData(): Promise<BackupData> {
    const { dataManager } = await import('./dataManager');
    
    const backupData: BackupData = {
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

    try {
      // 尝试从IndexedDB获取数据
      await dataManager.initDB();
      
      backupData.chats = await dataManager.getAllChats();
      backupData.apiConfig = await dataManager.getApiConfig();
      backupData.personalSettings = await dataManager.getPersonalSettings();
      backupData.themeSettings = await dataManager.getThemeSettings() || backupData.themeSettings;
      backupData.balance = await dataManager.getBalance();
      backupData.transactions = await dataManager.getTransactionHistory();
      backupData.worldBooks = await dataManager.getAllWorldBooks();
      backupData.presets = await dataManager.getAllPresets();
      
      // 备份聊天相关数据
      for (const chat of backupData.chats) {
        try {
          const status = await dataManager.getChatStatus(chat.id);
          if (status) {
            backupData.chatStatuses.push({ chatId: chat.id, ...status });
          }
        } catch (error) {
          console.warn(`Failed to backup chat status for ${chat.id}:`, error);
        }
        
        try {
          const background = await dataManager.getChatBackground(chat.id);
          if (background) {
            backupData.chatBackgrounds.push({ chatId: chat.id, background });
          }
        } catch (error) {
          console.warn(`Failed to backup chat background for ${chat.id}:`, error);
        }
        
        try {
          const messages = await dataManager.getStoryModeMessages(chat.id);
          if (messages && messages.length > 0) {
            backupData.storyModeMessages.push({ chatId: chat.id, messages });
          }
        } catch (error) {
          console.warn(`Failed to backup story mode messages for ${chat.id}:`, error);
        }
      }
      
      // 备份动态数据
      backupData.discoverPosts = await dataManager.getAllDiscoverPosts();
      backupData.discoverSettings = await dataManager.getDiscoverSettings();
      backupData.discoverDrafts = await dataManager.getAllDiscoverDrafts();
      
      for (const post of backupData.discoverPosts) {
        try {
          const comments = await dataManager.getDiscoverCommentsByPost(post.id);
          backupData.discoverComments.push(...comments);
        } catch (error) {
          console.warn(`Failed to backup comments for post ${post.id}:`, error);
        }
        
        try {
          const notifications = await dataManager.getDiscoverNotifications(post.authorId);
          backupData.discoverNotifications.push(...notifications);
        } catch (error) {
          console.warn(`Failed to backup notifications for post ${post.id}:`, error);
        }
      }
      
    } catch (error) {
      console.warn('Failed to get data from IndexedDB, using localStorage fallback:', error);
      
      // 回退到localStorage
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
    }

    return backupData;
  }

  // 保存到IndexedDB备份
  private async saveToIndexedDB(backupData: BackupData): Promise<void> {
    await this.initBackupDB();
    
    return new Promise((resolve, reject) => {
      if (!this.backupDB) {
        reject(new Error('Backup database not initialized'));
        return;
      }

      const transaction = this.backupDB.transaction([this.BACKUP_STORE], 'readwrite');
      const store = transaction.objectStore(this.BACKUP_STORE);
      
      const backupRecord = {
        id: 'latest',
        timestamp: Date.now(),
        data: backupData,
        size: JSON.stringify(backupData).length,
        type: 'indexeddb' as const,
        version: backupData.version,
        description: '自动备份'
      };
      
      const request = store.put(backupRecord);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save backup to IndexedDB'));
    });
  }

  // 分块保存到localStorage
  private async saveToLocalStorage(backupData: BackupData): Promise<void> {
    const dataString = JSON.stringify(backupData);
    const dataSize = dataString.length;
    const chunks = Math.ceil(dataSize / this.CHUNK_SIZE);
    
    // 保存元数据
    const metadata = {
      totalChunks: chunks,
      totalSize: dataSize,
      timestamp: Date.now(),
      version: backupData.version,
      type: 'localstorage' as const,
      description: '分块备份'
    };
    
    localStorage.setItem('backup_metadata', JSON.stringify(metadata));
    
    // 保存数据块
    for (let i = 0; i < chunks; i++) {
      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, dataSize);
      const chunk = dataString.slice(start, end);
      
      localStorage.setItem(`backup_chunk_${i}`, chunk);
    }
    
    console.log(`Backup saved to localStorage in ${chunks} chunks, total size: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // 创建完整备份（多种方式）
  async createBackup(description?: string): Promise<BackupMetadata> {
    console.log('开始创建备份...');
    
    const backupData = await this.createBackupData();
    const dataSize = JSON.stringify(backupData).length;
    
    try {
      // 优先使用IndexedDB备份
      await this.saveToIndexedDB(backupData);
      console.log('备份已保存到IndexedDB');
      
      return {
        id: 'latest',
        timestamp: Date.now(),
        size: dataSize,
        type: 'indexeddb',
        version: backupData.version,
        description: description || 'IndexedDB备份'
      };
      
    } catch (error) {
      console.warn('IndexedDB备份失败，使用localStorage分块备份:', error);
      
      // 回退到localStorage分块备份
      await this.saveToLocalStorage(backupData);
      
      return {
        id: 'latest',
        timestamp: Date.now(),
        size: dataSize,
        type: 'localstorage',
        version: backupData.version,
        description: description || 'localStorage分块备份'
      };
    }
  }

  // 从IndexedDB恢复备份
  private async loadFromIndexedDB(): Promise<BackupData | null> {
    await this.initBackupDB();
    
    return new Promise((resolve, reject) => {
      if (!this.backupDB) {
        resolve(null);
        return;
      }

      const transaction = this.backupDB.transaction([this.BACKUP_STORE], 'readonly');
      const store = transaction.objectStore(this.BACKUP_STORE);
      const request = store.get('latest');
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to load backup from IndexedDB'));
    });
  }

  // 从localStorage恢复备份
  private async loadFromLocalStorage(): Promise<BackupData | null> {
    const metadataStr = localStorage.getItem('backup_metadata');
    if (!metadataStr) {
      return null;
    }
    
    try {
      const metadata = JSON.parse(metadataStr);
      const chunks: string[] = [];
      
      // 读取所有数据块
      for (let i = 0; i < metadata.totalChunks; i++) {
        const chunk = localStorage.getItem(`backup_chunk_${i}`);
        if (!chunk) {
          throw new Error(`Missing backup chunk ${i}`);
        }
        chunks.push(chunk);
      }
      
      // 合并数据块
      const dataString = chunks.join('');
      const backupData = JSON.parse(dataString);
      
      console.log(`Backup loaded from localStorage: ${chunks.length} chunks, total size: ${(metadata.totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      return backupData;
      
    } catch (error) {
      console.error('Failed to load backup from localStorage:', error);
      return null;
    }
  }

  // 获取可用备份列表
  async getAvailableBackups(): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];
    
    // 检查IndexedDB备份
    try {
      const indexedDBBackup = await this.loadFromIndexedDB();
      if (indexedDBBackup) {
        backups.push({
          id: 'indexeddb_latest',
          timestamp: Date.now(), // 这里应该从实际备份中获取
          size: JSON.stringify(indexedDBBackup).length,
          type: 'indexeddb',
          version: indexedDBBackup.version,
          description: 'IndexedDB备份'
        });
      }
    } catch (error) {
      console.warn('Failed to check IndexedDB backup:', error);
    }
    
    // 检查localStorage备份
    try {
      const localStorageBackup = await this.loadFromLocalStorage();
      if (localStorageBackup) {
        backups.push({
          id: 'localstorage_latest',
          timestamp: Date.now(), // 这里应该从实际备份中获取
          size: JSON.stringify(localStorageBackup).length,
          type: 'localstorage',
          version: localStorageBackup.version,
          description: 'localStorage分块备份'
        });
      }
    } catch (_error) {
      console.warn('Failed to check localStorage backup:', _error);
    }
    
    return backups;
  }

  // 恢复备份数据
  async restoreBackup(backupId: string): Promise<BackupData | null> {
    console.log(`开始恢复备份: ${backupId}`);
    
    if (backupId === 'indexeddb_latest' || backupId === 'latest') {
      return await this.loadFromIndexedDB();
    } else if (backupId === 'localstorage_latest') {
      return await this.loadFromLocalStorage();
    }
    
    return null;
  }

  // 导出备份文件
  async exportBackupFile(): Promise<void> {
    const backupData = await this.createBackupData();
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('备份文件已导出');
  }

  // 从文件导入备份
  async importBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          resolve(backupData);
        } catch (_error) {
          reject(new Error('Invalid backup file format'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }

  // 清理备份数据
  async clearBackups(): Promise<void> {
    // 清理IndexedDB备份
    try {
      await this.initBackupDB();
      if (this.backupDB) {
        const transaction = this.backupDB.transaction([this.BACKUP_STORE], 'readwrite');
        const store = transaction.objectStore(this.BACKUP_STORE);
        store.clear();
      }
    } catch (error) {
      console.warn('Failed to clear IndexedDB backups:', error);
    }
    
    // 清理localStorage备份
    try {
      const metadataStr = localStorage.getItem('backup_metadata');
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        for (let i = 0; i < metadata.totalChunks; i++) {
          localStorage.removeItem(`backup_chunk_${i}`);
        }
        localStorage.removeItem('backup_metadata');
      }
         } catch (_error) {
       console.warn('Failed to clear localStorage backups:', _error);
     }
    
    console.log('所有备份数据已清理');
  }
}

export const backupManager = BackupManager.getInstance();
