// 取消标记待办事项API端点

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const TODOS_FILE = path.join(DATA_DIR, 'chatroom-todos.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'chatroom-messages.json');
const USERS_FILE = path.join(DATA_DIR, 'chatroom-users.json');

// 类型定义
interface TodoItem {
  id: string;
  messageId: string;
  content: string;
  createdBy: string;
  createdAt: number;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: number;
}

interface ChatMessage {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  createdAt: string;
  isMarked?: boolean;
  markedBy?: string;
  markedAt?: number;
}

interface ChatUser {
  id: string;
  nickname: string;
  lastMessageTime: number;
  isAdmin?: boolean;
}

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
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

// 写入消息数据
async function writeMessages(messages: ChatMessage[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
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

// POST: 取消标记待办事项
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, adminId } = body;
    
    if (!messageId || !adminId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 验证管理员权限
    const users = await readUsers();
    const admin = users.find(u => u.id === adminId);
    
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, error: '权限不足，仅管理员可取消标记' },
        { status: 403 }
      );
    }
    
    // 查找消息
    const messages = await readMessages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: '消息不存在' },
        { status: 404 }
      );
    }
    
    const message = messages[messageIndex];
    
    if (!message.isMarked) {
      return NextResponse.json(
        { success: false, error: '消息未被标记为待办事项' },
        { status: 400 }
      );
    }
    
    // 查找并删除对应的待办事项
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.messageId === messageId);
    
    if (todoIndex !== -1) {
      todos.splice(todoIndex, 1);
      await writeTodos(todos);
    }
    
    // 取消消息标记
    message.isMarked = false;
    message.markedBy = undefined;
    message.markedAt = undefined;
    
    await writeMessages(messages);
    
    return NextResponse.json({
      success: true
    });
    
  } catch (error) {
    console.error('取消标记失败:', error);
    return NextResponse.json(
      { success: false, error: '取消标记失败' },
      { status: 500 }
    );
  }
}
