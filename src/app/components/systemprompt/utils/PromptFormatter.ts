// 提示词格式化工具类

export class PromptFormatter {
  // 格式化提示词，使其更易读
  static formatPrompt(systemPrompt: string): string {
    // 移除多余的空行
    let formatted = systemPrompt
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 确保标题格式一致
    formatted = formatted
      .replace(/^#\s+/gm, '# ')
      .replace(/^##\s+/gm, '## ')
      .replace(/^###\s+/gm, '### ');

    // 确保列表格式一致
    formatted = formatted
      .replace(/^-\s+/gm, '- ')
      .replace(/^\*\s+/gm, '- ');

    return formatted;
  }

  // 压缩提示词，移除不必要的空白
  static compressPrompt(systemPrompt: string): string {
    return systemPrompt
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  // 统计提示词信息
  static analyzePrompt(systemPrompt: string): {
    totalLength: number;
    lineCount: number;
    wordCount: number;
    sections: string[];
    hasWorldBooks: boolean;
    hasMemory: boolean;
    hasStatus: boolean;
    hasPreset: boolean;
  } {
    const lines = systemPrompt.split('\n');
    const words = systemPrompt.split(/\s+/).filter(word => word.length > 0);
    
    // 提取章节标题
    const sections = lines
      .filter(line => line.startsWith('#'))
      .map(line => line.replace(/^#+\s*/, ''));

    return {
      totalLength: systemPrompt.length,
      lineCount: lines.length,
      wordCount: words.length,
      sections,
      hasWorldBooks: systemPrompt.includes('世界设定'),
      hasMemory: systemPrompt.includes('记忆信息') || systemPrompt.includes('单聊记忆') || systemPrompt.includes('群聊记忆'),
      hasStatus: systemPrompt.includes('状态信息') || systemPrompt.includes('当前状态'),
      hasPreset: systemPrompt.includes('预设配置')
    };
  }

  // 提取提示词中的关键信息
  static extractKeyInfo(systemPrompt: string): {
    chatType: 'group' | 'single' | 'unknown';
    characterName?: string;
    worldBooks: string[];
    memoryCount: number;
    actionTypes: string[];
  } {
    const lines = systemPrompt.split('\n');
    
    // 判断聊天类型
    let chatType: 'group' | 'single' | 'unknown' = 'unknown';
    if (systemPrompt.includes('群聊AI') || systemPrompt.includes('群成员列表')) {
      chatType = 'group';
    } else if (systemPrompt.includes('扮演一个名为') || systemPrompt.includes('角色设定')) {
      chatType = 'single';
    }

    // 提取角色名称
    const characterMatch = systemPrompt.match(/扮演一个名为"([^"]+)"/);
    const characterName = characterMatch ? characterMatch[1] : undefined;

    // 提取世界书
    const worldBooks = lines
      .filter(line => line.startsWith('## ') && !line.includes('记忆'))
      .map(line => line.replace('## ', ''));

    // 统计记忆数量
    const memoryMatches = systemPrompt.match(/\((\d+) 条记录\)/g);
    const memoryCount = memoryMatches ? 
      memoryMatches.reduce((sum, match) => {
        const count = parseInt(match.match(/\d+/)![0]);
        return sum + count;
      }, 0) : 0;

    // 提取操作类型
    const actionTypes = lines
      .filter(line => line.includes('"type":'))
      .map(line => {
        const match = line.match(/"type":\s*"([^"]+)"/);
        return match ? match[1] : '';
      })
      .filter(type => type.length > 0);

    return {
      chatType,
      characterName,
      worldBooks,
      memoryCount,
      actionTypes: [...new Set(actionTypes)] // 去重
    };
  }

  // 验证提示词格式
  static validateFormat(systemPrompt: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查基本结构
    if (!systemPrompt.includes('核心规则') && !systemPrompt.includes('任务与规则')) {
      errors.push('缺少核心规则或任务规则');
    }

    if (!systemPrompt.includes('操作指令')) {
      errors.push('缺少操作指令');
    }

    if (!systemPrompt.includes('红包处理规则')) {
      errors.push('缺少红包处理规则');
    }

    // 检查格式问题
    if (systemPrompt.includes('  ')) {
      warnings.push('存在多余的空格');
    }

    if (systemPrompt.includes('\n\n\n')) {
      warnings.push('存在多余的空行');
    }

    // 检查长度
    if (systemPrompt.length < 100) {
      errors.push('提示词过短，可能缺少必要内容');
    }

    if (systemPrompt.length > 10000) {
      warnings.push('提示词过长，可能影响性能');
    }

    // 检查JSON格式
    const jsonMatches = systemPrompt.match(/\{[^{}]*\}/g);
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          JSON.parse(match);
        } catch {
          warnings.push(`可能存在格式错误的JSON: ${match.substring(0, 50)}...`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
