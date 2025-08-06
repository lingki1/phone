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

    // 启动自动生成动态
    if (settings.autoGeneratePosts) {
      await this.startPostGeneration(settings.autoGenerateInterval);
    }

    // 启动自动生成评论
    if (settings.allowAiComments) {
      await this.startCommentGeneration();
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
    
    const generatePost = async () => {
      try {
        const chats = await dataManager.getAllChats();
        const aiCharacters = chats.filter(chat => !chat.isGroup);
        
        if (aiCharacters.length > 0) {
          console.log('📝 自动生成AI动态');
          const result = await aiPostGenerator.generateSinglePostWithComments(aiCharacters);
          if (result.post) {
            console.log('✅ 自动生成动态成功:', result.post.content.substring(0, 50) + '...');
            
            // 触发动态更新事件
            window.dispatchEvent(new CustomEvent('aiPostGenerated', {
              detail: { post: result.post, comments: result.comments }
            }));
          }
        }
      } catch (error) {
        console.error('❌ 自动生成动态失败:', error);
      }
    };

    // 立即执行一次
    await generatePost();
    
    // 设置定时器
    this.postInterval = setInterval(generatePost, intervalMinutes * 60 * 1000);
  }

  // 启动评论生成
  private async startCommentGeneration() {
    console.log('💬 启动自动生成评论');
    
    const generateComments = async () => {
      try {
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
          await aiCommentService.generateCommentsForPost(randomPost);
        }
      } catch (error) {
        console.error('❌ 自动生成评论失败:', error);
      }
    };

    // 设置定时器，每5分钟检查一次
    this.commentInterval = setInterval(generateComments, 5 * 60 * 1000);
  }

  // 检查服务状态
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

export const autoGenerationService = AutoGenerationService.getInstance(); 