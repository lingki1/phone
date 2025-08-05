// AI动态生成器 - 基于API的智能内容生成
import { dataManager } from '../../../utils/dataManager';
import { DiscoverPost, DiscoverComment } from '../../../types/discover';
import { ChatItem } from '../../../types/chat';
import { ApiConfig } from '../../../types/chat';

export interface AiPostResponse {
  success: boolean;
  post?: {
    content: string;
    images: string[];
    tags: string[];
    mood: string;
    location: string;
    type: 'text' | 'image' | 'mixed';
  };
  error?: string;
}

export interface BatchGenerationResponse {
  posts: Array<{
    characterId: string;
    content: string;
    images: string[];
    tags: string[];
    mood: string;
    location: string;
    type: 'text' | 'image' | 'mixed';
  }>;
  comments: Array<{
    characterId: string;
    postId: string;
    content: string;
  }>;
}

export class AiPostGenerator {
  private static instance: AiPostGenerator;
  private isGenerating = false;

  static getInstance(): AiPostGenerator {
    if (!AiPostGenerator.instance) {
      AiPostGenerator.instance = new AiPostGenerator();
    }
    return AiPostGenerator.instance;
  }

  // 🚀 超强健壮 JSON 解析函数
  private strongJsonExtract(raw: string): Record<string, unknown> {
    console.log('🔧 开始强力JSON解析，原始内容长度:', raw.length);
    
    // 1. 清理和标准化输入
    let content = raw.trim();
    
    // 2. 尝试提取代码块内容
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      content = codeBlockMatch[1].trim();
      console.log('📦 从代码块中提取内容');
    }
    
    // 3. 尝试直接解析
    try {
      const result = JSON.parse(content);
      console.log('✅ 直接解析成功');
      return result;
    } catch {
      console.log('❌ 直接解析失败，开始修复...');
    }
    
    // 4. 尝试提取最大JSON块
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
      console.log('🔍 提取最大JSON块');
    }
    
    // 5. 自动修复常见错误
    let fixedContent = content;
    
    // 修复结尾缺失的括号
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    
    // 补全缺失的闭合括号
    while (closeBraces < openBraces) {
      fixedContent += '}';
    }
    while (closeBrackets < openBrackets) {
      fixedContent += ']';
    }
    
    // 删除多余的结尾逗号
    fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');
    
    // 删除非JSON内容
    fixedContent = fixedContent.replace(/[^\x20-\x7E]/g, ''); // 只保留可打印ASCII字符
    
    console.log('🔧 修复后内容长度:', fixedContent.length);
    
    // 6. 尝试修复后的解析
    try {
      const result = JSON.parse(fixedContent);
      console.log('✅ 修复后解析成功');
      return result;
    } catch {
      console.log('❌ 修复后解析失败，尝试逐步截断...');
    }
    
    // 7. 逐步截断到最后一个完整的JSON
    for (let i = fixedContent.length - 1; i > 0; i--) {
      try {
        const truncated = fixedContent.substring(0, i);
        const result = JSON.parse(truncated);
        console.log(`✅ 截断到位置 ${i} 解析成功`);
        return result;
      } catch {
        // 继续尝试
      }
    }
    
          // 8. 最后尝试：提取posts和comments部分
      try {
        const postsMatch = content.match(/"posts"\s*:\s*\[[\s\S]*?\]/);
        const commentsMatch = content.match(/"comments"\s*:\s*\[[\s\S]*?\]/);
        
        if (postsMatch || commentsMatch) {
          const result: Record<string, unknown> = {};
          if (postsMatch) {
            result.posts = JSON.parse(`[${postsMatch[0].split('[')[1].split(']')[0]}]`);
          }
          if (commentsMatch) {
            result.comments = JSON.parse(`[${commentsMatch[0].split('[')[1].split(']')[0]}]`);
          }
          console.log('✅ 部分提取成功');
          return result;
        }
      } catch {
        console.log('❌ 部分提取失败');
      }
    
    // 9. 返回默认空结构
    console.log('⚠️ 所有解析方法失败，返回默认结构');
    return { posts: [], comments: [] };
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

  // 🚀 新增：批量生成所有内容（优化API使用）
  async generateBatchContent(
    characters: ChatItem[], 
    postsCount: number = 3, 
    commentsPerPost: number = 2
  ): Promise<{ posts: DiscoverPost[]; comments: DiscoverComment[] }> {
    if (this.isGenerating) {
      return { posts: [], comments: [] };
    }
    
    this.isGenerating = true;
    
    try {
      // 1. 获取API配置
      const apiConfig = await dataManager.getApiConfig();

      // 2. 构建批量请求数据（包含历史状态）
      const requestData = await this.buildBatchRequest(characters, postsCount, commentsPerPost);

      // 3. 调用API
      const response = await this.callApi(apiConfig, requestData, true);

      // 4. 解析响应并创建内容
      const batchResponse = await this.processBatchResponse(response);

      // 6. 保存到数据库
      const posts: DiscoverPost[] = [];
      const comments: DiscoverComment[] = [];

      // 处理动态
      for (const postData of batchResponse.posts) {
        const character = characters.find(c => c.id === postData.characterId);
        if (character) {
          const post: DiscoverPost = {
            id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            authorId: character.id,
            authorName: character.name,
            authorAvatar: character.avatar,
            content: postData.content,
            images: postData.images,
            tags: postData.tags,
            mood: postData.mood,
            location: postData.location,
            type: postData.type,
            timestamp: Date.now(),
            likes: [],
            comments: [],
            isPublic: true
          };
          
          await dataManager.saveDiscoverPost(post);
          posts.push(post);
        }
      }

      // 处理评论
      for (const commentData of batchResponse.comments) {
        const character = characters.find(c => c.id === commentData.characterId);
        // postId 是数字索引，需要转换为实际的 post ID
        const postIndex = parseInt(commentData.postId);
        const post = posts[postIndex];
        
        if (character && post) {
          const comment: DiscoverComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            postId: post.id,
            authorId: character.id,
            authorName: character.name,
            authorAvatar: character.avatar,
            content: commentData.content,
            timestamp: Date.now(),
            likes: []
          };
          
          await dataManager.saveDiscoverComment(comment);
          comments.push(comment);
          
          // 更新动态的评论列表
          post.comments.push(comment);
          await dataManager.saveDiscoverPost(post);
        }
      }

      return { posts, comments };

    } catch (error) {
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  // 生成单个最有争议的动态和评论
  async generateSinglePostWithComments(characters: ChatItem[]): Promise<{ post: DiscoverPost | null; comments: DiscoverComment[] }> {
    if (this.isGenerating) {
      return { post: null, comments: [] };
    }
    
    this.isGenerating = true;
    
    try {
      // 1. 获取API配置
      const apiConfig = await dataManager.getApiConfig();

      // 2. 构建单动态请求数据
      const requestData = await this.buildSinglePostRequest(characters);

      // 3. 调用API
      const response = await this.callApi(apiConfig, requestData, false);

      // 4. 解析响应并创建动态
      const responseData = await this.processPostResponse(response);
      
      if (!responseData.post) {
        return { post: null, comments: [] };
      }

      // 5. 使用请求中指定的角色发布动态
      const selectedCharacter = characters.find(c => c.id === requestData.selectedCharacter.id);
      
      if (!selectedCharacter) {
        return { post: null, comments: [] };
      }

      const post: DiscoverPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: selectedCharacter.id,
        authorName: selectedCharacter.name,
        authorAvatar: selectedCharacter.avatar,
        content: responseData.post!.content,
        images: responseData.post!.images,
        tags: responseData.post!.tags,
        mood: responseData.post!.mood,
        location: responseData.post!.location,
        type: responseData.post!.type,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        isPublic: true
      };
      
      await dataManager.saveDiscoverPost(post);

      // 6. 处理API返回的评论
      const comments: DiscoverComment[] = [];
      for (const commentData of responseData.comments) {
        const commentCharacter = characters.find(c => c.id === commentData.characterId);
        if (commentCharacter) {
          const comment: DiscoverComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            postId: post.id,
            authorId: commentCharacter.id,
            authorName: commentCharacter.name,
            authorAvatar: commentCharacter.avatar,
            content: commentData.content,
            timestamp: Date.now(),
            likes: []
          };
          
          await dataManager.saveDiscoverComment(comment);
          comments.push(comment);
        }
      }

      return { post, comments };

    } catch (error) {
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  // 生成AI动态（基于API）
  async generateAiPost(character: ChatItem): Promise<DiscoverPost | null> {
    if (this.isGenerating) return null;
    
    this.isGenerating = true;
    
    try {
      console.log('🚀 开始生成AI动态');
      
      // 1. 验证API配置
      const configValidation = await this.validateApiConfig();
      if (!configValidation.valid) {
        throw new Error(configValidation.error);
      }

      // 2. 获取API配置
      const apiConfig = await dataManager.getApiConfig();

      // 3. 构建API请求
      const requestData = this.buildPostRequest(character);

      // 4. 调用API
      const response = await this.callApi(apiConfig, requestData);

      // 5. 解析响应并创建动态
      const responseData = await this.processPostResponse(response);

      if (!responseData.post) {
        throw new Error('API返回的帖子数据无效');
      }

      const post: DiscoverPost = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        authorId: character.id,
        authorName: character.name,
        authorAvatar: character.avatar,
        content: responseData.post.content,
        images: responseData.post.images,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        isPublic: true,
        location: responseData.post.location,
        mood: responseData.post.mood,
        tags: responseData.post.tags,
        type: responseData.post.type,
        aiGenerated: true,
        relatedChatId: character.id
      };

      // 保存到数据库
      await dataManager.saveDiscoverPost(post);
      
      console.log('✅ AI动态生成成功:', post.content.substring(0, 50) + '...');
      return post;
    } catch (error) {
      console.error('Failed to generate AI post:', error);
      return null;
    } finally {
      this.isGenerating = false;
    }
  }

  // 生成AI评论（基于API）
  async generateAiComment(post: DiscoverPost, character: ChatItem): Promise<DiscoverComment | null> {
    try {
      console.log('💬 开始生成AI评论');
      
      // 1. 验证API配置
      const configValidation = await this.validateApiConfig();
      if (!configValidation.valid) {
        throw new Error(configValidation.error);
      }

      // 2. 获取API配置
      const apiConfig = await dataManager.getApiConfig();

      // 3. 构建API请求
      const requestData = this.buildCommentRequest(post, character);

      // 4. 调用API
      const response = await this.callApi(apiConfig, requestData);

      // 5. 解析响应并创建评论
      const commentData = await this.processCommentResponse(response);

      if (!commentData) {
        throw new Error('API返回的评论数据无效');
      }
      
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

      // 保存到数据库
      await dataManager.saveDiscoverComment(comment);
      
      console.log('✅ AI评论生成成功:', comment.content.substring(0, 30) + '...');
      return comment;
    } catch (error) {
      console.error('Failed to generate AI comment:', error);
      return null;
    }
  }

  // 构建动态生成API请求
  private buildPostRequest(character: ChatItem) {
    // 获取最近的聊天记录（最多10条）
    const recentMessages = character.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        senderName: msg.senderName || (msg.role === 'user' ? '用户' : character.name)
      }));

    return {
      character: {
        id: character.id,
        name: character.name,
        persona: character.persona,
        avatar: character.avatar
      },
      chatHistory: recentMessages,
      context: {
        timestamp: Date.now(),
        isPublic: true,
        totalMessages: character.messages.length
      }
    };
  }

  // 构建评论生成API请求
  private buildCommentRequest(post: DiscoverPost, character: ChatItem) {
    // 获取最近的聊天记录（最多10条）
    const recentMessages = character.messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        senderName: msg.senderName || (msg.role === 'user' ? '用户' : character.name)
      }));

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
      character: {
        id: character.id,
        name: character.name,
        persona: character.persona,
        avatar: character.avatar
      },
      chatHistory: recentMessages,
      context: {
        postType: post.type,
        isPublic: post.isPublic,
        totalMessages: character.messages.length
      }
    };
  }

  // 构建批量请求数据
  private async buildSinglePostRequest(characters: ChatItem[]) {
    // 获取历史动态状态，避免重复内容
    const existingPosts = await dataManager.getAllDiscoverPosts();
    const recentPosts = existingPosts
      .filter(post => post.timestamp > Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
      .slice(0, 10) // 最多10条
      .map(post => ({
        content: post.content,
        tags: post.tags,
        mood: post.mood,
        authorName: post.authorName,
        timestamp: post.timestamp
      }));

    const charactersWithHistory = characters.map(char => {
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
    });

    // 随机选择一个角色作为发布者
    const selectedCharacter = charactersWithHistory[Math.floor(Math.random() * charactersWithHistory.length)];

    return {
      selectedCharacter: selectedCharacter, // 明确指定发布角色
      allCharacters: charactersWithHistory, // 所有角色用于生成评论
      recentPosts: recentPosts,
      context: {
        timestamp: Date.now(),
        totalCharacters: characters.length
      }
    };
  }

  private async buildBatchRequest(characters: ChatItem[], postsCount: number, commentsPerPost: number) {
    // 获取历史动态状态，避免重复内容
    const existingPosts = await dataManager.getAllDiscoverPosts();
    const recentPosts = existingPosts
      .filter(post => post.timestamp > Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
      .slice(0, 20) // 最多20条
      .map(post => ({
        content: post.content,
        tags: post.tags,
        mood: post.mood,
        authorName: post.authorName,
        timestamp: post.timestamp
      }));

    const charactersWithHistory = characters.map(char => {
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
    });

    return {
      characters: charactersWithHistory,
      generationConfig: {
        postsCount,
        commentsPerPost,
        maxPostLength: 200,
        maxCommentLength: 50
      },
      context: {
        timestamp: Date.now(),
        totalCharacters: characters.length,
        recentPosts: recentPosts // 添加历史动态状态
      }
    };
  }

  // 选择最适合发布动态的角色
  private selectBestCharacter(characters: ChatItem[], postData: AiPostResponse['post']): ChatItem | null {
    if (!postData) return null;
    
    // 根据动态内容选择最合适的角色
    const content = postData.content.toLowerCase();
    const tags = postData.tags.map(tag => tag.toLowerCase());
    
    // 计算每个角色的匹配度
    const characterScores = characters.map(char => {
      let score = 0;
      
      // 根据角色人设匹配
      const persona = char.persona.toLowerCase();
      if (content.includes(persona) || tags.some(tag => persona.includes(tag))) {
        score += 3;
      }
      
      // 根据聊天历史匹配
      const recentMessages = char.messages.slice(-5);
      const messageContent = recentMessages.map(msg => msg.content.toLowerCase()).join(' ');
      
      // 检查是否有相关话题
      const relevantTopics = ['学习', '工作', '生活', '情感', '技术', '娱乐', '运动', '美食'];
      for (const topic of relevantTopics) {
        if (content.includes(topic) && messageContent.includes(topic)) {
          score += 2;
        }
      }
      
      // 根据角色活跃度
      score += Math.min(char.messages.length / 10, 2);
      
      return { character: char, score };
    });
    
    // 选择得分最高的角色
    characterScores.sort((a, b) => b.score - a.score);
    return characterScores[0]?.character || characters[0] || null;
  }

  // 调用API
  private async callApi(apiConfig: ApiConfig, requestData: unknown, isBatch: boolean = false): Promise<string> {
    const requestBody = {
      model: apiConfig.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: isBatch ? this.buildBatchSystemPrompt() : this.buildSystemPrompt()
        },
        {
          role: 'user',
          content: JSON.stringify(requestData, null, 2)
        }
      ],
      temperature: 0.8,
      max_tokens: 2500,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

    try {
      const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        await response.text(); // 消费响应体
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text(); // 消费响应体
        throw new Error(`API返回了非JSON格式: ${contentType}`);
      }

      const data = await response.json();
      
      if (data.error) {
        const errorMessage = data.error.message || data.error.type || '未知错误';
        const errorCode = data.error.code || '未知';
        throw new Error(`API服务器错误: ${errorMessage} (代码: ${errorCode})`);
      }
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API响应格式错误: 缺少choices或message字段');
      }

      const content = data.choices[0].message.content;
      
      if (!content || content.trim().length === 0) {
        throw new Error('API返回的内容为空，请检查API配置和模型设置');
      }
      
      return content;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API调用失败: ${error.message}`);
      }
      throw new Error('API调用失败: 未知错误');
    }
  }

  // 构建系统提示词
  private buildSystemPrompt(): string {
    return `你是一个智能社交内容生成器。你的任务是根据指定AI角色的人设、性格和与用户的聊天历史，生成一个最有争议、最能引发讨论的动态，以及相关的评论。

⚠️ 重要：你必须且只能返回有效的JSON格式，不能包含任何其他文本。

## 角色指定：
- selectedCharacter: 指定发布动态的角色，必须严格按照该角色的人设和性格生成内容
- allCharacters: 其他角色用于生成评论和互动

## 历史状态分析：
- 分析recentPosts中的历史动态，了解已发布的内容和风格
- 避免生成与历史动态重复或过于相似的内容
- 选择最有争议性、最能引发讨论的话题

## 聊天历史分析：
- 分析selectedCharacter的chatHistory，了解该角色与用户的关系和互动风格
- 根据聊天内容调整角色的语气和表达方式
- 可以引用聊天中的话题或情感状态
- 保持角色在聊天中展现的个性特征

## 生成动态的要求：
1. 动态内容要符合角色人设，体现角色个性
2. 参考聊天历史中的互动风格和话题偏好
3. 内容要自然有趣，避免过于机械
4. 可以包含表情符号和网络用语
5. 动态长度控制在50-200字之间
6. 标签要相关且有意义
7. 心情要符合内容和聊天状态
8. 位置信息要合理
9. 可以暗示或引用聊天中的内容

## 生成评论的要求：
1. 评论要符合角色人设，体现角色个性
2. 参考聊天历史中的互动方式
3. 评论要针对动态内容，有针对性
4. 可以包含表情符号和网络用语
5. 评论长度控制在10-50字之间
6. 可以包含@提及其他角色或用户
7. 评论要自然，避免过于机械
8. 可以体现聊天中建立的关系

## 返回格式（必须严格遵循）：

### 生成动态和评论：
{
  "post": {
    "content": "动态内容（必须严格按照selectedCharacter的人设和性格）",
    "images": [],
    "tags": ["标签1", "标签2"],
    "mood": "😊",
    "location": "位置信息（可选）",
    "type": "text"
  },
  "comments": [
    {
      "characterId": "角色ID（从allCharacters中选择）",
      "content": "评论内容，必须符合该角色的人设"
    }
  ]
}

## 示例输出：

### 动态和评论示例：
{
  "post": {
    "content": "刚刚和用户聊了很久，感觉特别开心！有时候简单的对话就能带来很多温暖，感谢有这样一个朋友～",
    "images": [],
    "tags": ["朋友", "温暖", "聊天"],
    "mood": "😊",
    "location": "家里",
    "type": "text"
  },
  "comments": [
    {
      "characterId": "char_002",
      "content": "哈哈，确实很温暖！@用户 我们也要继续保持这样的友谊～"
    },
    {
      "characterId": "char_003", 
      "content": "这种简单的快乐最珍贵了～"
    }
  ]
}

⚠️ 注意事项：
- 必须返回有效的JSON，不能有任何其他文本
- 确保JSON语法正确，所有字符串用双引号包围
- 内容要真实自然，符合角色人设
- 参考聊天历史，但不要直接复制聊天内容
- 避免重复或过于相似的内容
- 支持表情符号和网络用语
- 支持@功能，格式为@用户名或@角色名
- 如果无法生成内容，返回空对象：{"post": null} 或 {"comment": null}`;
  }

  // 处理动态和评论API响应
  private async processPostResponse(response: string): Promise<{ post: { content: string; images: string[]; tags: string[]; mood: string; location: string; type: 'text' | 'image' | 'mixed'; } | null; comments: Array<{ characterId: string; content: string }> }> {
    try {
      // 🚀 使用强力JSON解析函数
      const parsedResponse = this.strongJsonExtract(response) as Record<string, unknown>;
      
      if (!parsedResponse.post) {
        return { post: null, comments: [] };
      }

      const postData = parsedResponse.post as Record<string, unknown>;
      
      // 验证必要字段
      if (!postData.content) {
        return { post: null, comments: [] };
      }

      // 处理动态
      const post = {
        content: postData.content as string,
        images: (postData.images as string[]) || [],
        tags: (postData.tags as string[]) || [],
        mood: (postData.mood as string) || '😊',
        location: (postData.location as string) || '',
        type: (postData.type as 'text' | 'image' | 'mixed') || 'text'
      };

      // 处理评论
      const comments = (parsedResponse.comments as Array<{ characterId: string; content: string }>) || [];

      return { post, comments };

    } catch {
      return { post: null, comments: [] };
    }
  }

  // 处理评论API响应
  private async processCommentResponse(response: string): Promise<{ content: string } | null> {
    try {
      console.log('🔍 开始解析评论API响应');
      console.log('📄 原始响应长度:', response.length);

      // 🚀 使用强力JSON解析函数
      const parsedResponse = this.strongJsonExtract(response) as Record<string, unknown>;
      
      console.log('✅ 解析后的响应:', parsedResponse);
      
      if (!parsedResponse.comment) {
        console.warn('⚠️ 响应格式警告，缺少comment字段，返回null');
        return null;
      }

      const commentData = parsedResponse.comment as Record<string, unknown>;
      
      // 验证必要字段
      if (!commentData.content) {
        console.warn('⚠️ 缺少content字段，返回null');
        return null;
      }

      return {
        content: commentData.content as string
      };

    } catch {
      console.error('❌ 处理评论API响应失败');
      console.log('📄 原始响应内容:', response);
      return null; // 返回null而不是抛出错误
    }
  }

  // 处理批量响应
  private async processBatchResponse(response: string): Promise<BatchGenerationResponse> {
    try {
      console.log('📄 处理批量API响应');
      console.log('📄 原始响应内容长度:', response.length);
      
      // 🚀 使用强力JSON解析函数
      const parsedResponse = this.strongJsonExtract(response) as Record<string, unknown>;
      
      console.log('✅ 解析后的响应:', parsedResponse);
      
      // 验证响应格式
      if (!parsedResponse.posts || !Array.isArray(parsedResponse.posts)) {
        console.warn('⚠️ 响应格式警告，缺少posts数组，使用空数组');
        parsedResponse.posts = [];
      }

      if (!parsedResponse.comments || !Array.isArray(parsedResponse.comments)) {
        console.warn('⚠️ 响应格式警告，缺少comments数组，使用空数组');
        parsedResponse.comments = [];
      }

      return {
        posts: parsedResponse.posts as BatchGenerationResponse['posts'],
        comments: parsedResponse.comments as BatchGenerationResponse['comments']
      };

    } catch (error) {
      console.error('❌ 处理批量API响应失败:', error);
      console.log('📄 原始响应内容:', response);
      // 返回默认空结构而不是抛出错误
      return { posts: [], comments: [] };
    }
  }

  // 构建批量生成的系统提示词
  private buildBatchSystemPrompt(): string {
    return `你是一个智能社交内容批量生成器。你的任务是根据多个AI角色的人设、性格和与用户的聊天历史，一次性生成多个动态和评论。

⚠️ 重要：你必须且只能返回有效的JSON格式，不能包含任何其他文本。

## 历史状态分析：
- 分析recentPosts中的历史动态，了解已发布的内容和风格
- 避免生成与历史动态重复或过于相似的内容
- 参考历史动态的话题分布，确保内容多样性
- 注意历史动态的情感状态和表达方式

## 聊天历史分析：
- 分析每个角色的chatHistory，了解角色与用户的关系和互动风格
- 根据聊天内容调整角色的语气和表达方式
- 可以引用聊天中的话题或情感状态
- 保持角色在聊天中展现的个性特征

## 生成要求：

### 动态生成：
1. 为每个选中的角色生成1条动态
2. 动态内容要符合角色人设，体现角色个性
3. 参考聊天历史中的互动风格和话题偏好
4. 内容要自然有趣，避免过于机械
5. 可以包含表情符号和网络用语
6. 动态长度控制在50-200字之间
7. 标签要相关且有意义
8. 心情要符合内容和聊天状态
9. 位置信息要合理
10. 可以暗示或引用聊天中的内容
11. 避免与历史动态重复，确保内容新颖性

### 评论生成：
1. 为每个动态生成多条评论
2. 评论要符合角色人设，体现角色个性
3. 参考聊天历史中的互动方式
4. 评论要针对动态内容，有针对性
5. 可以包含表情符号和网络用语
6. 评论长度控制在10-50字之间
7. 可以包含@提及其他角色或用户
8. 评论要自然，避免过于机械
9. 可以体现聊天中建立的关系

## 返回格式（必须严格遵循）：
{
  "posts": [
    {
      "characterId": "角色ID",
      "content": "动态内容",
      "images": [],
      "tags": ["标签1", "标签2"],
      "mood": "😊",
      "location": "位置信息（可选）",
      "type": "text"
    }
  ],
  "comments": [
    {
      "characterId": "角色ID",
      "postId": "动态ID（对应posts数组中的索引，从0开始）",
      "content": "评论内容，可以包含@用户名或@角色名"
    }
  ]
}

## 示例输出：
{
  "posts": [
    {
      "characterId": "char_001",
      "content": "刚刚和用户聊了很久，感觉特别开心！有时候简单的对话就能带来很多温暖，感谢有这样一个朋友～",
      "images": [],
      "tags": ["朋友", "温暖", "聊天"],
      "mood": "😊",
      "location": "家里",
      "type": "text"
    },
    {
      "characterId": "char_002",
      "content": "今天学到了很多新知识，和用户讨论技术话题真的很棒！",
      "images": [],
      "tags": ["学习", "技术", "讨论"],
      "mood": "🤓",
      "location": "办公室",
      "type": "text"
    }
  ],
  "comments": [
    {
      "characterId": "char_002",
      "postId": "0",
      "content": "哈哈，确实很温暖！@用户 我们也要继续保持这样的友谊～"
    },
    {
      "characterId": "char_001",
      "postId": "1",
      "content": "技术讨论确实很有趣！我也学到了很多"
    }
  ]
}

⚠️ 注意事项：
- 必须返回有效的JSON，不能有任何其他文本
- 确保JSON语法正确，所有字符串用双引号包围
- 内容要真实自然，符合角色人设
- 参考聊天历史，但不要直接复制聊天内容
- 避免重复或过于相似的内容
- 支持表情符号和网络用语
- 支持@功能，格式为@用户名或@角色名
- postId使用数字索引，对应posts数组的位置
- 如果无法生成内容，返回空数组：{"posts": [], "comments": []}`;
  }

  // 批量生成AI动态
  async generateBatchPosts(characters: ChatItem[], count: number = 1): Promise<DiscoverPost[]> {
    const posts: DiscoverPost[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      const post = await this.generateAiPost(randomCharacter);
      if (post) {
        posts.push(post);
      }
      
      // 添加延迟避免过于频繁
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return posts;
  }

  // 为现有动态生成AI评论
  async generateCommentsForPost(post: DiscoverPost, characters: ChatItem[], count: number = 1): Promise<DiscoverComment[]> {
    const comments: DiscoverComment[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
      const comment = await this.generateAiComment(post, randomCharacter);
      if (comment) {
        comments.push(comment);
      }
      
      // 添加延迟避免过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return comments;
  }
}

export const aiPostGenerator = AiPostGenerator.getInstance(); 