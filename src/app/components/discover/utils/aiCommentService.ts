// AI评论服务 - 基于API的智能评论生成
import { dataManager } from '../../../utils/dataManager';
import { DiscoverPost, DiscoverComment } from '../../../types/discover';
import { ChatItem } from '../../../types/chat';
import { ApiConfig } from '../../../types/chat';
import { JsonParser } from './jsonParser';

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

        return {
          id: char.id,
          name: char.name,
          persona: char.persona.substring(0, 150), // 限制人设长度
          // 不传输头像数据，避免请求体过大
          // avatar: char.avatar,
          chatHistory: recentMessages,
          totalMessages: char.messages.length,
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

    const requestBody = {
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
      temperature: 0.7,
      max_tokens: 1500, // 减少token数量
      top_p: 0.8,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    // 检查请求体大小
    const requestBodySize = JSON.stringify(requestBody).length;
    console.log(`📊 请求体大小: ${requestBodySize} 字符`);

    if (requestBodySize > 8000) { // 如果超过8KB，进一步压缩
      console.warn('⚠️ 请求体过大，进行压缩处理');
      // 简化请求数据
      const simplifiedData = this.simplifyRequestData(requestData);
      requestBody.messages[1].content = JSON.stringify(simplifiedData);
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
          body: JSON.stringify(requestBody)
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
        lastError = error instanceof Error ? error : new Error('未知错误');
        console.error(`❌ 尝试 ${attempt} 失败:`, lastError.message);
        
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
    return `你是一个智能社交评论生成器。你的任务是根据用户最新评论、动态主题、AI角色人设和历史互动，生成自然、有趣的评论。

⚠️ 重要：你必须且只能返回有效的JSON格式，不能包含任何其他文本。

## 🎯 核心任务说明：
你的主要任务是针对 **用户最新评论** 生成回应，同时围绕动态主题，并体现AI角色与用户的历史互动关系。

## 📊 数据优先级分析（按重要性排序）：

### 1. 🎯 用户最新评论 (latestUserComment) - 最高优先级
- **这是你要回应的主要对象**
- 分析用户评论的意图、情感和观点
- 理解用户想要表达的内容
- **AI评论必须直接回应用户的最新评论**

### 2. 🎯 动态主题 (currentPost) - 核心背景
- **这是评论的上下文基础**
- 分析动态内容、心情、位置、标签等
- 了解动态类型（文字、图片、混合）
- **所有评论都要围绕动态主题展开**

### 3. 🤖 AI角色人设与历史互动 (characters) - 个性化基础
- 每个角色的人设、性格特征
- 最近的聊天历史（10条）中的互动模式
- 角色与用户的关系发展
- 角色在动态中的活跃度和表现
- **用于确定评论的语气、风格和个性化表达**

### 4. 💬 评论历史 (existingComments) - 对话连续性
- 当前动态下的所有评论历史
- 了解评论的互动模式和话题发展
- 避免重复已有观点
- 保持对话的连贯性
- **这些是当前动态的评论，可以引用和回应**

### 5. 📚 动态历史 (recentPosts) - 背景参考
- 最近5条动态的内容和评论
- 了解话题趋势和角色活跃度
- 观察角色在不同动态中的表现
- **仅用于了解背景，不要直接引用**

### 6. 📊 系统趋势 (trends) - 补充信息
- 热门话题分析
- 活跃角色排名
- 动态互动模式
- **用于增加评论的相关性**

## 🎯 评论生成策略：

### 场景1：用户刚发表评论
- **优先回应用户的最新评论内容**
- 理解用户评论的意图和情感
- 基于角色人设给出个性化回应
- 围绕动态主题展开讨论

### 场景2：多轮评论互动
- **基于评论历史保持对话连贯性**
- 回应用户最新评论的同时引用历史互动
- 体现角色与用户的关系发展
- 避免重复已有观点

### 场景3：新动态初始评论
- **基于动态内容生成初始评论**
- 参考角色人设和聊天历史
- 体现角色个性特征
- 为后续互动奠定基础

## 🔄 历史互动整合策略：

### 1. 聊天历史分析
- 分析角色与用户的聊天记录
- 提取互动模式、共同话题、情感状态
- 在评论中体现这些历史关系

### 2. 动态互动分析
- 观察角色在之前动态中的表现
- 了解角色与用户的互动风格
- 保持角色行为的一致性

### 3. 关系发展追踪
- 基于历史互动调整评论的亲密程度
- 体现角色与用户关系的发展阶段
- 在评论中体现这种关系变化

## 🚫 重要限制：
- **必须优先回应用户的最新评论**
- **所有评论都要围绕动态主题**
- **体现角色与用户的历史互动关系**
- **不要评论其他动态的具体内容**
- **保持角色人设的一致性**

## 角色行为模式：
- 根据角色的recentActivity调整活跃度
- 参考chatHistory中的互动风格和话题
- 保持角色在动态中的一致性
- 基于历史互动调整评论的亲密程度

要求：
1. 必须返回严格的JSON格式
2. **优先回应用户的最新评论**
3. 评论要符合角色人设，体现角色个性
4. **围绕动态主题展开讨论**
5. **体现角色与用户的历史互动关系**
6. 评论内容要自然，避免过于机械
7. 可以包含@提及其他角色或用户
8. 评论长度控制在20-50字之间
9. 每个角色只能生成一条评论
10. 保持对话的连贯性和历史连续性

返回格式（必须严格遵循）：
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

示例输出：
{
  "comments": [
    {
      "characterId": "char_001",
      "content": "哈哈，@用户 说得对！就像我们之前聊天时说的那样，这个话题确实很有意思～",
      "tone": "友好",
      "intent": "回应"
    },
    {
      "characterId": "char_002", 
      "content": "确实，@用户 的观点很有见地。让我想起了我们之前讨论的类似话题，很有共鸣！",
      "tone": "思考",
      "intent": "赞同"
    }
  ]
}

⚠️ 注意事项：
- 必须返回有效的JSON，不能有任何其他文本
- 确保JSON语法正确，所有字符串用双引号包围
- **优先回应用户的最新评论**
- **围绕动态主题展开讨论**
- **体现角色与用户的历史互动关系**
- 评论要真实自然，符合角色人设
- 参考聊天历史和动态历史，但不要直接复制内容
- 避免重复或过于相似的评论
- 支持@功能，格式为@用户名或@角色名
- 如果无法生成评论，返回空的comments数组：{"comments": []}
- 保持角色在动态中的行为一致性`;
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
      const baseTimestamp = Date.now();

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
        const comment: DiscoverComment = {
          id: (baseTimestamp + i).toString() + Math.random().toString(36).substr(2, 9),
          postId: post.id,
          authorId: character.id,
          authorName: character.name,
          authorAvatar: character.avatar,
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