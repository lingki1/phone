import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/utils/auth';
import databaseManager from '@/app/utils/database';

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

    // 返回用户信息（不包含密码）
    const { password: _password, ...userWithoutPassword } = user;

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

    // 普通用户不能修改角色和分组
    if (!authService.hasPermission(authUser.role, 'admin')) {
      delete body.role;
      delete body.group;
    }

    // 如果包含密码，需要加密
    if (body.password) {
      const bcrypt = await import('bcryptjs');
      body.password = await bcrypt.default.hash(body.password, 10);
    }

    await databaseManager.updateUser(uid, body);

    // 获取更新后的用户信息
    const user = await databaseManager.getUserByUid(uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 返回用户信息（不包含密码）
    const { password: _password, ...userWithoutPassword } = user;

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
