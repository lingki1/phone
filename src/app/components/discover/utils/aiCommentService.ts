// AI评论服务 - 基于API的智能评论生成
import { dataManager } from '../../../utils/dataManager';
import { avatarManager } from '../../../utils/avatarManager';
import { presetManager } from '../../../utils/presetManager';
import { DiscoverPost, DiscoverComment } from '../../../types/discover';
import { ChatItem } from '../../../types/chat';
import { ApiConfig } from '../../../types/chat';
import { JsonParser } from './jsonParser';

export interface AiCommentResponse {
  success: boolean;
  comments: Array<{
    characterId: string;
    characterName: string;
    characterAvatarId?: string;
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



  // 生成AI评论（主要方法）
  async generateCommentsForPost(post: DiscoverPost): Promise<AiCommentResponse> {
    if (this.isProcessing) {
      return { success: false, comments: [], error: '正在处理中，请稍后重试' };
    }

    this.isProcessing = true;

    try {
      console.log('🚀 开始生成AI评论，跳过API配置验证');
      
      // 1. 获取API配置
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
      // 如果用户刚评论，生成较少的AI评论
      const maxCharacters = post.comments.length > 0 ? 2 : 3;
      const selectedCharacters = this.selectRelevantCharacters(aiCharacters, post, maxCharacters);

      // 5. 构建API请求
      const requestData = await this.buildApiRequest(post, userInfo, selectedCharacters);

      // 6. 调用API
      const response = await this.callApi(apiConfig, requestData);

      // 7. 解析响应并保存评论
      const comments = await this.processApiResponse(response, post, selectedCharacters);

      return {
        success: true,
        comments: comments.map(comment => ({
          characterId: comment.authorId,
          characterName: comment.authorName,
          characterAvatarId: comment.authorAvatarId,
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
    const existingComments = post.comments || [];

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

      // 优先选择与用户有聊天历史的角色（最高权重）
      if (character.messages.length > 0) {
        const recentMessages = character.messages.slice(-10);
        const userMessages = recentMessages.filter(msg => msg.role === 'user');
        if (userMessages.length > 0) {
          score += 10; // 有聊天历史的角色最高优先级
          
          // 根据聊天频率增加分数
          score += Math.min(userMessages.length * 2, 10);
          
          // 根据最近聊天时间增加分数
          const lastMessageTime = Math.max(...userMessages.map(m => m.timestamp));
          const timeDiff = Date.now() - lastMessageTime;
          if (timeDiff < 24 * 60 * 60 * 1000) { // 24小时内
            score += 5;
          }
        }
      }

      // 如果用户刚评论，进一步增加有互动历史的角色分数
      if (existingComments.length > 0) {
        const lastUserComment = existingComments.find(c => c.authorId === 'user');
        if (lastUserComment && character.messages.length > 0) {
          score += 8; // 用户刚评论时，有聊天历史的角色更优先
        }
      }

      // 避免选择已经评论过的角色
      const hasCommented = existingComments.some(c => c.authorId === character.id);
      if (hasCommented) {
        score -= 15; // 已经评论过的角色大幅降低优先级
      }

      // 根据角色在动态中的活跃度调整分数
      const recentActivity = character.messages.length;
      score += Math.min(recentActivity / 10, 3); // 活跃度加分，但不超过3分

      // 随机因素（确保多样性）
      score += Math.random() * 1;

      return { character, score };
    });

    // 按分数排序并选择前N个
    return scoredCharacters
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount)
      .map(item => item.character);
  }

  // 构建API请求数据
  private async buildApiRequest(
    post: DiscoverPost, 
    userInfo: { userNickname: string; userBio: string }, 
    characters: ChatItem[]
  ) {
    // 获取最近的5条动态（不包括当前动态）
    const allPosts = await dataManager.getAllDiscoverPosts();
    const recentPosts = allPosts
      .filter(p => p.id !== post.id) // 排除当前动态
      .sort((a, b) => b.timestamp - a.timestamp) // 按时间倒序
      .slice(0, 5); // 取最近5条

    // 为每个动态加载评论
    const recentPostsWithComments = await Promise.all(
      recentPosts.map(async (p) => {
        const comments = await dataManager.getDiscoverCommentsByPost(p.id);
        return {
          ...p,
          comments: comments
        };
      })
    );

    // 获取预设、为角色附加状态与物品
    await dataManager.initDB();
    const preset = await presetManager.getCurrentPreset();
    const charactersWithExtras = await Promise.all(characters.map(async (char) => {
      const status = await dataManager.getChatStatus(char.id);
      const items = await dataManager.getTransactionsByChatId(char.id);
      return { char, status, items };
    }));

    return {
      // 当前动态信息
      currentPost: {
        id: post.id,
        content: post.content,
        images: post.images,
        tags: post.tags,
        mood: post.mood,
        location: post.location,
        timestamp: post.timestamp,
        authorName: post.authorName,
        type: post.type,
        isPublic: post.isPublic,
        likes: post.likes
      },
      
      // 当前动态的现有评论（按时间排序，最新的在前）
      existingComments: post.comments
        .sort((a, b) => b.timestamp - a.timestamp) // 按时间倒序，最新的在前
        .map(comment => ({
          id: comment.id,
          authorId: comment.authorId,
          authorName: comment.authorName,
          content: comment.content,
          timestamp: comment.timestamp,
          aiGenerated: comment.aiGenerated,
          likes: comment.likes,
          replyTo: comment.replyTo
        })),
      
      // 用户最新评论（最高优先级）
      latestUserComment: post.comments
        .filter(comment => comment.authorId === 'user' && !comment.aiGenerated)
        .sort((a, b) => b.timestamp - a.timestamp)[0] || null,
      
      // 用户信息
      user: {
        id: 'user',
        name: userInfo.userNickname,
        bio: userInfo.userBio,
        avatar: '/avatars/user-avatar.png'
      },
      
      // 所有AI角色信息
      characters: characters.map(char => {
        // 获取最近的聊天记录（最多3条）
        const recentMessages = char.messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .slice(-3) // 减少到3条
          .map(msg => ({
            role: msg.role,
            content: msg.content.substring(0, 40), // 限制消息长度
            senderName: msg.senderName || (msg.role === 'user' ? '用户' : char.name)
          }));

        const extras = charactersWithExtras.find(x => x.char.id === char.id);

        return {
          id: char.id,
          name: char.name,
          persona: char.persona.substring(0, 150), // 限制人设长度
          // 不传输头像数据，避免请求体过大
          // avatar: char.avatar,
          chatHistory: recentMessages,
          totalMessages: char.messages.length,
          status: extras?.status || undefined,
          // 为简洁，仅注入礼物类交易的概要（名称与数量）
          items: (extras?.items || []).filter(tx => typeof tx.message === 'string' && tx.message.includes('gift_purchase')).slice(0, 10),
          // 添加角色在动态中的活跃度
          recentActivity: {
            postsCommented: recentPostsWithComments.filter(p => 
              p.comments.some(c => c.authorId === char.id)
            ).length,
            lastCommentTime: char.messages.length > 0 ? 
              Math.max(...char.messages.map(m => m.timestamp)) : 0
          }
        };
      }),
      
      // 最近的动态历史（提供上下文）
      recentPosts: recentPostsWithComments.map(p => ({
        id: p.id,
        content: p.content,
        authorName: p.authorName,
        timestamp: p.timestamp,
        type: p.type,
        mood: p.mood,
        location: p.location,
        tags: p.tags,
        likes: p.likes,
        comments: p.comments.map(c => ({
          authorId: c.authorId,
          authorName: c.authorName,
          content: c.content,
          timestamp: c.timestamp,
          aiGenerated: c.aiGenerated
        }))
      })),
      
      // 系统上下文
      preset: preset
        ? {
            name: preset.name,
            temperature: preset.temperature,
            maxTokens: preset.maxTokens,
            topP: preset.topP
          }
        : undefined,
      context: {
        totalCharacters: characters.length,
        currentPostType: post.type,
        isPublic: post.isPublic,
        hasExistingComments: post.comments.length > 0,
        commentCount: post.comments.length,
        recentPostsCount: recentPostsWithComments.length,
        systemTime: Date.now(),
        // 动态趋势分析
        trends: {
          popularTopics: this.extractPopularTopics(recentPostsWithComments),
          activeCharacters: characters
            .map(c => ({
              id: c.id,
              name: c.name,
              activityLevel: recentPostsWithComments.filter(p => 
                p.comments.some(comment => comment.authorId === c.id)
              ).length
            }))
            .sort((a, b) => b.activityLevel - a.activityLevel)
            .slice(0, 3)
        }
      }
    };
  }

  // 调用API
  private async callApi(apiConfig: ApiConfig, requestData: unknown): Promise<string> {
    console.log('🔍 AI评论服务 - 开始API调用');
    
    // 检查API配置
    if (!apiConfig.proxyUrl) {
      throw new Error('缺少API代理地址，请在设置中配置');
    }
    
    if (!apiConfig.apiKey) {
      throw new Error('缺少API密钥，请在设置中配置');
    }
    
    console.log('📡 API配置:', {
      proxyUrl: apiConfig.proxyUrl,
      model: apiConfig.model || 'gpt-3.5-turbo',
      hasApiKey: !!apiConfig.apiKey
    });

    // 根据模型调整参数
    const isGemini = apiConfig.model?.includes('gemini');
    const maxTokens = isGemini ? 4000 : 3000; // 增加token数量，避免内容截断

    // 注入预设映射为API参数
    const currentPreset = await presetManager.getCurrentPreset();
    type ChatRequestMessage = { role: 'system' | 'user'; content: string };
    type ResponseFormat = { type: 'text' | 'json_object' };
    interface ChatCompletionRequestBody {
      model: string;
      messages: ChatRequestMessage[];
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
      top_k?: number;
      stop?: string[];
      logit_bias?: Record<string, number>;
      response_format?: ResponseFormat;
      seed?: number;
      user?: string;
    }

    const presetParams: Partial<ChatCompletionRequestBody> = currentPreset ? {
      temperature: currentPreset.temperature,
      max_tokens: currentPreset.maxTokens,
      top_p: currentPreset.topP,
      frequency_penalty: currentPreset.frequencyPenalty,
      presence_penalty: currentPreset.presencePenalty
    } : {};

    const requestBody: ChatCompletionRequestBody = {
      model: apiConfig.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt()
        },
        {
          role: 'user',
          content: JSON.stringify(requestData)
        }
      ],
      temperature: presetParams.temperature ?? (isGemini ? 0.7 : 0.7),
      max_tokens: presetParams.max_tokens ?? maxTokens,
      top_p: presetParams.top_p ?? (isGemini ? 0.8 : 0.8),
      frequency_penalty: presetParams.frequency_penalty ?? 0.0,
      presence_penalty: presetParams.presence_penalty ?? 0.0
    };

    if (currentPreset) {
      if (currentPreset.topK !== undefined) requestBody.top_k = currentPreset.topK;
      if (currentPreset.stopSequences?.length) requestBody.stop = currentPreset.stopSequences;
      if (currentPreset.logitBias && Object.keys(currentPreset.logitBias).length) requestBody.logit_bias = currentPreset.logitBias;
      if (currentPreset.responseFormat) requestBody.response_format = { type: currentPreset.responseFormat as 'text' | 'json_object' };
      if (currentPreset.seed !== undefined) requestBody.seed = currentPreset.seed;
      if (currentPreset.user) requestBody.user = currentPreset.user;
    }

    // 检查请求体大小
    const requestBodySize = JSON.stringify(requestBody).length;
    console.log(`📊 请求体大小: ${requestBodySize} 字符`);
    console.log(`🤖 使用模型: ${requestBody.model}, max_tokens: ${maxTokens}`);

    // 🔍 详细记录请求体内容
    console.log('💬 完整请求体:', JSON.stringify(requestBody, null, 2));
    console.log('💬 请求体keys:', Object.keys(requestBody));
    console.log('💬 模型:', requestBody.model);
    console.log('💬 消息数量:', requestBody.messages.length);
    if (requestBody.messages) {
      requestBody.messages.forEach((msg: ChatRequestMessage, index: number) => {
        console.log(`💬 消息${index + 1} (${msg.role}):`, msg.content?.substring(0, 200) + (msg.content?.length > 200 ? '...' : ''));
      });
    }

    if (requestBodySize > 8000) { // 如果超过8KB，进一步压缩
      console.warn('⚠️ 请求体过大，进行压缩处理');
      // 简化请求数据
      const simplifiedData = this.simplifyRequestData(requestData);
      requestBody.messages[1].content = JSON.stringify(simplifiedData);
      
      // 记录压缩后的请求体
      console.log('💬 压缩后请求体:', JSON.stringify(requestBody, null, 2));
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 API调用尝试 ${attempt}/${maxRetries}`);
        
        const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
          // 添加超时设置，最多等待3分钟
          signal: AbortSignal.timeout(180000)
        });

        console.log(`📥 响应状态: ${response.status} ${response.statusText}`);

        if (response.status === 413) {
          throw new Error('请求内容过大，请减少输入数据');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API请求失败: ${response.status} ${response.statusText}`, errorText.substring(0, 200));
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('❌ 响应不是JSON格式:', contentType, responseText.substring(0, 200));
          throw new Error(`API返回了非JSON格式: ${contentType}`);
        }

        const data = await response.json();
        
        // 🔍 详细记录API响应数据
        console.log('💬 AI评论API完整响应数据:', JSON.stringify(data, null, 2));
        console.log('💬 响应数据类型:', typeof data);
        console.log('💬 响应数据keys:', Object.keys(data || {}));
        
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
        const finishReason = data.choices[0].finish_reason;
        
        // 🔍 详细记录消息内容
        console.log('💬 原始消息内容:', content);
        console.log('💬 消息内容类型:', typeof content);
        console.log('💬 消息内容长度:', content ? content.length : 0);
        console.log('💬 finish_reason:', finishReason);
        
        // 🚀 特殊处理Gemini 2.5 Pro的finish_reason: "length"情况
        if (finishReason === 'length' && (!content || content.trim().length === 0)) {
          console.warn('⚠️ Gemini模型达到token限制，尝试减少token限制重试');
          
          if (attempt < maxRetries) {
            // 减少token限制重试
            const reducedTokens = Math.floor(maxTokens * 0.7);
            console.log(`🔄 重试时减少max_tokens到: ${reducedTokens}`);
            
            // 简化请求数据以减少token消耗
            const simplifiedData = this.simplifyRequestData(requestData);
            
            // 继续下一次重试
            requestBody.max_tokens = reducedTokens;
            requestBody.messages[1].content = JSON.stringify(simplifiedData);
            continue;
          } else {
            throw new Error(`Gemini模型达到token限制，请尝试使用更简单的请求或更大的token限制`);
          }
        }
        
        if (!content || content.trim().length === 0) {
          throw new Error('API返回的内容为空，请检查API配置和模型设置');
        }
        
        console.log('✅ API调用成功');
        return content;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        // 特殊处理超时错误
        if (lastError.name === 'AbortError' || lastError.message.includes('timeout')) {
          console.error(`❌ API调用超时 (尝试 ${attempt}):`, lastError.message);
          if (attempt === maxRetries) {
            throw new Error('API调用超时，请检查网络连接或尝试使用更快的模型');
          }
        } else {
          console.error(`❌ 尝试 ${attempt} 失败:`, lastError.message);
        }
        
        if (attempt < maxRetries) {
          // 等待一段时间后重试
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`API调用失败 (${maxRetries} 次尝试): ${lastError?.message || '未知错误'}`);
  }

  // 简化请求数据以减少大小
  private simplifyRequestData(data: unknown): unknown {
    if (typeof data === 'object' && data !== null) {
      const simplified = data as Record<string, unknown>;
      
      // 简化角色数据
      if (simplified.characters && Array.isArray(simplified.characters)) {
        simplified.characters = (simplified.characters as Record<string, unknown>[]).map(char => ({
          id: char.id as string,
          name: char.name as string,
          persona: ((char.persona as string) || '').substring(0, 100),
          chatHistory: Array.isArray(char.chatHistory) ? char.chatHistory.slice(-2) : []
        }));
      }
      
      // 简化现有评论
      if (simplified.existingComments && Array.isArray(simplified.existingComments)) {
        simplified.existingComments = (simplified.existingComments as Record<string, unknown>[]).slice(0, 3).map(comment => ({
          authorName: comment.authorName as string,
          content: ((comment.content as string) || '').substring(0, 30)
        }));
      }
      
      return simplified;
    }
    
    return data;
  }

  // 构建系统提示词
  private buildSystemPrompt(): string {
    return `你是智能社交评论生成器。根据用户最新评论、动态主题、AI角色人设和历史互动，生成自然、有趣的评论。

⚠️ 必须返回有效JSON格式，不能包含其他文本。

## 核心任务：
针对用户最新评论生成回应，围绕动态主题，体现AI角色与用户的历史互动关系。

## 数据优先级：
1. 用户最新评论 (latestUserComment) - 最高优先级，必须直接回应
2. 动态主题 (currentPost) - 核心背景，所有评论围绕此展开
3. AI角色人设与历史互动 (characters) - 个性化基础
4. 评论历史 (existingComments) - 对话连续性
5. 动态历史 (recentPosts) - 背景参考
6. 系统趋势 (trends) - 补充信息

## 评论生成策略：
- 优先回应用户的最新评论内容
- 基于角色人设给出个性化回应
- 围绕动态主题展开讨论
- 体现角色与用户的关系发展

## 返回格式：
{
  "comments": [
    {
      "characterId": "角色ID",
      "content": "评论内容，优先回应用户最新评论，可以包含@用户名或@角色名",
      "tone": "评论语调（如：友好、幽默、思考等）",
      "intent": "评论意图（如：回应、赞同、讨论、安慰等）"
    }
  ]
}

⚠️ 注意事项：
- 返回有效JSON，双引号包围
- 优先回应用户的最新评论
- 围绕动态主题展开讨论
- 体现角色与用户的历史互动关系
- 评论要真实自然，符合角色人设
- 支持@功能，格式为@用户名或@角色名
- 评论长度控制在20-50字之间
- 如果无法生成评论，返回空的comments数组：{"comments": []}`;
  }

  // 处理API响应
  private async processApiResponse(
    response: string, 
    post: DiscoverPost, 
    characters: ChatItem[]
  ): Promise<DiscoverComment[]> {
    try {
      console.log('🔍 开始解析评论API响应');
      console.log('📄 原始响应长度:', response.length);
      console.log('📄 原始响应预览:', response.substring(0, 300));

      // 🚀 使用统一的强力JSON解析函数
      const parsedResponse = JsonParser.strongJsonExtract(response) as Record<string, unknown>;
      
      // 验证和清理解析结果
      const cleanedResponse = JsonParser.validateAndClean(parsedResponse);
      
      console.log('✅ 清理后的响应:', cleanedResponse);
      
      // 获取评论数组
      let commentsArray: unknown[] = [];
      
      if (Array.isArray(cleanedResponse.comments)) {
        commentsArray = cleanedResponse.comments;
        console.log('✅ 使用标准comments格式');
      } else {
        // 尝试查找任何包含comments的数组
        for (const key in cleanedResponse) {
          if (Array.isArray(cleanedResponse[key]) && key.toLowerCase().includes('comment')) {
            commentsArray = cleanedResponse[key] as unknown[];
            console.log(`✅ 找到comments数组在属性: ${key}`);
            break;
          }
        }
      }
      
      if (commentsArray.length === 0) {
        console.warn('⚠️ 响应中没有找到有效的评论数组');
        return [];
      }

      const comments: DiscoverComment[] = [];
      // 获取当前动态的最新评论时间戳，确保AI评论时间戳在其之后
      const existingComments = await dataManager.getDiscoverCommentsByPost(post.id);
      const latestCommentTimestamp = existingComments.length > 0 
        ? Math.max(...existingComments.map(c => c.timestamp))
        : Date.now();
      
      // AI评论的基础时间戳应该比最新评论晚1分钟，避免排序混乱
      const baseTimestamp = Math.max(Date.now(), latestCommentTimestamp + 60000);

      for (let i = 0; i < commentsArray.length; i++) {
        const commentData = commentsArray[i] as Record<string, unknown>;
        console.log('🔍 处理评论数据:', commentData);
        
        // 验证评论数据格式
        if (!commentData.characterId || !commentData.content || 
            typeof commentData.characterId !== 'string' || 
            typeof commentData.content !== 'string') {
          console.warn('⚠️ 跳过格式不正确的评论:', commentData);
          continue;
        }

        // 查找对应的角色
        const character = characters.find(c => c.id === commentData.characterId);
        if (!character) {
          console.warn('⚠️ 未找到角色:', commentData.characterId);
          continue;
        }

        // 创建评论对象，使用递增的时间戳确保最新的评论显示在最下方
        // 注册AI角色头像到全局头像管理器
        const characterAvatarId = avatarManager.generateAvatarId('character', character.id);
        await avatarManager.registerAvatar(characterAvatarId, character.avatar);

        const comment: DiscoverComment = {
          id: (baseTimestamp + i).toString() + Math.random().toString(36).substr(2, 9),
          postId: post.id,
          authorId: character.id,
          authorName: character.name,
          authorAvatarId: characterAvatarId,
          content: String(commentData.content).trim(),
          timestamp: baseTimestamp + i, // 递增时间戳，确保最新的评论显示在最下方
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
      console.error('❌ 处理评论API响应失败:', error);
      console.log('📄 失败的原始响应:', response);
      // 不抛出错误，返回空数组
      return [];
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

  // 提取热门话题
  private extractPopularTopics(posts: DiscoverPost[]): string[] {
    const topicCount: { [key: string]: number } = {};
    
    posts.forEach(post => {
      // 从内容中提取关键词
      const content = post.content.toLowerCase();
      const tags = post.tags || [];
      
      // 常见话题关键词
      const topics = [
        '学习', '工作', '生活', '心情', '朋友', '家人', '旅行', '美食',
        '运动', '音乐', '电影', '读书', '思考', '感悟', '分享', '快乐',
        '烦恼', '成长', '梦想', '目标', '计划', '回忆', '期待', '感谢'
      ];
      
      topics.forEach(topic => {
        if (content.includes(topic)) {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        }
      });
      
      // 从标签中提取话题
      tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        topicCount[tagLower] = (topicCount[tagLower] || 0) + 1;
      });
    });
    
    // 返回出现次数最多的5个话题
    return Object.entries(topicCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
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