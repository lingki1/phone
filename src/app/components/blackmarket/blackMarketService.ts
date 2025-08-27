import { CharacterCard, WorldBook, BlackMarketItem } from './types';

class BlackMarketService {
  private baseUrl = '/api/blackmarket';

  // 获取所有物品
  async getAllItems(): Promise<BlackMarketItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/items`);
      if (!response.ok) {
        throw new Error('获取物品失败');
      }
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('获取所有物品失败:', error);
      throw error;
    }
  }

  // 获取角色卡
  async getCharacters(): Promise<CharacterCard[]> {
    try {
      const response = await fetch(`${this.baseUrl}/characters`);
      if (!response.ok) {
        throw new Error('获取角色卡失败');
      }
      const data = await response.json();
      return data.characters || [];
    } catch (error) {
      console.error('获取角色卡失败:', error);
      throw error;
    }
  }

  // 获取世界书
  async getWorldBooks(): Promise<WorldBook[]> {
    try {
      const response = await fetch(`${this.baseUrl}/worldbooks`);
      if (!response.ok) {
        throw new Error('获取世界书失败');
      }
      const data = await response.json();
      return data.worldbooks || [];
    } catch (error) {
      console.error('获取世界书失败:', error);
      throw error;
    }
  }

  // 获取用户上传的物品
  async getUserUploads(username: string): Promise<BlackMarketItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${encodeURIComponent(username)}/uploads`);
      if (!response.ok) {
        throw new Error('获取用户上传失败');
      }
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('获取用户上传失败:', error);
      return [];
    }
  }

  // 下载物品
  async downloadItem(id: string, type: 'character' | 'worldbook'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      // 获取文件内容
      const blob = await response.blob();
      const fileName = response.headers.get('content-disposition')?.match(/filename="(.+)"$/)?.[1] || `${type}_${id}`;
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 更新下载数量
      await this.incrementDownloadCount(id);

    } catch (error) {
      console.error('下载物品失败:', error);
      throw error;
    }
  }

  // 上传角色卡
  async uploadCharacter(file: File, metadata: {
    name: string;
    description: string;
    tags: string[];
  }): Promise<CharacterCard> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`${this.baseUrl}/upload/character`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 包含认证cookie
      });

      if (!response.ok) {
        throw new Error('上传角色卡失败');
      }

      const data = await response.json();
      return data.character;
    } catch (error) {
      console.error('上传角色卡失败:', error);
      throw error;
    }
  }

  // 上传世界书
  async uploadWorldBook(file: File, metadata: {
    name: string;
    description: string;
    tags: string[];
  }): Promise<WorldBook> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`${this.baseUrl}/upload/worldbook`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 包含认证cookie
      });

      if (!response.ok) {
        throw new Error('上传世界书失败');
      }

      const data = await response.json();
      return data.worldbook;
    } catch (error) {
      console.error('上传世界书失败:', error);
      throw error;
    }
  }

  // 增加下载次数
  private async incrementDownloadCount(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/items/${id}/download`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('更新下载次数失败:', error);
    }
  }

  // 解析角色卡PNG中的元数据
  async parseCharacterMetadata(file: File): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/parse/character`, {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('file', file);
          return formData;
        })(),
      });

      if (!response.ok) {
        throw new Error('解析角色卡元数据失败');
      }

      const data: { metadata?: Record<string, unknown> } = await response.json();
      return data.metadata ?? {};
    } catch (error) {
      console.error('解析角色卡元数据失败:', error);
      throw error;
    }
  }

  // 模拟数据（用于开发测试）
  private getMockItems(): BlackMarketItem[] {
    return [];
  }

  private getMockCharacters(): CharacterCard[] {
    return [];
  }

  private getMockWorldBooks(): WorldBook[] {
    return [];
  }
}

export const blackMarketService = new BlackMarketService();
