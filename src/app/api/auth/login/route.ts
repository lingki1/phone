import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

export async function POST(request: NextRequest) {
  try {
    // 确保数据库已初始化
    await databaseManager.init();

    const body = await request.json();
    const { username, password } = body;

    const result = await authService.login({ username, password });

    if (result.success) {
      return NextResponse.json(result, {
        status: 200,
        headers: {
          'Set-Cookie': `token=${result.token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
        }
      });
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
