// 公共聊天室API端点
// 当前版本使用文件系统存储，将来可以升级为数据库存储

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'chatroom-messages.json');
const USERS_FILE = path.join(DATA_DIR, 'chatroom-users.json');

// 类型定义
interface ChatMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  createdAt: string;
}

interface ChatUser {
  id: string;
  nickname: string;
  lastMessageTime: number;
}

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 读取消息数据
async function readMessages(): Promise<ChatMessage[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 读取用户数据
async function readUsers(): Promise<ChatUser[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 写入消息数据
async function writeMessages(messages: ChatMessage[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

// 写入用户数据
async function writeUsers(users: ChatUser[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 验证昵称
function validateNickname(nickname: string): { valid: boolean; error?: string } {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: '昵称不能为空' };
  }
  
  if (nickname.trim().length > 20) {
    return { valid: false, error: '昵称不能超过20个字符' };
  }
  
  if (nickname.trim().length < 2) {
    return { valid: false, error: '昵称至少需要2个字符' };
  }
  
  const specialChars = /[<>{}[\]\\\/\|`~!@#$%^&*()+=;:'"?]/;
  if (specialChars.test(nickname)) {
    return { valid: false, error: '昵称不能包含特殊字符' };
  }
  
  return { valid: true };
}

// 检查用户是否可以发送消息（30秒间隔限制）
function canUserSendMessage(user: ChatUser): boolean {
  const now = Date.now();
  const timeSinceLastMessage = now - user.lastMessageTime;
  return timeSinceLastMessage >= 30000; // 30秒
}

// GET: 获取聊天消息和用户列表
export async function GET() {
  try {
    const messages = await readMessages();
    const users = await readUsers();
    
    // 清理7天前的用户数据
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter((user: ChatUser) => 
      user.lastMessageTime > sevenDaysAgo
    );
    
    if (activeUsers.length !== users.length) {
      await writeUsers(activeUsers);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        messages: messages.sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp),
        users: activeUsers
      }
    });
  } catch (error) {
    console.error('获取聊天数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取聊天数据失败' },
      { status: 500 }
    );
  }
}

// POST: 发送新消息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, content, userId } = body;
    
    // 验证输入
    if (!nickname || !content || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 验证昵称
    const nicknameValidation = validateNickname(nickname);
    if (!nicknameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nicknameValidation.error },
        { status: 400 }
      );
    }
    
    // 验证消息内容
    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '消息内容不能为空' },
        { status: 400 }
      );
    }
    
    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: '消息内容不能超过500个字符' },
        { status: 400 }
      );
    }
    
    // 读取现有数据
    const messages = await readMessages();
    const users = await readUsers();
    
    // 查找或创建用户
    let user = users.find((u: ChatUser) => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        nickname: nickname.trim(),
        lastMessageTime: 0
      };
      users.push(user);
    }
    
    // 检查发送间隔
    if (!canUserSendMessage(user)) {
      const remainingTime = Math.ceil((30000 - (Date.now() - user.lastMessageTime)) / 1000);
      return NextResponse.json(
        { 
          success: false, 
          error: `请等待 ${remainingTime} 秒后再发送消息`,
          remainingTime 
        },
        { status: 429 }
      );
    }
    
    // 创建新消息
    const message = {
      id: generateId(),
      nickname: nickname.trim(),
      content: content.trim(),
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    // 更新用户最后发送时间
    user.lastMessageTime = Date.now();
    user.nickname = nickname.trim(); // 更新昵称
    
    // 添加消息
    messages.push(message);
    
    // 限制消息数量，只保留最近1000条
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }
    
    // 保存数据
    await writeMessages(messages);
    await writeUsers(users);
    
    return NextResponse.json({
      success: true,
      data: {
        message,
        user
      }
    });
    
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      { success: false, error: '发送消息失败' },
      { status: 500 }
    );
  }
}

// PUT: 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nickname } = body;
    
    if (!userId || !nickname) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 验证昵称
    const nicknameValidation = validateNickname(nickname);
    if (!nicknameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nicknameValidation.error },
        { status: 400 }
      );
    }
    
    // 读取用户数据
    const users = await readUsers();
    
    // 查找或创建用户
    let user = users.find((u: ChatUser) => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        nickname: nickname.trim(),
        lastMessageTime: 0
      };
      users.push(user);
    } else {
      user.nickname = nickname.trim();
    }
    
    // 保存数据
    await writeUsers(users);
    
    return NextResponse.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户信息失败' },
      { status: 500 }
    );
  }
}
