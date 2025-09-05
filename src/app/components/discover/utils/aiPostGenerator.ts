// AI动态生成器 - 基于API的智能内容生成
import { dataManager } from '../../../utils/dataManager';
import { avatarManager } from '../../../utils/avatarManager';
import { presetManager } from '../../../utils/presetManager';
import { DiscoverPost, DiscoverComment } from '../../../types/discover';
import { ChatItem } from '../../../types/chat';
import { ApiConfig } from '../../../types/chat';
import { JsonParser } from './jsonParser';

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
  private cachedApiConfig: ApiConfig | null = null;
  private configCacheTime = 0;
  private readonly CACHE_DURATION = 5000; // 5秒缓存

  static getInstance(): AiPostGenerator {
    if (!AiPostGenerator.instance) {
      AiPostGenerator.instance = new AiPostGenerator();
    }
    return AiPostGenerator.instance;
  }

  constructor() {
    // 监听API配置变更事件
    if (typeof window !== 'undefined') {
      window.addEventListener('apiConfigChanged', () => {
        console.log('🔄 AI动态生成器 - 检测到API配置变更，清空缓存');
        this.cachedApiConfig = null;
        this.configCacheTime = 0;
      });
    }
  }

  // 获取API配置（带缓存和实时刷新）
  private async getApiConfig(): Promise<ApiConfig> {
    const now = Date.now();
    
    // 如果缓存存在且未过期，使用缓存
    if (this.cachedApiConfig && (now - this.configCacheTime) < this.CACHE_DURATION) {
      return this.cachedApiConfig;
    }
    
    // 从数据库获取最新配置
    try {
      const apiConfig = await dataManager.getApiConfig();
      console.log('🔄 AI动态生成器 - 从数据库获取API配置:', {
        proxyUrl: apiConfig.proxyUrl ? '已设置' : '未设置',
        apiKey: apiConfig.apiKey ? '已设置' : '未设置',
        model: apiConfig.model || '未设置'
      });
      
      // 更新缓存
      this.cachedApiConfig = apiConfig;
      this.configCacheTime = now;
      
      return apiConfig;
    } catch (error) {
      console.error('🔄 AI动态生成器 - 获取API配置失败:', error);
      // 如果数据库失败，返回空配置
      return { proxyUrl: '', apiKey: '', model: '' };
    }
  }

  // 使用统一的JSON解析器
  private strongJsonExtract(raw: string): Record<string, unknown> {
    return JsonParser.strongJsonExtract(raw);
  }

  // 获取当前预设配置（带回退）
  private async getCurrentPreset() {
    try {
      await dataManager.initDB();
    } catch {}
    const preset = await presetManager.getCurrentPreset();
    if (preset) return preset;
    try {
      return await dataManager.getDefaultPreset();
    } catch {
      return null;
    }
  }

  // 根据预设构建API参数
  private buildApiParamsFromPreset(preset: Partial<{ temperature: number; maxTokens: number; topP: number; frequencyPenalty: number; presencePenalty: number; topK?: number; stopSequences?: string[]; logitBias?: Record<string, number>; responseFormat?: 'text' | 'json_object'; seed?: number; user?: string; }>) {
    if (!preset) return {} as {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
      top_k?: number;
      stop?: string[];
      logit_bias?: Record<string, number>;
      response_format?: { type: 'text' | 'json_object' };
      seed?: number;
      user?: string;
    };
    const params: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
      top_k?: number;
      stop?: string[];
      logit_bias?: Record<string, number>;
      response_format?: { type: 'text' | 'json_object' };
      seed?: number;
      user?: string;
    } = {
      temperature: preset.temperature ?? 0.8,
      max_tokens: preset.maxTokens ?? 2000,
      top_p: preset.topP ?? 0.8,
      frequency_penalty: preset.frequencyPenalty ?? 0.0,
      presence_penalty: preset.presencePenalty ?? 0.0
    };
    if (preset.topK !== undefined) params.top_k = preset.topK;
    if (preset.stopSequences && preset.stopSequences.length > 0) params.stop = preset.stopSequences;
    if (preset.logitBias && Object.keys(preset.logitBias).length > 0) params.logit_bias = preset.logitBias;
    if (preset.responseFormat) params.response_format = { type: preset.responseFormat } as { type: 'text' | 'json_object' };
    if (preset.seed !== undefined) params.seed = preset.seed;
    if (preset.user) params.user = preset.user;
    return params;
  }

  // 构建物品清单（礼物等）
  private async buildItemInventoryForChat(chatId: string) {
    try {
      await dataManager.initDB();
      const transactions = await dataManager.getTransactionsByChatId(chatId);
      type ParsedItem = {
        id: string;
        name: string;
        description: string;
        quantity: number;
        receivedAt: number;
        fromUser: string;
        shippingMethod: 'instant' | 'fast' | 'slow';
      };
      const parsedItems: ParsedItem[] = [];
      for (const tx of transactions) {
        try {
          if (!tx.message || typeof tx.message !== 'string') continue;
          const parsed = JSON.parse(tx.message);
          if (parsed && parsed.kind === 'gift_purchase' && Array.isArray(parsed.items)) {
            for (const item of parsed.items) {
              parsedItems.push({
                id: item.productId,
                name: item.name,
                description: `来自${tx.fromUser}的礼物`,
                quantity: item.quantity,
                receivedAt: tx.timestamp,
                fromUser: tx.fromUser,
                shippingMethod: parsed.shippingMethod || 'instant'
              });
            }
          }
        } catch {}
      }
      // 合并同类项
      const map = new Map<string, ParsedItem>();
      for (const it of parsedItems) {
        const key = it.id;
        if (map.has(key)) {
          const existed = map.get(key)!;
          existed.quantity += it.quantity;
          if (it.receivedAt > existed.receivedAt) {
            existed.receivedAt = it.receivedAt;
            existed.fromUser = it.fromUser;
            existed.shippingMethod = it.shippingMethod;
          }
        } else {
          map.set(key, { ...it });
        }
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  }



  // 🚀 新增：批量生成所有内容（优化API使用）
  async generateBatchContent(
    characters: ChatItem[], 
    postsCount: number = 3, 
    commentsPerPost: number = 2
  ): Promise<{ posts: DiscoverPost[]; comments: DiscoverComment[] }> {
    if (this.isGenerating) {
      console.log('⚠️ AI生成器正忙，跳过批量生成');
      return { posts: [], comments: [] };
    }
    
    this.isGenerating = true;
    const startTime = Date.now();
    
    try {
      console.log('🚀 开始批量生成内容');
      
      // 1. 获取API配置（使用带缓存的方法）
      const apiConfig = await this.getApiConfig();

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
          // 注册AI角色头像到全局头像管理器
          const characterAvatarId = avatarManager.generateAvatarId('character', character.id);
          await avatarManager.registerAvatar(characterAvatarId, character.avatar);

          const post: DiscoverPost = {
            id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            authorId: character.id,
            authorName: character.name,
            authorAvatarId: characterAvatarId,
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
          // 注册AI角色头像到全局头像管理器
          const characterAvatarId = avatarManager.generateAvatarId('character', character.id);
          await avatarManager.registerAvatar(characterAvatarId, character.avatar);

          const comment: DiscoverComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            postId: post.id,
            authorId: character.id,
            authorName: character.name,
            authorAvatarId: characterAvatarId,
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

      const duration = Date.now() - startTime;
      console.log(`✅ 批量生成完成 (耗时: ${Math.round(duration/1000)}秒): ${posts.length}个动态, ${comments.length}条评论`);
      return { posts, comments };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ 批量生成失败 (耗时: ${Math.round(duration/1000)}秒):`, error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  // 生成单个最有争议的动态和评论
  async generateSinglePostWithComments(characters: ChatItem[]): Promise<{ post: DiscoverPost | null; comments: DiscoverComment[] }> {
    if (this.isGenerating) {
      console.log('⚠️ AI生成器正忙，跳过单个动态生成');
      return { post: null, comments: [] };
    }
    
    this.isGenerating = true;
    const startTime = Date.now();
    
    try {
      console.log('🚀 开始生成单个动态和评论');
      
      // 1. 获取API配置和设置（使用带缓存的方法）
      const [apiConfig, settings] = await Promise.all([
        this.getApiConfig(),
        dataManager.getDiscoverSettings()
      ]);

      // 2. 构建单动态请求数据
      const requestData = await this.buildSinglePostRequest(characters);

      // 3. 调用API
      const response = await this.callApi(apiConfig, requestData, false);

      // 4. 解析响应并创建动态
      const responseData = await this.processPostResponse(response);
      
      if (!responseData.post) {
        const duration = Date.now() - startTime;
        console.log(`⚠️ 单个动态生成返回空结果 (耗时: ${Math.round(duration/1000)}秒)`);
        return { post: null, comments: [] };
      }

      // 5. 使用请求中指定的角色发布动态
      const selectedCharacter = characters.find(c => c.id === requestData.selectedCharacter.id);
      
      if (!selectedCharacter) {
        const duration = Date.now() - startTime;
        console.log(`⚠️ 未找到指定角色 (耗时: ${Math.round(duration/1000)}秒)`);
        return { post: null, comments: [] };
      }

      const post: DiscoverPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        authorId: selectedCharacter.id,
        authorName: selectedCharacter.name,
        authorAvatarId: avatarManager.generateAvatarId('character', selectedCharacter.id),
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

      // 6. 处理API返回的评论（检查角色隔离设置）
      const comments: DiscoverComment[] = [];
      for (const commentData of responseData.comments) {
        const commentCharacter = characters.find(c => c.id === commentData.characterId);
        if (commentCharacter) {
          // 角色隔离检查：如果开启隔离模式，AI角色不能评论其他AI角色的动态
          if (settings?.preventAiCrossComments && post.authorId !== 'user' && commentCharacter.id !== post.authorId) {
            console.log(`🚫 角色隔离：AI角色 ${commentCharacter.name} 不能评论其他AI角色的动态`);
            continue;
          }
          
          const comment: DiscoverComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            postId: post.id,
            authorId: commentCharacter.id,
            authorName: commentCharacter.name,
            authorAvatarId: avatarManager.generateAvatarId('character', commentCharacter.id),
            content: commentData.content,
            timestamp: Date.now(),
            likes: []
          };
          
          await dataManager.saveDiscoverComment(comment);
          comments.push(comment);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ 单个动态生成成功 (耗时: ${Math.round(duration/1000)}秒): "${post.content.substring(0, 50)}...", ${comments.length}条评论`);
      return { post, comments };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ 单个动态生成失败 (耗时: ${Math.round(duration/1000)}秒):`, error);
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
      
      // 1. 获取API配置（使用带缓存的方法）
      const apiConfig = await this.getApiConfig();

      // 3. 构建API请求
      const requestData = await this.buildPostRequest(character);

      // 4. 调用API
      const response = await this.callApi(apiConfig, requestData);

      // 5. 解析响应并创建动态
      const responseData = await this.processPostResponse(response);

      if (!responseData.post) {
        throw new Error('API返回的帖子数据无效');
      }

      // 注册AI角色头像到全局头像管理器
      const characterAvatarId = avatarManager.generateAvatarId('character', character.id);
      await avatarManager.registerAvatar(characterAvatarId, character.avatar);

      const post: DiscoverPost = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        authorId: character.id,
        authorName: character.name,
        authorAvatarId: characterAvatarId,
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
      
      // 1. 获取API配置（使用带缓存的方法）
      const apiConfig = await this.getApiConfig();

      // 3. 构建API请求
      const requestData = this.buildCommentRequest(post, character);

      // 4. 调用API
      const response = await this.callApi(apiConfig, requestData);

      // 5. 解析响应并创建评论
      const commentData = await this.processCommentResponse(response);

      if (!commentData) {
        throw new Error('API返回的评论数据无效');
      }
      
      // 注册AI角色头像到全局头像管理器
      const characterAvatarId = avatarManager.generateAvatarId('character', character.id);
      await avatarManager.registerAvatar(characterAvatarId, character.avatar);

      // 获取当前动态的最新评论时间戳，确保AI评论时间戳在其之后
      const existingComments = await dataManager.getDiscoverCommentsByPost(post.id);
      const latestCommentTimestamp = existingComments.length > 0 
        ? Math.max(...existingComments.map(c => c.timestamp))
        : Date.now();
      
      // AI评论的时间戳应该比最新评论晚1分钟，避免排序混乱
      const aiTimestamp = Math.max(Date.now(), latestCommentTimestamp + 60000);

      const comment: DiscoverComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        postId: post.id,
        authorId: character.id,
        authorName: character.name,
        authorAvatarId: characterAvatarId,
        content: commentData.content,
        timestamp: aiTimestamp,
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
  private async buildPostRequest(character: ChatItem) {
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

    // 注入状态与物品信息
    await dataManager.initDB();
    const status = await dataManager.getChatStatus(character.id);
    const items = await this.buildItemInventoryForChat(character.id);
    const preset = await this.getCurrentPreset();

    return {
      character: {
        id: character.id,
        name: character.name,
        persona: character.persona
      },
      chatHistory: recentMessages,
      status: status || undefined,
      items: items,
      preset: preset
        ? {
            name: preset.name,
            temperature: preset.temperature,
            maxTokens: preset.maxTokens,
            topP: preset.topP
          }
        : undefined,
      context: {
        timestamp: Date.now(),
        isPublic: true,
        totalMessages: character.messages.length
      }
    };
  }

  // 构建评论生成API请求
  private async buildCommentRequest(post: DiscoverPost, character: ChatItem) {
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

    await dataManager.initDB();
    const status = await dataManager.getChatStatus(character.id);
    const items = await this.buildItemInventoryForChat(character.id);
    const preset = await this.getCurrentPreset();

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
        persona: character.persona
      },
      chatHistory: recentMessages,
      status: status || undefined,
      items: items,
      preset: preset
        ? {
            name: preset.name,
            temperature: preset.temperature,
            maxTokens: preset.maxTokens,
            topP: preset.topP
          }
        : undefined,
      context: {
        postType: post.type,
        isPublic: post.isPublic,
        totalMessages: character.messages.length
      }
    };
  }

  // 构建批量请求数据
  private async buildSinglePostRequest(characters: ChatItem[]) {
    // 获取历史动态状态，避免重复内容 - 减少数据量
    const existingPosts = await dataManager.getAllDiscoverPosts();
    const recentPosts = existingPosts
      .filter(post => post.timestamp > Date.now() - 6 * 60 * 60 * 1000) // 最近6小时
      .slice(0, 5) // 最多5条
      .map(post => ({
        content: post.content.substring(0, 100), // 限制内容长度
        tags: (post.tags || []).slice(0, 3), // 最多3个标签
        mood: post.mood,
        authorName: post.authorName
      }));

    const charactersWithHistory = await Promise.all(characters.map(async (char) => {
      // 减少聊天历史数据量
      const recentMessages = char.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-5) // 只取最近5条
        .map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 50), // 限制消息长度
          senderName: msg.senderName || (msg.role === 'user' ? '用户' : char.name)
        }));

      const status = await dataManager.getChatStatus(char.id);

      return {
        id: char.id,
        name: char.name,
        persona: char.persona.substring(0, 200), // 限制人设长度
        // 不传输头像数据，避免请求体过大
        // avatar: char.avatar,
        chatHistory: recentMessages,
        totalMessages: char.messages.length,
        status: status || undefined
      };
    }));

    // 随机选择一个角色作为发布者
    const selectedCharacter = charactersWithHistory[Math.floor(Math.random() * charactersWithHistory.length)];

    const preset = await this.getCurrentPreset();

    // 为选定角色补充物品信息
    const selectedStatus = await dataManager.getChatStatus(selectedCharacter.id);
    const selectedItems = await this.buildItemInventoryForChat(selectedCharacter.id);

    return {
      selectedCharacter: selectedCharacter, // 明确指定发布角色
      allCharacters: charactersWithHistory, // 所有角色用于生成评论
      recentPosts: recentPosts,
      preset: preset
        ? {
            name: preset.name,
            temperature: preset.temperature,
            maxTokens: preset.maxTokens,
            topP: preset.topP
          }
        : undefined,
      status: selectedStatus || undefined,
      items: selectedItems,
      context: {
        timestamp: Date.now(),
        totalCharacters: characters.length
      }
    };
  }

  private async buildBatchRequest(characters: ChatItem[], postsCount: number, commentsPerPost: number) {
    // 获取历史动态状态，避免重复内容 - 减少数据量
    const existingPosts = await dataManager.getAllDiscoverPosts();
    const recentPosts = existingPosts
      .filter(post => post.timestamp > Date.now() - 6 * 60 * 60 * 1000) // 最近6小时
      .slice(0, 10) // 最多10条
      .map(post => ({
        content: post.content.substring(0, 80), // 限制内容长度
        tags: (post.tags || []).slice(0, 2), // 最多2个标签
        mood: post.mood,
        authorName: post.authorName
      }));

    const charactersWithHistory = await Promise.all(characters.map(async (char) => {
      // 减少聊天历史数据量
      const recentMessages = char.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-3) // 只取最近3条
        .map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 40), // 限制消息长度
          senderName: msg.senderName || (msg.role === 'user' ? '用户' : char.name)
        }));

      const status = await dataManager.getChatStatus(char.id);

      return {
        id: char.id,
        name: char.name,
        persona: char.persona.substring(0, 150), // 限制人设长度
        // 不传输头像数据，避免请求体过大
        // avatar: char.avatar,
        chatHistory: recentMessages,
        totalMessages: char.messages.length,
        status: status || undefined
      };
    }));

    const preset = await this.getCurrentPreset();

    return {
      characters: charactersWithHistory,
      generationConfig: {
        postsCount,
        commentsPerPost,
        maxPostLength: 200,
        maxCommentLength: 50
      },
      preset: preset
        ? {
            name: preset.name,
            temperature: preset.temperature,
            maxTokens: preset.maxTokens,
            topP: preset.topP
          }
        : undefined,
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
    // 根据模型调整参数
    const isGemini = apiConfig.model?.includes('gemini');
    const maxTokens = isGemini ? 8000 : (isBatch ? 6000 : 5000); // 增加token数量，避免内容截断
    const currentPreset = await this.getCurrentPreset();
    const presetParams = this.buildApiParamsFromPreset(currentPreset || {});
    
    type ChatRequestMessage = { role: 'system' | 'user'; content: string };
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
      response_format?: { type: 'text' | 'json_object' };
      seed?: number;
      user?: string;
    }

    const requestBody: ChatCompletionRequestBody = {
      model: apiConfig.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: isBatch ? this.buildBatchSystemPrompt() : this.buildSystemPrompt()
        },
        {
          role: 'user',
          content: JSON.stringify(requestData)
        }
      ],
      temperature: presetParams.temperature ?? (isGemini ? 0.7 : 0.8),
      max_tokens: presetParams.max_tokens ?? maxTokens,
      top_p: presetParams.top_p ?? (isGemini ? 0.8 : 0.9),
      frequency_penalty: presetParams.frequency_penalty ?? 0.1,
      presence_penalty: presetParams.presence_penalty ?? 0.1
    };

    // 可选API参数
    if ((presetParams as { top_k?: number }).top_k !== undefined) requestBody.top_k = (presetParams as { top_k?: number }).top_k;
    if ((presetParams as { stop?: string[] }).stop) requestBody.stop = (presetParams as { stop?: string[] }).stop;
    if (presetParams.logit_bias) requestBody.logit_bias = presetParams.logit_bias as Record<string, number>;
    if (presetParams.response_format) requestBody.response_format = presetParams.response_format as { type: 'text' | 'json_object' };
    if (presetParams.seed !== undefined) requestBody.seed = presetParams.seed as number;
    if (presetParams.user) requestBody.user = presetParams.user as string;

    // 检查请求体大小
    const requestBodySize = JSON.stringify(requestBody).length;
    console.log(`📊 请求体大小: ${requestBodySize} 字符`);
    console.log(`🤖 使用模型: ${requestBody.model}, max_tokens: ${maxTokens}`);
    
    // 🔍 详细记录请求体内容
    console.log('📤 完整请求体:', JSON.stringify(requestBody, null, 2));
    console.log('📤 请求体keys:', Object.keys(requestBody));
    console.log('📤 模型:', requestBody.model);
    console.log('📤 消息数量:', requestBody.messages.length);
    if (requestBody.messages) {
      requestBody.messages.forEach((msg: ChatRequestMessage, index: number) => {
        console.log(`📤 消息${index + 1} (${msg.role}):`, msg.content?.substring(0, 200) + (msg.content?.length > 200 ? '...' : ''));
      });
    }
    
    if (requestBodySize > 8000) { // 如果超过8KB，进一步压缩
      console.warn('⚠️ 请求体过大，进行压缩处理');
      // 简化请求数据
      const simplifiedData = this.simplifyRequestData(requestData);
      requestBody.messages[1].content = JSON.stringify(simplifiedData);
      
      // 记录压缩后的请求体
      console.log('📤 压缩后请求体:', JSON.stringify(requestBody, null, 2));
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
        console.log('📥 API完整响应数据:', JSON.stringify(data, null, 2));
        console.log('📥 响应数据类型:', typeof data);
        console.log('📥 响应数据keys:', Object.keys(data || {}));
        
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
        console.log('📄 原始消息内容:', content);
        console.log('📄 消息内容类型:', typeof content);
        console.log('📄 消息内容长度:', content ? content.length : 0);
        console.log('📄 finish_reason:', finishReason);
        
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
      
      // 简化历史动态
      if (simplified.recentPosts && Array.isArray(simplified.recentPosts)) {
        simplified.recentPosts = (simplified.recentPosts as Record<string, unknown>[]).slice(0, 3).map(post => ({
          content: ((post.content as string) || '').substring(0, 50),
          mood: post.mood as string,
          authorName: post.authorName as string
        }));
      }
      
      return simplified;
    }
    
    return data;
  }

  // 构建系统提示词
  private buildSystemPrompt(): string {
    return `你是智能社交内容生成器。根据AI角色人设和聊天历史，生成有争议的动态和评论。

⚠️ 必须返回有效JSON格式，不能包含其他文本。

## 要求：
- selectedCharacter: 发布动态的角色，按人设生成内容
- allCharacters: 其他角色生成评论
- 分析recentPosts避免重复内容
- 参考chatHistory调整语气和表达

## 动态要求：
- 符合角色人设，体现个性
- 自然有趣，50-200字
- 包含表情符号和网络用语
- 相关标签和心情

## 评论要求：
- 符合角色人设
- 针对动态内容，10-50字
- 支持@功能
- 自然表达

## 返回格式：
{
  "post": {
    "content": "动态内容",
    "images": [],
    "tags": ["标签1", "标签2"],
    "mood": "😊",
    "location": "位置",
    "type": "text"
  },
  "comments": [
    {
      "characterId": "角色ID",
      "content": "评论内容"
    }
  ]
}

⚠️ 注意：
- 返回有效JSON，双引号包围
- 内容真实自然，符合角色人设
- 支持@功能：@用户名或@角色名
- 无法生成时返回：{"post": null}`;
  }

  // 处理动态和评论API响应
  private async processPostResponse(response: string): Promise<{ post: { content: string; images: string[]; tags: string[]; mood: string; location: string; type: 'text' | 'image' | 'mixed'; } | null; comments: Array<{ characterId: string; content: string }> }> {
    try {
      console.log('🔍 开始处理动态API响应');
      console.log('📄 原始响应长度:', response.length);
      console.log('📄 原始响应预览:', response.substring(0, 300));
      
      // 🚀 使用强力JSON解析函数
      const parsedResponse = this.strongJsonExtract(response) as Record<string, unknown>;
      
      // 验证和清理解析结果
      const cleanedResponse = JsonParser.validateAndClean(parsedResponse);
      
      console.log('✅ 清理后的响应:', cleanedResponse);
      
      if (!cleanedResponse.post) {
        console.warn('⚠️ 响应中没有post字段');
        return { post: null, comments: [] };
      }

      const postData = cleanedResponse.post as Record<string, unknown>;
      
      // 验证必要字段
      if (!postData.content || typeof postData.content !== 'string') {
        console.warn('⚠️ post缺少有效的content字段');
        return { post: null, comments: [] };
      }

      // 处理动态，确保所有字段都有默认值
      const post = {
        content: String(postData.content).trim(),
        images: Array.isArray(postData.images) ? postData.images.filter(img => typeof img === 'string') : [],
        tags: Array.isArray(postData.tags) ? postData.tags.filter(tag => typeof tag === 'string') : [],
        mood: typeof postData.mood === 'string' ? postData.mood : '😊',
        location: typeof postData.location === 'string' ? postData.location : '',
        type: (postData.type === 'image' || postData.type === 'mixed') ? postData.type as 'image' | 'mixed' : 'text' as const
      };

      // 处理评论，确保数据格式正确
      let comments: Array<{ characterId: string; content: string }> = [];
      if (Array.isArray(cleanedResponse.comments)) {
        comments = cleanedResponse.comments
          .filter((comment: unknown) => {
            const c = comment as Record<string, unknown>;
            return c && typeof c.characterId === 'string' && typeof c.content === 'string';
          })
          .map((comment: unknown) => {
            const c = comment as Record<string, unknown>;
            return {
              characterId: String(c.characterId),
              content: String(c.content).trim()
            };
          });
      }

      console.log('✅ 处理完成，post内容:', post.content.substring(0, 50));
      console.log('✅ 评论数量:', comments.length);

      return { post, comments };

    } catch (error) {
      console.error('❌ 处理动态API响应失败:', error);
      console.log('📄 失败的原始响应:', response);
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
    return `你是智能社交内容批量生成器。根据多个AI角色人设和聊天历史，生成多个动态和评论。

⚠️ 必须返回有效JSON格式，不能包含其他文本。

## 要求：
- 分析recentPosts避免重复内容
- 参考chatHistory调整语气和表达
- 为每个角色生成1条动态
- 为每个动态生成多条评论

## 动态要求：
- 符合角色人设，体现个性
- 自然有趣，50-200字
- 包含表情符号和网络用语
- 相关标签和心情

## 评论要求：
- 符合角色人设
- 针对动态内容，10-50字
- 支持@功能
- 自然表达

## 返回格式：
{
  "posts": [
    {
      "characterId": "角色ID",
      "content": "动态内容",
      "images": [],
      "tags": ["标签1", "标签2"],
      "mood": "😊",
      "location": "位置",
      "type": "text"
    }
  ],
  "comments": [
    {
      "characterId": "角色ID",
      "postId": "动态ID（对应posts数组索引，从0开始）",
      "content": "评论内容"
    }
  ]
}

⚠️ 注意：
- 返回有效JSON，双引号包围
- 内容真实自然，符合角色人设
- 支持@功能：@用户名或@角色名
- postId使用数字索引，对应posts数组位置
- 无法生成时返回：{"posts": [], "comments": []}`;
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