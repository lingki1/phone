// 公共聊天室相关类型定义
export interface ChatMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  createdAt: string;
  isMarked?: boolean; // 是否被标记为待办事项
  markedBy?: string; // 标记者的昵称
  markedAt?: number; // 标记时间
}

export interface ChatUser {
  id: string;
  nickname: string;
  lastMessageTime: number; // 用于30秒间隔限制
  isAdmin?: boolean;
}

export interface TodoItem {
  id: string;
  messageId: string; // 关联的消息ID
  content: string; // 待办事项内容
  createdBy: string; // 创建者昵称
  createdAt: number; // 创建时间
  isCompleted: boolean; // 是否已完成
  completedBy?: string; // 完成者昵称
  completedAt?: number; // 完成时间
}

export interface ChatRoomState {
  messages: ChatMessage[];
  users: ChatUser[];
  currentUser: ChatUser | null;
  isConnected: boolean;
  lastRefresh: number;
  todos: TodoItem[]; // 待办事项列表
}
