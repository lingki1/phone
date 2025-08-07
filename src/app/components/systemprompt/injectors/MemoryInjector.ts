import { PromptInjector, PromptContext } from '../types';

export class MemoryInjector implements PromptInjector {
  priority = 20; // 记忆注入优先级较高，在基础模板之后

  async inject(context: PromptContext): Promise<string> {
    const { chat } = context;
    
    let memoryContent = '';

    // 处理群聊记忆（仅在单聊中）
    if (!chat.isGroup && chat.settings.linkedGroupChatIds && chat.settings.linkedGroupChatIds.length > 0) {
      const groupMemoryContent = await this.buildGroupMemoryContent(context);
      if (groupMemoryContent) {
        memoryContent += groupMemoryContent;
      }
    }

    // 处理单聊记忆（仅在群聊中）
    if (chat.isGroup && chat.members) {
      const singleMemoryContent = this.buildSingleMemoryContent(context);
      if (singleMemoryContent) {
        memoryContent += singleMemoryContent;
      }
    }

    return memoryContent;
  }

  // 构建群聊记忆内容
  private async buildGroupMemoryContent(context: PromptContext): Promise<string> {
    const { chat, myNickname, allChats, availableContacts } = context;
    
    const groupMemoryPromises = chat.settings.linkedGroupChatIds!.map(async (groupChatId) => {
      // 优先使用 allChats，后备使用 availableContacts
      const allChatsData = allChats || availableContacts;
      const groupChat = allChatsData.find(contact => contact.id === groupChatId);
      if (!groupChat || !groupChat.messages) return null;
      
      // 获取群聊中所有人的消息
      const recentMessages = groupChat.messages.slice(-5).map(msg => 
        `${msg.role === 'user' ? myNickname : msg.senderName || chat.name}: ${msg.content}`
      ).join('\n');
      
      return `## ${groupChat.name} 群聊记忆 (${groupChat.messages.length} 条记录)
最近5条对话记录：
${recentMessages}

注意：这些是你在群聊中的表现，在单聊中请保持一致的个性和关系。`;
    });
    
    const groupMemories = await Promise.all(groupMemoryPromises);
    const validMemories = groupMemories.filter(memory => memory !== null);
    
    // 添加调试信息
    console.log('MemoryInjector - 单聊群聊记忆构建:', {
      linkedGroupChatIds: chat.settings.linkedGroupChatIds,
      allChatsCount: allChats?.length || 0,
      availableContactsCount: availableContacts?.length || 0,
      foundGroupChats: validMemories.length,
      groupMemoryInfo: validMemories.length > 0 ? '已构建' : '无群聊记忆'
    });
    
    if (validMemories.length > 0) {
      return `\n\n# 群聊记忆信息\n${validMemories.join('\n\n')}`;
    }

    return '';
  }

  // 构建单聊记忆内容
  private buildSingleMemoryContent(context: PromptContext): string {
    const { chat, myNickname } = context;
    
    if (!chat.members) return '';

    const memoryInfo = chat.members
      .filter(m => m.id !== 'me' && m.singleChatMemory && m.singleChatMemory.length > 0)
      .map(m => {
        const memoryCount = m.singleChatMemory?.length || 0;
        const recentMessages = m.singleChatMemory?.slice(-5).map(msg => 
          `${msg.role === 'user' ? myNickname : m.originalName}: ${msg.content}`
        ).join('\n') || '';
        
        return `## ${m.originalName} 与 ${myNickname} 的单聊记忆 (${memoryCount} 条记录)
最近5条对话：
${recentMessages}`;
      })
      .join('\n\n');

    if (memoryInfo) {
      return `\n\n# 单聊记忆信息\n${memoryInfo}`;
    }

    return '';
  }
}
