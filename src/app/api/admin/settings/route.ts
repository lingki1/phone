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

    const requireActivation = await databaseManager.getSetting('register_require_activation');
    return NextResponse.json({
      success: true,
      settings: {
        register_require_activation: requireActivation?.value === 'true'
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
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
    const { register_require_activation } = body;

    if (typeof register_require_activation !== 'boolean') {
      return NextResponse.json({ success: false, message: '参数无效' }, { status: 400 });
    }

    await databaseManager.setSetting('register_require_activation', register_require_activation ? 'true' : 'false');

    return NextResponse.json({ success: true, message: '设置已更新' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


