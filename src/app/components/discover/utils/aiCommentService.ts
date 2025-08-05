// AI评论服务 - 基于API的智能评论生成
import { dataManager } from '../../../utils/dataManager';
import { DiscoverPost, DiscoverComment } from '../../../types/discover';
import { ChatItem } from '../../../types/chat';
import { ApiConfig } from '../../../types/chat';

export interface AiCommentResponse {
  success: boolean;
  comments: Array<{
    characterId: string;
    characterName: string;
    characterAvatar: string;
    content: string;
    mentions?: string[]; // @提及的用户或AI角色
  }>;
  error?: string;
}

export class AiCommentService {
  private static instance: AiCommentService;
  private isProcessing = false;

  static getInstance(): AiCommentService {
    if (!AiCommentService.instance) {
      AiCommentService.instance = new AiCommentService();
    }
    return AiCommentService.instance;
  }

  // 验证API配置
  async validateApiConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      const apiConfig = await dataManager.getApiConfig();
      
      if (!apiConfig.proxyUrl) {
        return { valid: false, error: '缺少API代理地址，请在设置中配置' };
      }
      
      if (!apiConfig.apiKey) {
        return { valid: false, error: '缺少API密钥，请在设置中配置' };
      }

      // 测试API连接
      const testResponse = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: apiConfig.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
          temperature: 0.7,
          top_p: 0.8
        })
      });

      if (!testResponse.ok) {
        return { 
          valid: false, 
          error: `API连接失败: ${testResponse.status} ${testResponse.statusText}` 
        };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: `API配置验证失败: ${error instanceof Error ? error.message : '未知错误'}` 
      };
    }
  }

  // 生成AI评论（主要方法）
  async generateCommentsForPost(post: DiscoverPost): Promise<AiCommentResponse> {
    if (this.isProcessing) {
      return { success: false, comments: [], error: '正在处理中，请稍后重试' };
    }

    this.isProcessing = true;

    try {
      console.log('🚀 开始生成AI评论');
      
      // 1. 验证API配置
      const configValidation = await this.validateApiConfig();
      if (!configValidation.valid) {
        throw new Error(configValidation.error);
      }

      // 2. 获取API配置
      const apiConfig = await dataManager.getApiConfig();

      // 2. 获取用户信息
      const userInfo = await dataManager.getPersonalSettings();

      // 3. 获取AI角色列表
      const allChats = await dataManager.getAllChats();
      const aiCharacters = allChats.filter(chat => !chat.isGroup);

      if (aiCharacters.length === 0) {
        throw new Error('没有可用的AI角色');
      }

      // 4. 智能选择AI角色（基于角色人设和动态内容的相关性）
      const selectedCharacters = this.selectRelevantCharacters(aiCharacters, post, 3);

      // 5. 构建API请求
      const requestData = this.buildApiRequest(post, userInfo, selectedCharacters);

      // 6. 调用API
      const response = await this.callApi(apiConfig, requestData);

      // 7. 解析响应并保存评论
      const comments = await this.processApiResponse(response, post, selectedCharacters);

      return {
        success: true,
        comments: comments.map(comment => ({
          characterId: comment.authorId,
          characterName: comment.authorName,
          characterAvatar: comment.authorAvatar,
          content: comment.content,
          mentions: this.extractMentions(comment.content)
        }))
      };

    } catch (error) {
      console.error('Failed to generate AI comments:', error);
      return {
        success: false,
        comments: [],
        error: error instanceof Error ? error.message : '生成评论失败'
      };
    } finally {
      this.isProcessing = false;
    }
  }

  // 智能选择相关AI角色
  private selectRelevantCharacters(
    characters: ChatItem[], 
    post: DiscoverPost, 
    maxCount: number
  ): ChatItem[] {
    const postContent = post.content.toLowerCase();
    const postTags = post.tags || [];

    // 计算每个角色的相关性分数
    const scoredCharacters = characters.map(character => {
      let score = 0;
      const persona = character.persona.toLowerCase();

      // 基于动态内容匹配
      if (postContent.includes('学习') && persona.includes('智慧')) score += 3;
      if (postContent.includes('心情') && persona.includes('温柔')) score += 3;
      if (postContent.includes('朋友') && persona.includes('活泼')) score += 3;
      if (postContent.includes('思考') && persona.includes('智慧')) score += 3;
      if (postContent.includes('快乐') && persona.includes('开朗')) score += 3;

      // 基于标签匹配
      postTags.forEach(tag => {
        if (persona.includes(tag.toLowerCase())) score += 2;
      });

      // 随机因素（确保多样性）
      score += Math.random() * 2;

      return { character, score };
    });

    // 按分数排序并选择前N个
    return scoredCharacters
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount)
      .map(item => item.character);
  }

  // 构建API请求数据
  private buildApiRequest(
    post: DiscoverPost, 
    userInfo: { userNickname: string; userBio: string }, 
    characters: ChatItem[]
  ) {
    return {
      post: {
        content: post.content,
        images: post.images,
        tags: post.tags,
        mood: post.mood,
        location: post.location,
        timestamp: post.timestamp,
        authorName: post.authorName
      },
      author: {
        name: userInfo.userNickname,
        bio: userInfo.userBio
      },
      characters: characters.map(char => {
        // 获取最近的聊天记录（最多10条）
        const recentMessages = char.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .slice(-10)
          .map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            senderName: msg.senderName || (msg.role === 'user' ? '用户' : char.name)
          }));

        return {
          id: char.id,
          name: char.name,
          persona: char.persona,
          avatar: char.avatar,
          chatHistory: recentMessages,
          totalMessages: char.messages.length
        };
      }),
      context: {
        totalCharacters: characters.length,
        postType: post.type,
        isPublic: post.isPublic
      }
    };
  }

  // 调用API
  private async callApi(apiConfig: ApiConfig, requestData: unknown): Promise<string> {
    console.log('🔍 AI评论服务 - 开始API调用');
    console.log('📡 API配置:', {
      proxyUrl: apiConfig.proxyUrl,
      model: apiConfig.model || 'gpt-3.5-turbo',
      hasApiKey: !!apiConfig.apiKey
    });

    const requestBody = {
      model: apiConfig.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt()
        },
        {
          role: 'user',
          content: JSON.stringify(requestData, null, 2)
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.8,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    console.log('📤 请求体:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 响应状态:', response.status, response.statusText);
      console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API请求失败:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText.substring(0, 500) // 只显示前500字符
        });
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ 响应不是JSON格式:', {
          contentType,
          responseText: responseText.substring(0, 500)
        });
        throw new Error(`API返回了非JSON格式: ${contentType}`);
      }

      const data = await response.json();
      console.log('✅ API响应数据:', data);
      
      // 检查API是否返回了错误
      if (data.error) {
        const errorMessage = data.error.message || data.error.type || '未知错误';
        const errorCode = data.error.code || '未知';
        throw new Error(`API服务器错误: ${errorMessage} (代码: ${errorCode})`);
      }
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ API响应格式错误:', data);
        throw new Error('API响应格式错误: 缺少choices或message字段');
      }

      const content = data.choices[0].message.content;
      console.log('✅ 提取的AI回复:', content);
      return content;

    } catch (error) {
      console.error('❌ API调用异常:', error);
      if (error instanceof Error) {
        throw new Error(`API调用失败: ${error.message}`);
      }
      throw new Error('API调用失败: 未知错误');
    }
  }

  // 构建系统提示词
  private buildSystemPrompt(): string {
    return `你是一个智能社交评论生成器。你的任务是根据用户发布的动态内容、AI角色的人设和聊天历史，生成自然、有趣的评论。

⚠️ 重要：你必须且只能返回有效的JSON格式，不能包含任何其他文本。

## 聊天历史分析：
- 分析每个角色的chatHistory，了解角色与用户的关系和互动风格
- 根据聊天内容调整角色的语气和表达方式
- 可以引用聊天中的话题或情感状态
- 保持角色在聊天中展现的个性特征

要求：
1. 必须返回严格的JSON格式
2. 评论要符合角色人设，体现角色个性
3. 参考聊天历史中的互动方式和关系
4. 评论内容要自然，避免过于机械
5. 可以包含@提及其他角色或用户
6. 评论长度控制在20-50字之间
7. 每个角色只能生成一条评论
8. 可以体现聊天中建立的关系和话题

返回格式（必须严格遵循）：
{
  "comments": [
    {
      "characterId": "角色ID",
      "content": "评论内容，可以包含@用户名或@角色名",
      "tone": "评论语调（如：友好、幽默、思考等）"
    }
  ]
}

示例输出：
{
  "comments": [
    {
      "characterId": "char_001",
      "content": "哈哈，这个想法很有趣！@用户 就像我们刚才聊天时说的那样～",
      "tone": "友好"
    },
    {
      "characterId": "char_002", 
      "content": "很有深度的思考，值得学习。@用户 我们之前也讨论过类似的话题呢",
      "tone": "思考"
    }
  ]
}

⚠️ 注意事项：
- 必须返回有效的JSON，不能有任何其他文本
- 确保JSON语法正确，所有字符串用双引号包围
- 评论要真实自然，符合角色人设
- 参考聊天历史，但不要直接复制聊天内容
- 避免重复或过于相似的评论
- 可以引用动态中的具体内容
- 支持@功能，格式为@用户名或@角色名
- 如果无法生成评论，返回空的comments数组：{"comments": []}`;
  }

  // 处理API响应
  private async processApiResponse(
    response: string, 
    post: DiscoverPost, 
    characters: ChatItem[]
  ): Promise<DiscoverComment[]> {
    try {
      console.log('🔍 开始解析API响应');
      console.log('📄 原始响应:', response);

      // 尝试清理响应文本，提取JSON部分
      let cleanedResponse = response.trim();
      
      // 如果响应包含代码块标记，提取其中的内容
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
          console.log('🧹 提取的JSON内容:', cleanedResponse);
        }
      } else if (cleanedResponse.includes('```')) {
        // 提取任何代码块内容
        const codeMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          cleanedResponse = codeMatch[1].trim();
          console.log('🧹 提取的代码块内容:', cleanedResponse);
        }
      }

      // 尝试解析JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError);
        console.log('📄 尝试解析的内容:', cleanedResponse);
        
        // 尝试查找JSON对象
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            console.log('✅ 通过正则匹配成功解析JSON');
          } catch (secondError) {
            console.error('❌ 正则匹配解析也失败:', secondError);
            throw new Error('无法解析JSON响应');
          }
        } else {
          throw new Error('响应中未找到有效的JSON');
        }
      }

      console.log('✅ 解析后的响应:', parsedResponse);
      
      if (!parsedResponse.comments || !Array.isArray(parsedResponse.comments)) {
        console.error('❌ 响应格式错误，缺少comments数组:', parsedResponse);
        throw new Error('API响应格式不正确: 缺少comments数组');
      }

      const comments: DiscoverComment[] = [];

      for (const commentData of parsedResponse.comments) {
        console.log('🔍 处理评论数据:', commentData);
        
        // 验证评论数据格式
        if (!commentData.characterId || !commentData.content) {
          console.warn('⚠️ 跳过格式不正确的评论:', commentData);
          continue;
        }

        // 查找对应的角色
        const character = characters.find(c => c.id === commentData.characterId);
        if (!character) {
          console.warn('⚠️ 未找到角色:', commentData.characterId);
          continue;
        }

        // 创建评论对象
        const comment: DiscoverComment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          postId: post.id,
          authorId: character.id,
          authorName: character.name,
          authorAvatar: character.avatar,
          content: commentData.content,
          timestamp: Date.now(),
          likes: [],
          aiGenerated: true
        };

        console.log('💾 保存评论:', comment);

        // 保存到数据库
        await dataManager.saveDiscoverComment(comment);
        comments.push(comment);

        // 添加延迟避免过于频繁
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('✅ 成功处理评论数量:', comments.length);
      return comments;

    } catch (error) {
      console.error('❌ 处理API响应失败:', error);
      console.log('📄 原始响应内容:', response);
      throw new Error(`解析API响应失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 提取@提及
  private extractMentions(content: string): string[] {
    const mentionRegex = /@([^\s]+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  // 后台处理评论（异步）
  async processCommentsInBackground(post: DiscoverPost): Promise<void> {
    // 在后台异步处理，不阻塞UI
    setTimeout(async () => {
      try {
        const result = await this.generateCommentsForPost(post);
        if (result.success) {
          console.log('后台评论生成成功:', result.comments.length, '条评论');
          // 可以在这里触发UI更新事件
          window.dispatchEvent(new CustomEvent('aiCommentsGenerated', {
            detail: { postId: post.id, comments: result.comments }
          }));
        } else {
          console.warn('后台评论生成失败:', result.error);
        }
      } catch (error) {
        console.error('后台评论处理失败:', error);
      }
    }, 1000); // 延迟1秒开始处理
  }
}

export const aiCommentService = AiCommentService.getInstance(); 