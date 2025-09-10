import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

export async function GET(request: NextRequest) {
  try {
    await databaseManager.init();

    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });

    const authUser = await authService.verifyToken(token);
    if (!authUser || !authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const cfg = await databaseManager.getSystemApiConfig();
    return NextResponse.json({ success: true, data: cfg });
  } catch (error) {
    console.error('Get system api config error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await databaseManager.init();

    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });

    const authUser = await authService.verifyToken(token);
    if (!authUser || !authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { proxyUrl, apiKey, model } = body || {};
    if (!proxyUrl || !apiKey) {
      return NextResponse.json({ success: false, message: '参数无效（需要 proxyUrl 与 apiKey）' }, { status: 400 });
    }

    await databaseManager.setSystemApiConfig({ proxyUrl: String(proxyUrl), apiKey: String(apiKey), model: String(model || '') });
    return NextResponse.json({ success: true, message: '配置已更新' });
  } catch (error) {
    console.error('Update system api config error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


