import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';
import type { User as DBUser } from '@/app/auth/utils/database';

// 获取单个用户信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
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

    const { uid } = await params;

    // 检查权限：用户只能查看自己的信息，管理员可以查看所有用户
    if (authUser.uid !== uid && !authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const user = await databaseManager.getUserByUid(uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 返回用户信息（不包含密码，并将group_id映射为group）
    const raw = user as unknown as (DBUser & { group_id?: string; group_expires_at?: string });
    const { password: _password, group_id, group_expires_at, ...rest } = raw;
    const nowTs = Date.now();
    const expiresTs = group_expires_at ? Date.parse(group_expires_at) : NaN;
    const isExpired = Number.isFinite(expiresTs) && expiresTs <= nowTs;
    const effectiveGroup = isExpired ? 'default' : (group_id ?? raw.group);
    // 如果过期则后台写回默认分组
    if (isExpired) {
      await databaseManager.updateUser(uid, { group_id: 'default', group_expires_at: null } as Partial<DBUser> & { group_id?: string; group_expires_at?: string | null });
    }
    const userWithoutPassword = { ...rest, group: effectiveGroup, group_expires_at };

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
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

    const { uid } = await params;
    const body = await request.json();

    // 检查权限：用户只能更新自己的信息，管理员可以更新所有用户
    if (authUser.uid !== uid && !authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 获取目标用户信息
    const targetUser = await databaseManager.getUserByUid(uid);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 超级管理员权限保护：超级管理员的角色不能被修改
    if (targetUser.role === 'super_admin' && body.role && body.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: '超级管理员权限不可被修改' },
        { status: 403 }
      );
    }

    // 普通用户不能修改角色和分组
    if (!authService.hasPermission(authUser.role, 'admin')) {
      delete body.role;
      delete body.group;
    }

    // 只有超级管理员可以修改其他用户的角色为super_admin
    if (body.role === 'super_admin' && authUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: '只有超级管理员可以设置超级管理员权限' },
        { status: 403 }
      );
    }

    // 如果包含密码，只有超级管理员可以修改（重置）
    if (body.password) {
      if (authUser.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, message: '只有超级管理员可以重置用户密码' },
          { status: 403 }
        );
      }
      const bcrypt = await import('bcryptjs');
      body.password = await bcrypt.default.hash(body.password, 10);
    }

    // 将 group 映射为数据库字段 group_id
    const updates = { ...body } as Partial<DBUser> & { group?: string; group_id?: string; group_expires_at?: string };
    if (typeof updates.group !== 'undefined') {
      updates.group_id = updates.group;
      delete (updates as { group?: string }).group;
    }

    await databaseManager.updateUser(uid, updates as Partial<DBUser>);

    // 获取更新后的用户信息
    const user = await databaseManager.getUserByUid(uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 返回用户信息（不包含密码，并将group_id映射为group）
    const rawUpdated = user as unknown as (DBUser & { group_id?: string; group_expires_at?: string });
    const { password: _password, group_id: updated_group_id, group_expires_at: updated_expires, ...updatedRest } = rawUpdated;
    const nowTs2 = Date.now();
    const expiresTs2 = updated_expires ? Date.parse(updated_expires) : NaN;
    const isExpired2 = Number.isFinite(expiresTs2) && expiresTs2 <= nowTs2;
    const effectiveGroup2 = isExpired2 ? 'default' : (updated_group_id ?? rawUpdated.group);
    const userWithoutPassword = { ...updatedRest, group: effectiveGroup2, group_expires_at: updated_expires };

    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
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

    const { uid } = await params;

    // 检查权限：只有管理员可以删除用户
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 不能删除自己
    if (authUser.uid === uid) {
      return NextResponse.json(
        { success: false, message: '不能删除自己的账户' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const user = await databaseManager.getUserByUid(uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 超级管理员保护：超级管理员不能被删除
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { success: false, message: '超级管理员账户不能被删除' },
        { status: 403 }
      );
    }

    // 删除用户的所有会话
    await databaseManager.deleteUserSessions(uid);
    
    // 删除用户
    await databaseManager.deleteUser(uid);

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
