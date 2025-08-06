// 通知类型定义

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  duration?: number; // 自动移除时间（毫秒）
  autoRemove?: boolean; // 是否自动移除
  timestamp: number;
  action?: NotificationAction;
  data?: Record<string, unknown>; // 额外数据
}

// 通知配置
export interface NotificationConfig {
  maxNotifications?: number; // 最大显示数量
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  animation?: 'slide' | 'fade' | 'scale';
  sound?: boolean; // 是否播放提示音
  vibration?: boolean; // 是否震动（移动端）
}

// 聊天消息通知数据
export interface ChatMessageNotification {
  characterId: string;
  characterName: string;
  message: string;
  chatId: string;
  timestamp: number;
}

// 动态通知数据
export interface PostNotification {
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

// 评论通知数据
export interface CommentNotification {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
} 