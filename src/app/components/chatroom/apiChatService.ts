// API版本的聊天服务 - 可选升级方案
import { ChatMessage, ChatUser } from './types';

const API_BASE = '/api/chatroom';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  remainingTime?: number;
}

// 获取所有消息和用户
export async function fetchChatData(): Promise<{ messages: ChatMessage[]; users: ChatUser[] }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result: ApiResponse<{ messages: ChatMessage[]; users: ChatUser[] }> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error || '获取数据失败');
    }
  } catch (error) {
    console.error('获取聊天数据失败:', error);
    throw error;
  }
}

// 发送消息
export async function sendMessage(
  nickname: string, 
  content: string, 
  userId: string
): Promise<{ message: ChatMessage; user: ChatUser }> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname,
        content,
        userId
      }),
    });
    
    const result: ApiResponse<{ message: ChatMessage; user: ChatUser }> = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      if (response.status === 429) {
        // 发送频率限制
        throw new Error(result.error || '发送太频繁，请稍后再试');
      }
      throw new Error(result.error || '发送消息失败');
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
}

// 更新用户信息
export async function updateUser(
  userId: string, 
  nickname: string
): Promise<ChatUser> {
  try {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        nickname
      }),
    });
    
    const result: ApiResponse<{ user: ChatUser }> = await response.json();
    
    if (result.success && result.data) {
      return result.data.user;
    } else {
      throw new Error(result.error || '更新用户信息失败');
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}

// 混合服务 - 优先使用API，降级到localStorage
export class HybridChatService {
  private useApi: boolean = true;
  
  constructor(useApi: boolean = true) {
    this.useApi = useApi;
  }
  
  // 切换到localStorage模式
  switchToLocalStorage() {
    this.useApi = false;
    console.log('聊天服务已切换到localStorage模式');
  }
  
  // 获取聊天数据
  async getChatData(): Promise<{ messages: ChatMessage[]; users: ChatUser[] }> {
    if (this.useApi) {
      try {
        return await fetchChatData();
      } catch (error) {
        console.warn('API调用失败，切换到localStorage模式:', error);
        this.switchToLocalStorage();
        // 降级到localStorage
        const { loadChatData } = await import('./chatService');
        return loadChatData();
      }
    } else {
      const { loadChatData } = await import('./chatService');
      return loadChatData();
    }
  }
  
  // 发送消息
  async sendMessage(nickname: string, content: string, user: ChatUser): Promise<ChatMessage> {
    if (this.useApi) {
      try {
        const result = await sendMessage(nickname, content, user.id);
        return result.message;
      } catch (error) {
        console.warn('API发送消息失败，切换到localStorage模式:', error);
        this.switchToLocalStorage();
        // 降级到localStorage
        const { addMessage } = await import('./chatService');
        return addMessage(content, user);
      }
    } else {
      const { addMessage } = await import('./chatService');
      return addMessage(content, user);
    }
  }
  
  // 获取或创建用户
  async getOrCreateUser(nickname: string): Promise<ChatUser> {
    if (this.useApi) {
      try {
        // 生成临时用户ID
        const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const user = await updateUser(userId, nickname);
        return user;
      } catch (error) {
        console.warn('API创建用户失败，切换到localStorage模式:', error);
        this.switchToLocalStorage();
        // 降级到localStorage
        const { getOrCreateUser } = await import('./chatService');
        return getOrCreateUser(nickname);
      }
    } else {
      const { getOrCreateUser } = await import('./chatService');
      return getOrCreateUser(nickname);
    }
  }
}

// 默认导出混合服务实例
export const hybridChatService = new HybridChatService(false); // 默认使用localStorage
