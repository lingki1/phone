import { NextRequest, NextResponse } from 'next/server';
import databaseManager, { User as DBUser } from '@/app/auth/utils/database';
import authService from '@/app/auth/utils/auth';
import { getUserDailyUsage, getGroupQuota } from '@/lib/redis';

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

    // 读取数据库中的最新分组状态
    let groupId = user.group || 'default';
    try {
      const dbUser = await databaseManager.getUserByUid(user.uid);
      if (dbUser) {
        type DbUserWithOptional = DBUser & { group_id?: string; group_expires_at?: string | null };
        const u = dbUser as DbUserWithOptional;
        const gidCandidate = (u.group && u.group.trim()) ? u.group : (u.group_id || 'default');
        const expStr = u.group_expires_at ?? undefined;
        const expTs = expStr ? Date.parse(expStr) : NaN;
        groupId = Number.isFinite(expTs) && expTs <= Date.now() ? 'default' : gidCandidate;
      }
    } catch { /* ignore */ }
    // 优先读 Redis 缓存配额，回退 DB
    let quota = await getGroupQuota(groupId);
    if (quota == null) {
      const group = await databaseManager.getGroupById(groupId);
      quota = Number(group?.daily_api_quota || 0);
    }
    const used = (await getUserDailyUsage(user.uid)) || 0;
    const remaining = quota && quota > 0 ? Math.max(0, quota - used) : null;

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');

    return NextResponse.json({
      success: true,
      data: {
        date: `${y}-${m}-${d}`,
        groupId,
        quota: quota || 0,
        used,
        remaining, // null 表示不限
        limited: Boolean(quota && quota > 0)
      }
    });
  } catch (error) {
    console.error('quota api error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


