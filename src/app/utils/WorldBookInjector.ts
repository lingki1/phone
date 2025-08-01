// 世界书注入器 - 用于将世界书内容注入到系统提示词中
import { dataManager } from './dataManager';

export class WorldBookInjector {
  /**
   * 将世界书内容注入到系统提示词中
   * @param chatId 聊天ID
   * @param originalPrompt 原始系统提示词
   * @param linkedWorldBookIds 关联的世界书ID列表
   * @returns 注入世界书内容后的系统提示词
   */
  static async injectWorldBooks(
    chatId: string,
    originalPrompt: string,
    linkedWorldBookIds: string[]
  ): Promise<string> {
    // 如果没有关联的世界书，直接返回原始提示词
    if (!linkedWorldBookIds || linkedWorldBookIds.length === 0) {
      return originalPrompt;
    }

    try {
      // 获取所有关联的世界书
      const worldBookPromises = linkedWorldBookIds.map(id => 
        dataManager.getWorldBook(id)
      );
      
      const worldBooks = await Promise.all(worldBookPromises);
      
      // 过滤掉不存在的世界书
      const validWorldBooks = worldBooks.filter(wb => wb !== null);
      
      // 如果没有有效的世界书，返回原始提示词
      if (validWorldBooks.length === 0) {
        return originalPrompt;
      }

      // 构建世界书内容
      const worldBookContent = validWorldBooks
        .map(wb => `## ${wb!.name}\n${wb!.content}`)
        .join('\n\n');

      // 将世界书内容注入到系统提示词的末尾
      const injectedPrompt = `${originalPrompt}\n\n# 世界设定\n${worldBookContent}`;

      return injectedPrompt;
    } catch (error) {
      console.error('Failed to inject world books:', error);
      // 如果注入失败，返回原始提示词
      return originalPrompt;
    }
  }

  /**
   * 批量注入世界书内容（用于群聊等场景）
   * @param chats 聊天列表
   * @param originalPrompt 原始系统提示词
   * @returns 注入世界书内容后的系统提示词
   */
  static async injectWorldBooksForMultipleChats(
    chats: Array<{ id: string; linkedWorldBookIds: string[] }>,
    originalPrompt: string
  ): Promise<string> {
    // 收集所有唯一的世界书ID
    const allWorldBookIds = new Set<string>();
    chats.forEach(chat => {
      chat.linkedWorldBookIds.forEach(id => allWorldBookIds.add(id));
    });

    // 如果没有世界书ID，直接返回原始提示词
    if (allWorldBookIds.size === 0) {
      return originalPrompt;
    }

    try {
      // 获取所有世界书
      const worldBookPromises = Array.from(allWorldBookIds).map(id => 
        dataManager.getWorldBook(id)
      );
      
      const worldBooks = await Promise.all(worldBookPromises);
      
      // 过滤掉不存在的世界书
      const validWorldBooks = worldBooks.filter(wb => wb !== null);
      
      // 如果没有有效的世界书，返回原始提示词
      if (validWorldBooks.length === 0) {
        return originalPrompt;
      }

      // 按名称排序，确保一致的顺序
      validWorldBooks.sort((a, b) => a!.name.localeCompare(b!.name));

      // 构建世界书内容
      const worldBookContent = validWorldBooks
        .map(wb => `## ${wb!.name}\n${wb!.content}`)
        .join('\n\n');

      // 将世界书内容注入到系统提示词的末尾
      const injectedPrompt = `${originalPrompt}\n\n# 世界设定\n${worldBookContent}`;

      return injectedPrompt;
    } catch (error) {
      console.error('Failed to inject world books for multiple chats:', error);
      // 如果注入失败，返回原始提示词
      return originalPrompt;
    }
  }

  /**
   * 验证世界书ID是否存在
   * @param worldBookIds 世界书ID列表
   * @returns 存在的世界书ID列表
   */
  static async validateWorldBookIds(worldBookIds: string[]): Promise<string[]> {
    if (!worldBookIds || worldBookIds.length === 0) {
      return [];
    }

    try {
      const worldBookPromises = worldBookIds.map(id => 
        dataManager.getWorldBook(id)
      );
      
      const worldBooks = await Promise.all(worldBookPromises);
      
      // 返回存在的世界书ID
      return worldBookIds.filter((id, index) => worldBooks[index] !== null);
    } catch (error) {
      console.error('Failed to validate world book IDs:', error);
      return [];
    }
  }

  /**
   * 清理无效的世界书关联
   * @param chatId 聊天ID
   * @param linkedWorldBookIds 当前关联的世界书ID列表
   * @returns 清理后的世界书ID列表
   */
  static async cleanupInvalidWorldBooks(
    chatId: string,
    linkedWorldBookIds: string[]
  ): Promise<string[]> {
    const validIds = await this.validateWorldBookIds(linkedWorldBookIds);
    
    // 如果有无效的ID被移除，记录日志
    if (validIds.length !== linkedWorldBookIds.length) {
      const removedIds = linkedWorldBookIds.filter(id => !validIds.includes(id));
      console.warn(`Removed invalid world book IDs for chat ${chatId}:`, removedIds);
    }
    
    return validIds;
  }
}