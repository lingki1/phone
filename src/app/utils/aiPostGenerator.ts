// AI动态生成器
import { dataManager } from './dataManager';
import { DiscoverPost, DiscoverComment } from '../types/discover';
import { ChatItem } from '../types/chat';

export class AiPostGenerator {
  private static instance: AiPostGenerator;
  private isGenerating = false;

  static getInstance(): AiPostGenerator {
    if (!AiPostGenerator.instance) {
      AiPostGenerator.instance = new AiPostGenerator();
    }
    return AiPostGenerator.instance;
  }

  // 生成AI动态
  async generateAiPost(character: ChatItem): Promise<DiscoverPost | null> {
    if (this.isGenerating) return null;
    
    this.isGenerating = true;
    
    try {
      // 基于角色人设生成动态内容
      const content = this.generatePostContent(character);
      const images = this.generatePostImages(character);
      const tags = this.generatePostTags(character);
      const mood = this.generatePostMood(character);
      const location = this.generatePostLocation(character);

      const post: DiscoverPost = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        authorId: character.id,
        authorName: character.name,
        authorAvatar: character.avatar,
        content,
        images,
        timestamp: Date.now(),
        likes: [],
        comments: [],
        isPublic: true,
        location,
        mood,
        tags,
        type: images.length > 0 ? (content ? 'mixed' : 'image') : 'text',
        aiGenerated: true,
        relatedChatId: character.id
      };

      // 保存到数据库
      await dataManager.saveDiscoverPost(post);
      
      return post;
    } catch (error) {
      console.error('Failed to generate AI post:', error);
      return null;
    } finally {
      this.isGenerating = false;
    }
  }

  // 生成AI评论
  async generateAiComment(post: DiscoverPost, character: ChatItem): Promise<DiscoverComment | null> {
    try {
      const content = this.generateCommentContent(post, character);
      
      const comment: DiscoverComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        postId: post.id,
        authorId: character.id,
        authorName: character.name,
        authorAvatar: character.avatar,
        content,
        timestamp: Date.now(),
        likes: [],
        aiGenerated: true
      };

      // 保存到数据库
      await dataManager.saveDiscoverComment(comment);
      
      return comment;
    } catch (error) {
      console.error('Failed to generate AI comment:', error);
      return null;
    }
  }

  // 生成动态内容
  private generatePostContent(character: ChatItem): string {
    const persona = character.persona.toLowerCase();
    const responses = [
      '今天心情不错，想和大家分享一些想法～',
      '刚刚经历了一件有趣的事情，忍不住想记录下来',
      '生活总是充满惊喜，今天也不例外',
      '有时候静下心来思考，会发现很多美好的事情',
      '今天学到了新东西，感觉收获满满',
      '和朋友聊天总是能带来很多启发',
      '生活中的小确幸，值得被记住',
      '今天天气很好，心情也跟着变好了',
      '有时候独处也是一种享受',
      '分享快乐，快乐就会加倍'
    ];

    // 根据角色人设调整内容
    if (persona.includes('活泼') || persona.includes('开朗')) {
      responses.push('哈哈，今天又是充满活力的一天！');
      responses.push('和大家分享一个有趣的小故事～');
    }
    
    if (persona.includes('温柔') || persona.includes('体贴')) {
      responses.push('希望大家今天都能感受到温暖');
      responses.push('温柔地对待每一天，生活也会温柔地对待你');
    }
    
    if (persona.includes('智慧') || persona.includes('思考')) {
      responses.push('思考人生，感悟生活');
      responses.push('每一次思考都是一次成长');
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 生成动态图片
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generatePostImages(_character: ChatItem): string[] {
    // 简单的图片生成逻辑，实际项目中可以接入AI图片生成API
    const imageUrls = [
      '/images/ai-post-1.jpg',
      '/images/ai-post-2.jpg',
      '/images/ai-post-3.jpg'
    ];
    
    // 30%的概率包含图片
    if (Math.random() < 0.3) {
      const randomImage = imageUrls[Math.floor(Math.random() * imageUrls.length)];
      return [randomImage];
    }
    
    return [];
  }

  // 生成动态标签
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generatePostTags(_character: ChatItem): string[] {
    const allTags = [
      '生活', '心情', '分享', '日常', '感悟', '思考', '快乐', '温暖', '成长', '学习',
      '朋友', '聊天', '天气', '独处', '小确幸', '活力', '温柔', '智慧', '人生', '生活感悟'
    ];
    
    const tagCount = Math.floor(Math.random() * 3) + 1; // 1-3个标签
    const selectedTags: string[] = [];
    
    while (selectedTags.length < tagCount) {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!selectedTags.includes(randomTag)) {
        selectedTags.push(randomTag);
      }
    }
    
    return selectedTags;
  }

  // 生成心情
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generatePostMood(_character: ChatItem): string {
    const moods = ['😊', '😄', '🤔', '😌', '😍', '🤗', '😎', '🥰', '😇', '🤩'];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  // 生成位置
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generatePostLocation(_character: ChatItem): string {
    const locations = [
      '家里', '公司', '咖啡厅', '公园', '图书馆', '健身房', '商场', '学校', '工作室', '户外'
    ];
    
    // 50%的概率有位置信息
    if (Math.random() < 0.5) {
      return locations[Math.floor(Math.random() * locations.length)];
    }
    
    return '';
  }

  // 生成评论内容
  private generateCommentContent(post: DiscoverPost, character: ChatItem): string {
    const persona = character.persona.toLowerCase();
    const responses = [
      '真不错！',
      '支持一下～',
      '很有意思呢',
      '点赞！',
      '分享得很棒',
      '感谢分享',
      '学到了',
      '很有想法',
      '不错不错',
      '继续加油！',
      '说得对',
      '深有感触',
      '同感',
      '很有道理',
      '值得思考'
    ];

    // 根据角色人设调整评论
    if (persona.includes('活泼') || persona.includes('开朗')) {
      responses.push('哈哈，太有趣了！');
      responses.push('我也这么觉得～');
    }
    
    if (persona.includes('温柔') || persona.includes('体贴')) {
      responses.push('很温暖的想法');
      responses.push('说得真好');
    }
    
    if (persona.includes('智慧') || persona.includes('思考')) {
      responses.push('很有深度的思考');
      responses.push('值得深思');
    }

    return responses[Math.floor(Math.random() * responses.length)];
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return comments;
  }
}

export const aiPostGenerator = AiPostGenerator.getInstance(); 