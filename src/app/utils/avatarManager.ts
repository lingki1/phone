// 全局头像管理器 - 统一管理所有头像数据，避免重复存储
import { dataManager } from './dataManager';

export interface GlobalAvatarMap {
  [avatarId: string]: string; // avatarId -> base64头像数据
}

class AvatarManager {
  private static instance: AvatarManager;
  private avatarMap: GlobalAvatarMap = {};
  private isInitialized = false;

  static getInstance(): AvatarManager {
    if (!AvatarManager.instance) {
      AvatarManager.instance = new AvatarManager();
    }
    return AvatarManager.instance;
  }

  // 初始化头像映射表
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await dataManager.initDB();
      const savedMap = await this.loadAvatarMapFromDB();
      this.avatarMap = savedMap || {};
      this.isInitialized = true;
      console.log('头像管理器初始化完成，已加载', Object.keys(this.avatarMap).length, '个头像');
    } catch (error) {
      console.error('头像管理器初始化失败:', error);
      this.avatarMap = {};
      this.isInitialized = true;
    }
  }

  // 注册头像（如果不存在则添加，存在则跳过）
  async registerAvatar(avatarId: string, avatarData: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    // 如果头像已存在，直接返回
    if (this.avatarMap[avatarId]) {
      return;
    }

    // 添加新头像
    this.avatarMap[avatarId] = avatarData;
    
    // 保存到数据库
    try {
      await this.saveAvatarMapToDB();
    } catch (error) {
      console.error('保存头像映射表失败:', error);
    }
  }

  // 强制更新头像（即使已存在也会更新）
  async updateAvatar(avatarId: string, avatarData: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    // 更新头像数据
    this.avatarMap[avatarId] = avatarData;
    
    // 保存到数据库
    try {
      await this.saveAvatarMapToDB();
      console.log('头像已更新:', avatarId);
    } catch (error) {
      console.error('更新头像映射表失败:', error);
    }
  }

  // 获取头像数据
  async getAvatar(avatarId: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.init();
    }

    return this.avatarMap[avatarId] || null;
  }

  // 获取所有头像映射表
  async getAllAvatars(): Promise<GlobalAvatarMap> {
    if (!this.isInitialized) {
      await this.init();
    }

    return { ...this.avatarMap };
  }

  // 生成头像ID
  generateAvatarId(type: 'user' | 'ai' | 'character', identifier: string): string {
    return `${type}_${identifier}`;
  }

  // 从数据库加载头像映射表
  private async loadAvatarMapFromDB(): Promise<GlobalAvatarMap | null> {
    try {
      const result = await dataManager.getGlobalData('avatarMap');
      return (result as GlobalAvatarMap) || null;
    } catch (error) {
      console.error('从数据库加载头像映射表失败:', error);
      return null;
    }
  }

  // 保存头像映射表到数据库
  private async saveAvatarMapToDB(): Promise<void> {
    try {
      await dataManager.saveGlobalData('avatarMap', this.avatarMap);
    } catch (error) {
      console.error('保存头像映射表到数据库失败:', error);
    }
  }

  // 清理未使用的头像
  async cleanupUnusedAvatars(usedAvatarIds: string[]): Promise<void> {
    const unusedIds = Object.keys(this.avatarMap).filter(id => !usedAvatarIds.includes(id));
    
    if (unusedIds.length > 0) {
      console.log('清理未使用的头像:', unusedIds.length, '个');
      
      for (const id of unusedIds) {
        delete this.avatarMap[id];
      }
      
      await this.saveAvatarMapToDB();
    }
  }

  // 获取头像数据大小统计
  getStats(): { totalAvatars: number; totalSize: number } {
    const totalAvatars = Object.keys(this.avatarMap).length;
    const totalSize = Object.values(this.avatarMap).reduce((size, data) => {
      return size + (data.length * 0.75); // base64编码大约比原始数据大33%
    }, 0);

    return { totalAvatars, totalSize };
  }
}

// 创建单例实例
export const avatarManager = AvatarManager.getInstance();
