// 自动生成服务 - 在后台持续运行
import { dataManager } from '../../../utils/dataManager';
import { aiPostGenerator } from './aiPostGenerator';
import { aiCommentService } from './aiCommentService';
import { DiscoverSettings } from '../../../types/discover';

class AutoGenerationService {
  private static instance: AutoGenerationService;
  private postInterval: NodeJS.Timeout | null = null;
  private commentInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): AutoGenerationService {
    if (!AutoGenerationService.instance) {
      AutoGenerationService.instance = new AutoGenerationService();
    }
    return AutoGenerationService.instance;
  }

  // 启动自动生成服务
  async start(settings: DiscoverSettings) {
    if (this.isRunning) {
      console.log('🔄 自动生成服务已在运行中');
      return;
    }

    console.log('🚀 启动自动生成服务');
    this.isRunning = true;

    // 启动自动生成动态（异步执行，不阻塞页面加载）
    if (settings.autoGeneratePosts) {
      this.startPostGeneration(settings.autoGenerateInterval);
    }

    // 启动自动生成评论（异步执行，不阻塞页面加载）
    if (settings.allowAiComments) {
      this.startCommentGeneration();
    }
  }

  // 停止自动生成服务
  stop() {
    console.log('🛑 停止自动生成服务');
    this.isRunning = false;

    if (this.postInterval) {
      clearInterval(this.postInterval);
      this.postInterval = null;
    }

    if (this.commentInterval) {
      clearInterval(this.commentInterval);
      this.commentInterval = null;
    }
  }

  // 更新设置并重启服务
  async updateSettings(settings: DiscoverSettings) {
    console.log('🔧 更新自动生成设置');
    
    // 先停止当前服务
    this.stop();
    
    // 重新启动服务
    await this.start(settings);
  }

  // 启动动态生成
  private async startPostGeneration(intervalMinutes: number) {
    console.log('📝 启动自动生成动态，间隔:', intervalMinutes, '分钟');
    
    // 添加生成状态跟踪
    let isGeneratingPost = false;
    
    const generatePost = async () => {
      // 防止并发生成
      if (isGeneratingPost) {
        console.log('⚠️ 上一个动态生成还在进行中，跳过本次生成');
        return;
      }
      
      isGeneratingPost = true;
      const startTime = Date.now();
      
      try {
        console.log('📝 开始自动生成AI动态');
        const chats = await dataManager.getAllChats();
        const aiCharacters = chats.filter(chat => !chat.isGroup);
        
        if (aiCharacters.length > 0) {
          const result = await aiPostGenerator.generateSinglePostWithComments(aiCharacters);
          if (result.post) {
            const duration = Date.now() - startTime;
            console.log(`✅ 自动生成动态成功 (耗时: ${Math.round(duration/1000)}秒):`, result.post.content.substring(0, 50) + '...');
            
            // 触发动态更新事件
            window.dispatchEvent(new CustomEvent('aiPostGenerated', {
              detail: { post: result.post, comments: result.comments }
            }));
          } else {
            console.log('⚠️ 自动生成动态返回空结果');
          }
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ 自动生成动态失败 (耗时: ${Math.round(duration/1000)}秒):`, error);
      } finally {
        isGeneratingPost = false;
      }
    };

    // 延迟10秒后执行第一次生成，避免阻塞页面加载
    setTimeout(() => {
      generatePost();
    }, 10000);
    
    // 设置定时器，确保间隔时间足够长
    const actualInterval = Math.max(intervalMinutes * 60 * 1000, 5 * 60 * 1000); // 最少5分钟间隔
    console.log(`📝 实际生成间隔: ${actualInterval / 60000} 分钟 (原设置: ${intervalMinutes} 分钟)`);
    this.postInterval = setInterval(generatePost, actualInterval);
  }

  // 启动评论生成
  private async startCommentGeneration() {
    console.log('💬 启动自动生成评论');
    
    // 添加生成状态跟踪
    let isGeneratingComment = false;
    
    const generateComments = async () => {
      // 防止并发生成
      if (isGeneratingComment) {
        console.log('⚠️ 上一个评论生成还在进行中，跳过本次生成');
        return;
      }
      
      isGeneratingComment = true;
      const startTime = Date.now();
      
      try {
        console.log('💬 开始自动生成AI评论');
        // 获取所有动态
        const allPosts = await dataManager.getAllDiscoverPosts();
        
        // 只处理用户发布的动态（非AI生成）
        const userPosts = allPosts.filter(post => 
          post.authorId === 'user' && !post.aiGenerated
        );
        
        if (userPosts.length > 0) {
          // 随机选择一个用户动态进行评论
          const randomPost = userPosts[Math.floor(Math.random() * userPosts.length)];
          
          console.log('💬 为用户动态生成AI评论:', randomPost.content.substring(0, 30) + '...');
          const result = await aiCommentService.generateCommentsForPost(randomPost);
          
          const duration = Date.now() - startTime;
          if (result.success) {
            console.log(`✅ 自动生成评论成功 (耗时: ${Math.round(duration/1000)}秒):`, result.comments.length, '条评论');
          } else {
            console.log(`⚠️ 自动生成评论失败 (耗时: ${Math.round(duration/1000)}秒):`, result.error);
          }
        } else {
          console.log('💬 没有用户动态可供评论');
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ 自动生成评论失败 (耗时: ${Math.round(duration/1000)}秒):`, error);
      } finally {
        isGeneratingComment = false;
      }
    };

    // 设置定时器，每10分钟检查一次（给足够时间避免冲突）
    this.commentInterval = setInterval(generateComments, 10 * 60 * 1000);
  }

  // 检查服务状态
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

export const autoGenerationService = AutoGenerationService.getInstance(); 