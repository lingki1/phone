import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';
import type { User as DBUser } from '@/app/auth/utils/database';

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
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

    // 检查权限：只有管理员可以查看用户列表
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 分页参数
    const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get('limit') || 20)));
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
    const offset = (page - 1) * limit;
    const q = (request.nextUrl.searchParams.get('q') || '').trim();

    const [total, users] = await Promise.all([
      q ? databaseManager.countUsersBySearch(q) : databaseManager.countUsers(),
      q ? databaseManager.getUsersBySearchPaged(q, limit, offset) : databaseManager.getUsersPaged(limit, offset)
    ]);
    
    // 统一响应字段：将 group_id 映射为 group，并移除密码
    const expiredUids: string[] = [];
    const usersWithoutPassword = (users as DBUser[]).map((u) => {
      const { password: _password, group_id, group_expires_at, ...rest } = u as unknown as DBUser & { group_id?: string; group_expires_at?: string };
      const nowTs = Date.now();
      const expiresTs = group_expires_at ? Date.parse(group_expires_at) : NaN;
      const isExpired = Number.isFinite(expiresTs) && expiresTs <= nowTs;
      if (isExpired && (u as DBUser).uid) {
        expiredUids.push((u as DBUser).uid);
      }
      const effectiveGroup = isExpired ? 'default' : (group_id ?? (u as unknown as { group?: string }).group);
      return { ...rest, group: effectiveGroup, group_expires_at };
    });

    // 将过期用户写回默认分组（后台清理）
    if (expiredUids.length > 0) {
      const updates = expiredUids.map(uid =>
        databaseManager.updateUser(uid, { group_id: 'default', group_expires_at: null } as Partial<DBUser> & { group_id?: string; group_expires_at?: string | null })
      );
      // 不阻塞响应，尽量完成写回
      await Promise.allSettled(updates);
    }

    return NextResponse.json({
      success: true,
      users: usersWithoutPassword,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get users API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建用户
export async function POST(request: NextRequest) {
  try {
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

    // 检查权限：只有管理员可以创建用户
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, email, role = 'user', group = 'default' } = body;

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await databaseManager.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 400 }
      );
    }

    // 创建用户
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);

    const user = await databaseManager.createUser({
      username,
      password: hashedPassword,
      role,
      group,
      email
    });

    // 返回用户信息（不包含密码）
    const { password: _password, ...userWithoutPassword } = user as DBUser;

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      user: { ...userWithoutPassword, group: (user as unknown as { group?: string; group_id?: string }).group ?? (user as unknown as { group?: string; group_id?: string }).group_id }
    }, { status: 201 });
  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
