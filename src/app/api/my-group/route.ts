import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager, { User as DBUser } from '@/app/auth/utils/database';

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
    // 严谨：读取数据库中的最新分组，避免使用 token 中的过期分组信息
    let groupId = user.group || 'default';
    try {
      const dbUser = await databaseManager.getUserByUid(user.uid);
      if (dbUser) {
        type DbUserWithOptional = DBUser & { group_id?: string; group_expires_at?: string | null };
        const u = dbUser as DbUserWithOptional;
        const gidCandidate = (u.group && u.group.trim()) ? u.group : (u.group_id || 'default');
        const expStr = u.group_expires_at ?? undefined;
        const expTs = expStr ? Date.parse(expStr) : NaN;
        const isExpired = Number.isFinite(expTs) && expTs <= Date.now();
        groupId = isExpired ? 'default' : gidCandidate;
        // 如已过期，后端持久化回退到 default（不阻塞流程）
        if (isExpired) {
          try {
            await databaseManager.updateUser(user.uid, { group_id: 'default', group_expires_at: null } as Partial<DBUser> & { group_id?: string; group_expires_at?: string | null });
          } catch (_e) { /* ignore */ }
        }
      }
    } catch { /* ignore */ }

    const group = await databaseManager.getGroupById(groupId);
    const name = group?.name || (groupId === 'default' ? '默认分组' : groupId);
    return NextResponse.json({ success: true, data: { id: groupId, name } });
  } catch (error) {
    console.error('my-group api error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


