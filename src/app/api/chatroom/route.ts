// 公共聊天室API端点
// 当前版本使用文件系统存储，将来可以升级为数据库存储

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'chatroom-messages.json');
const USERS_FILE = path.join(DATA_DIR, 'chatroom-users.json');
const TODOS_FILE = path.join(DATA_DIR, 'chatroom-todos.json');

// 类型定义
interface ChatMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  createdAt: string;
  isMarked?: boolean; // 是否被标记为待办事项
  markedBy?: string; // 标记者的昵称
  markedAt?: number; // 标记时间
}

interface ChatUser {
  id: string;
  nickname: string;
  lastMessageTime: number;
  isAdmin?: boolean;
}

interface TodoItem {
  id: string;
  messageId: string; // 关联的消息ID
  content: string; // 待办事项内容
  createdBy: string; // 创建者昵称
  createdAt: number; // 创建时间
  isCompleted: boolean; // 是否已完成
  completedBy?: string; // 完成者昵称
  completedAt?: number; // 完成时间
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

// 读取待办事项数据
async function readTodos(): Promise<TodoItem[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TODOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 写入待办事项数据
async function writeTodos(todos: TodoItem[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
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
    const [messages, users, todos] = await Promise.all([
      readMessages(),
      readUsers(),
      readTodos()
    ]);
    
    // 清理7天前的用户数据
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter((user: ChatUser) => 
      user.lastMessageTime > sevenDaysAgo
    );
    
    if (activeUsers.length !== users.length) {
      await writeUsers(activeUsers);
    }
    
    // 确保消息包含标记信息
    const messagesWithMarking = messages.map((message: ChatMessage) => {
      const todo = todos.find(t => t.messageId === message.id);
      return {
        ...message,
        isMarked: !!todo,
        markedBy: todo?.createdBy,
        markedAt: todo?.createdAt
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        messages: messagesWithMarking.sort((a: ChatMessage, b: ChatMessage) => a.timestamp - b.timestamp),
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
    const { nickname, content } = body;
    
    // 验证输入
    if (!nickname || !content) {
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
    
    // 查找用户（基于昵称）
    let user = users.find((u: ChatUser) => u.nickname === nickname.trim());
    if (!user) {
      // 如果找不到用户，创建新用户
      user = {
        id: generateId(),
        nickname: nickname.trim(),
        lastMessageTime: 0,
        isAdmin: false
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

// PUT: 获取或创建用户（基于昵称）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname } = body;
    
    if (!nickname) {
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
    
    // 查找现有用户（基于昵称）
    let user = users.find((u: ChatUser) => u.nickname === nickname.trim());
    
    if (!user) {
      // 创建新用户
      user = {
        id: generateId(),
        nickname: nickname.trim(),
        lastMessageTime: 0,
        isAdmin: false
      };
      users.push(user);
    }
    
    // 保存数据
    await writeUsers(users);
    
    return NextResponse.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('获取或创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: '获取或创建用户失败' },
      { status: 500 }
    );
  }
}

// PATCH: 授予管理员（需要密钥）
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, nickname, userId, code } = body as {
      action?: string;
      nickname?: string;
      userId?: string;
      code?: string;
    };

    if (action !== 'grantAdmin') {
      return NextResponse.json(
        { success: false, error: '不支持的操作' },
        { status: 400 }
      );
    }

    if (code !== '930117') {
      return NextResponse.json(
        { success: false, error: '授权码无效' },
        { status: 403 }
      );
    }

    const users = await readUsers();

    let target: ChatUser | undefined;
    if (userId) {
      target = users.find(u => u.id === userId);
    } else if (nickname) {
      target = users.find(u => u.nickname === nickname.trim());
    }

    if (!target) {
      return NextResponse.json(
        { success: false, error: '未找到目标用户' },
        { status: 404 }
      );
    }

    target.isAdmin = true;
    await writeUsers(users);

    return NextResponse.json({ success: true, data: { user: target } });
  } catch (error) {
    console.error('授予管理员失败:', error);
    return NextResponse.json(
      { success: false, error: '授予管理员失败' },
      { status: 500 }
    );
  }
}

// DELETE: 删除消息（需要管理员权限）
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, userId } = body as { messageId?: string; userId?: string };

    if (!messageId || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const users = await readUsers();
    const requester = users.find(u => u.id === userId);

    if (!requester || !requester.isAdmin) {
      return NextResponse.json(
        { success: false, error: '权限不足，仅管理员可删除消息' },
        { status: 403 }
      );
    }

    const messages = await readMessages();
    const index = messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '消息不存在' },
        { status: 404 }
      );
    }

    // 删除消息
    messages.splice(index, 1);
    await writeMessages(messages);

    // 删除对应的待办事项（如果存在）
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.messageId === messageId);
    if (todoIndex !== -1) {
      todos.splice(todoIndex, 1);
      await writeTodos(todos);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除消息失败:', error);
    return NextResponse.json(
      { success: false, error: '删除消息失败' },
      { status: 500 }
    );
  }
}
