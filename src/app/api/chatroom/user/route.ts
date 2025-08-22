// 用户信息更新API端点

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'chatroom-users.json');

// 类型定义
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

// 写入用户数据
async function writeUsers(users: ChatUser[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
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

// PUT: 更新用户昵称
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
    
    // 查找用户
    const user = users.find((u: ChatUser) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 检查昵称是否已被其他用户使用
    const existingUser = users.find((u: ChatUser) => 
      u.nickname === nickname.trim() && u.id !== userId
    );
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该昵称已被其他用户使用' },
        { status: 400 }
      );
    }
    
    // 更新昵称
    user.nickname = nickname.trim();
    
    // 保存数据
    await writeUsers(users);
    
    return NextResponse.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('更新用户昵称失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户昵称失败' },
      { status: 500 }
    );
  }
}
