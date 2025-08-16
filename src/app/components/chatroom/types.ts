// 公共聊天室相关类型定义
export interface ChatMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  createdAt: string;
}

export interface ChatUser {
  id: string;
  nickname: string;
  lastMessageTime: number; // 用于30秒间隔限制
}

export interface ChatRoomState {
  messages: ChatMessage[];
  users: ChatUser[];
  currentUser: ChatUser | null;
  isConnected: boolean;
  lastRefresh: number;
}
