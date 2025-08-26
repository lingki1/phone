import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (token) {
      await authService.logout(token);
    }

    return NextResponse.json(
      { success: true, message: '登出成功' },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
        }
      }
    );
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
