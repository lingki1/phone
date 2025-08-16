// 聊天室数据服务 - 基于API的服务端存储
import { ChatMessage, ChatUser } from './types';

const API_BASE = '/api/chatroom';

export interface ChatData {
  messages: ChatMessage[];
  users: ChatUser[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  remainingTime?: number;
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化时间戳
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// 检查用户是否可以发送消息（30秒间隔限制）
export function canUserSendMessage(user: ChatUser): boolean {
  const now = Date.now();
  const timeSinceLastMessage = now - user.lastMessageTime;
  return timeSinceLastMessage >= 30000; // 30秒
}

// 获取剩余等待时间（秒）
export function getRemainingWaitTime(user: ChatUser): number {
  const now = Date.now();
  const timeSinceLastMessage = now - user.lastMessageTime;
  const waitTime = 30000 - timeSinceLastMessage;
  return Math.max(0, Math.ceil(waitTime / 1000));
}

// 从服务器加载聊天数据
export async function loadChatData(): Promise<ChatData> {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: ApiResponse<ChatData> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error || '获取数据失败');
    }
  } catch (error) {
    console.error('加载聊天数据失败:', error);
    return {
      messages: [],
      users: []
    };
  }
}

// 发送新消息到服务器
export async function addMessage(content: string, user: ChatUser): Promise<ChatMessage> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: user.nickname,
        content: content.trim(),
        userId: user.id
      }),
    });
    
    const result: ApiResponse<{ message: ChatMessage; user: ChatUser }> = await response.json();
    
    if (result.success && result.data) {
      return result.data.message;
    } else {
      if (response.status === 429) {
        throw new Error(result.error || '发送太频繁，请稍后再试');
      }
      throw new Error(result.error || '发送消息失败');
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
}

// 获取所有消息
export async function getMessages(): Promise<ChatMessage[]> {
  const data = await loadChatData();
  return data.messages.sort((a, b) => a.timestamp - b.timestamp);
}

// 获取或创建用户
export async function getOrCreateUser(nickname: string): Promise<ChatUser> {
  try {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: generateId(),
        nickname: nickname.trim()
      }),
    });
    
    const result: ApiResponse<{ user: ChatUser }> = await response.json();
    
    if (result.success && result.data) {
      return result.data.user;
    } else {
      throw new Error(result.error || '创建用户失败');
    }
  } catch (error) {
    console.error('创建用户失败:', error);
    // 创建临时用户作为后备
    return {
      id: generateId(),
      nickname: nickname.trim(),
      lastMessageTime: 0
    };
  }
}

// 验证昵称
export function validateNickname(nickname: string): { valid: boolean; error?: string } {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: '昵称不能为空' };
  }
  
  if (nickname.trim().length > 20) {
    return { valid: false, error: '昵称不能超过20个字符' };
  }
  
  if (nickname.trim().length < 2) {
    return { valid: false, error: '昵称至少需要2个字符' };
  }
  
  // 检查是否包含特殊字符
  const specialChars = /[<>{}[\]\\\/\|`~!@#$%^&*()+=;:'"?]/;
  if (specialChars.test(nickname)) {
    return { valid: false, error: '昵称不能包含特殊字符' };
  }
  
  return { valid: true };
}

// 清理过期的用户数据（7天未活动）- 服务器端自动处理
export function cleanupOldUsers(): void {
  // 服务器端API会自动清理过期用户数据
  console.log('用户数据清理由服务器端自动处理');
}
