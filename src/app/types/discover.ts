// 动态功能相关类型定义

// 动态内容类型
export interface DiscoverPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images?: string[]; // 图片URL数组
  timestamp: number;
  likes: string[]; // 点赞用户ID数组
  comments: DiscoverComment[];
  isPublic: boolean; // 是否公开
  location?: string; // 位置信息
  mood?: string; // 心情
  tags?: string[]; // 标签
  type: 'text' | 'image' | 'mixed'; // 动态类型
  aiGenerated?: boolean; // 是否为AI生成
  relatedChatId?: string; // 关联的聊天ID
  relatedWorldBookIds?: string[]; // 关联的世界书ID
  isNew?: boolean; // 是否为新动态（用户未查看过）
}

// 评论类型
export interface DiscoverComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  likes: string[]; // 评论点赞
  replies?: DiscoverComment[]; // 回复评论
  parentCommentId?: string; // 父评论ID
  replyTo?: string; // 回复目标评论ID
  aiGenerated?: boolean; // 是否为AI生成
  isNew?: boolean; // 是否为新评论（用户未查看过）
}

// 动态设置类型
export interface DiscoverSettings {
  autoGeneratePosts: boolean; // 是否自动生成AI动态
  autoGenerateInterval: number; // 自动生成间隔（分钟）
  maxPostsPerDay: number; // 每日最大动态数
  allowAiComments: boolean; // 是否允许AI评论
  allowAiLikes: boolean; // 是否允许AI点赞
  privacyLevel: 'public' | 'friends' | 'private'; // 隐私级别
  notifyOnNewPosts: boolean; // 新动态通知
  theme: string; // 动态主题
}

// AI角色动态生成配置
export interface AiPostConfig {
  characterId: string;
  characterName: string;
  characterAvatar: string;
  persona: string;
  postFrequency: number; // 发动态频率（小时）
  lastPostTime: number;
  preferredTopics: string[]; // 偏好话题
  interactionStyle: 'friendly' | 'formal' | 'casual' | 'enthusiastic';
  maxPostsPerDay: number;
  isActive: boolean;
}

// 动态统计信息
export interface DiscoverStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  activeUsers: number;
  popularPosts: string[]; // 热门动态ID
  trendingTopics: string[]; // 热门话题
}

// 动态过滤器
export interface DiscoverFilter {
  type?: 'all' | 'text' | 'image' | 'mixed';
  authorId?: string;
  timeRange?: 'today' | 'week' | 'month' | 'all';
  tags?: string[];
  hasImages?: boolean;
  aiGenerated?: boolean;
}

// 动态排序选项
export type DiscoverSort = 'latest' | 'popular' | 'trending' | 'mostLiked' | 'mostCommented';

// 动态预览信息
export interface DiscoverPostPreview {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageCount: number;
  likeCount: number;
  commentCount: number;
  timestamp: number;
  isLiked: boolean;
}

// 动态通知类型
export interface DiscoverNotification {
  id: string;
  type: 'like' | 'comment' | 'new_post' | 'mention';
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  relatedCommentId?: string;
}

// 动态搜索历史
export interface DiscoverSearchHistory {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
}

// 动态草稿
export interface DiscoverDraft {
  id: string;
  content: string;
  images: string[];
  isPublic: boolean;
  location?: string;
  mood?: string;
  tags: string[];
  lastSaved: number;
}

// 用户查看状态
export interface DiscoverViewState {
  userId: string;
  lastViewedTimestamp: number; // 用户最后查看动态的时间戳
  lastViewedPostId?: string; // 用户最后查看的动态ID
  newPostsCount: number; // 新动态数量
  newCommentsCount: number; // 新评论数量
  lastUpdated: number; // 最后更新时间
} 