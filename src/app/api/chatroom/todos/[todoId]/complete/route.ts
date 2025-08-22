// 完成待办事项API端点

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const TODOS_FILE = path.join(DATA_DIR, 'chatroom-todos.json');
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

// PATCH: 完成待办事项
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    const { todoId } = await params;
    const body = await request.json();
    const { adminId, adminNickname } = body;
    
    if (!adminId || !adminNickname) {
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
        { success: false, error: '权限不足，仅管理员可完成待办事项' },
        { status: 403 }
      );
    }
    
    // 查找待办事项
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.id === todoId);
    
    if (todoIndex === -1) {
      return NextResponse.json(
        { success: false, error: '待办事项不存在' },
        { status: 404 }
      );
    }
    
    const todo = todos[todoIndex];
    
    if (todo.isCompleted) {
      return NextResponse.json(
        { success: false, error: '待办事项已完成' },
        { status: 400 }
      );
    }
    
    // 完成待办事项
    todo.isCompleted = true;
    todo.completedBy = adminNickname;
    todo.completedAt = Date.now();
    
    // 保存数据
    await writeTodos(todos);
    
    return NextResponse.json({
      success: true,
      data: { todo }
    });
    
  } catch (error) {
    console.error('完成待办事项失败:', error);
    return NextResponse.json(
      { success: false, error: '完成待办事项失败' },
      { status: 500 }
    );
  }
}
