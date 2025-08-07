import { PromptInjector, PromptContext, WorldBookInfo } from '../types';
import { dataManager } from '../../../utils/dataManager';

export class WorldBookInjector implements PromptInjector {
  priority = 10; // 世界书注入优先级较低，在基础模板之后

  async inject(context: PromptContext): Promise<string> {
    const { chat } = context;
    const linkedWorldBookIds = chat.settings.linkedWorldBookIds || [];

    console.log('WorldBookInjector: 开始注入世界书', {
      chatId: chat.id,
      chatName: chat.name,
      linkedWorldBookIds: linkedWorldBookIds,
      linkedCount: linkedWorldBookIds.length
    });

    if (linkedWorldBookIds.length === 0) {
      console.log('WorldBookInjector: 没有关联的世界书');
      return ''; // 没有关联的世界书，返回空字符串
    }

    try {
      // 获取所有关联的世界书
      const worldBookPromises = linkedWorldBookIds.map(id => 
        dataManager.getWorldBook(id)
      );
      
      const worldBooks = await Promise.all(worldBookPromises);
      const validWorldBooks = worldBooks.filter(wb => wb !== null) as WorldBookInfo[];
      
      if (validWorldBooks.length === 0) {
        console.warn('WorldBookInjector: 没有找到有效的世界书');
        return '';
      }

      // 格式化世界书内容
      const worldBookContent = validWorldBooks
        .map(wb => `## ${wb.name} (${wb.category})\n${wb.content}`)
        .join('\n\n');

      console.log(`WorldBookInjector: 成功注入 ${validWorldBooks.length} 个世界书`, {
        worldBooks: validWorldBooks.map(wb => ({ id: wb.id, name: wb.name, category: wb.category }))
      });
      
      const injectedContent = `\n\n# 世界设定\n${worldBookContent}`;
      console.log('WorldBookInjector: 注入内容长度:', injectedContent.length);
      
      return injectedContent;
    } catch (error) {
      console.error('WorldBookInjector: 注入世界书时发生错误:', error);
      return ''; // 出错时返回空字符串，不影响其他注入器
    }
  }
}
