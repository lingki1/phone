import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await databaseManager.init();
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    const user = await authService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Token无效或已过期' }, { status: 401 });
    }
    const groupId = user.group || 'default';
    const group = await databaseManager.getGroupById(groupId);
    const name = group?.name || (groupId === 'default' ? '默认分组' : groupId);
    return NextResponse.json({ success: true, data: { id: groupId, name } });
  } catch (error) {
    console.error('my-group api error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


