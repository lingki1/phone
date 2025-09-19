import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';
import type { User as DBUser } from '@/app/auth/utils/database';

export async function GET(request: NextRequest) {
  try {
    // 确保数据库已初始化
    await databaseManager.init();

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const authUser = await authService.verifyToken(token);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Token无效或已过期' },
        { status: 401 }
      );
    }

    const user = await databaseManager.getUserByUid(authUser.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 返回用户信息（不包含密码，映射 group_id 为 group，并补充 group_name）
    const raw = user as unknown as (DBUser & { group_id?: string });
    const { password: _password, group_id, ...rest } = raw;
    const groupId = group_id ?? raw.group;
    let groupName = '';
    try {
      if (!groupId) {
        groupName = '';
      } else if (groupId === 'default') {
        // 默认分组交由前端做 i18n 显示
        groupName = '';
      } else {
        const g = await databaseManager.getGroupById(groupId);
        groupName = g?.name || '';
      }
    } catch (_e) {
      groupName = '';
    }

    const userWithoutPassword = { ...rest, group: groupId, group_name: groupName };

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user info API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
