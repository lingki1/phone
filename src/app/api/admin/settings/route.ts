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
    const purchaseUrl1 = await databaseManager.getSetting('purchase_url_1');
    const purchaseUrl2 = await databaseManager.getSetting('purchase_url_2');
    return NextResponse.json({
      success: true,
      settings: {
        register_require_activation: requireActivation?.value === 'true',
        purchase_url_1: purchaseUrl1?.value || '',
        purchase_url_2: purchaseUrl2?.value || ''
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
    const { register_require_activation, purchase_url_1, purchase_url_2 } = body || {};

    // 可选更新：如果提供则更新；未提供则跳过
    if (typeof register_require_activation !== 'undefined') {
      if (typeof register_require_activation !== 'boolean') {
        return NextResponse.json({ success: false, message: '参数无效：register_require_activation' }, { status: 400 });
      }
      await databaseManager.setSetting('register_require_activation', register_require_activation ? 'true' : 'false');
    }

    if (typeof purchase_url_1 !== 'undefined') {
      if (typeof purchase_url_1 !== 'string') {
        return NextResponse.json({ success: false, message: '参数无效：purchase_url_1' }, { status: 400 });
      }
      await databaseManager.setSetting('purchase_url_1', purchase_url_1.trim());
    }

    if (typeof purchase_url_2 !== 'undefined') {
      if (typeof purchase_url_2 !== 'string') {
        return NextResponse.json({ success: false, message: '参数无效：purchase_url_2' }, { status: 400 });
      }
      await databaseManager.setSetting('purchase_url_2', purchase_url_2.trim());
    }

    return NextResponse.json({ success: true, message: '设置已更新' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


