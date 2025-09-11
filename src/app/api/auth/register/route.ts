import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

export async function POST(request: NextRequest) {
  try {
    // 确保数据库已初始化
    await databaseManager.init();

    const body = await request.json();
    const { username, password, email, role, activationCode } = body;

    const result = await authService.register({ username, password, email, role, activationCode });

    if (result.success) {
      const maxAge = 3 * 24 * 60 * 60; // 3 天
      const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
      return NextResponse.json(result, {
        status: 201,
        headers: {
          'Set-Cookie': `token=${result.token}; HttpOnly; Path=/; Max-Age=${maxAge}; Expires=${expires}; SameSite=Lax`
        }
      });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
