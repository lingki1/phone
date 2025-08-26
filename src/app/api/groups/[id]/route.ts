import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

// 获取单个分组信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 检查权限：只有管理员可以查看分组信息
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const group = await databaseManager.getGroupById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, message: '分组不存在' },
        { status: 404 }
      );
    }

    // 获取该分组下的用户
    const users = await databaseManager.getUsersByGroup(id);

    return NextResponse.json({
      success: true,
      group,
      users: users.map(user => {
        const { password: _password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      })
    });
  } catch (error) {
    console.error('Get group API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 更新分组信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 检查权限：只有管理员可以更新分组
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // 验证输入
    if (name && (name.length < 2 || name.length > 50)) {
      return NextResponse.json(
        { success: false, message: '分组名称长度必须在2-50个字符之间' },
        { status: 400 }
      );
    }

    // 检查分组是否存在
    const existingGroup = await databaseManager.getGroupById(id);
    if (!existingGroup) {
      return NextResponse.json(
        { success: false, message: '分组不存在' },
        { status: 404 }
      );
    }

    // 如果修改名称，检查新名称是否已存在
    if (name && name !== existingGroup.name) {
      const allGroups = await databaseManager.getAllGroups();
      const nameExists = allGroups.find(group => group.name === name && group.id !== id);
      if (nameExists) {
        return NextResponse.json(
          { success: false, message: '分组名称已存在' },
          { status: 400 }
        );
      }
    }

    // 更新分组
    await databaseManager.updateGroup(id, { name, description });

    // 获取更新后的分组信息
    const updatedGroup = await databaseManager.getGroupById(id);

    return NextResponse.json({
      success: true,
      message: '分组信息更新成功',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Update group API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除分组
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // 检查权限：只有管理员可以删除分组
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 检查分组是否存在
    const group = await databaseManager.getGroupById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, message: '分组不存在' },
        { status: 404 }
      );
    }

    // 不能删除默认分组
    if (id === 'default') {
      return NextResponse.json(
        { success: false, message: '不能删除默认分组' },
        { status: 400 }
      );
    }

    // 删除分组（会自动将该分组下的用户移动到默认分组）
    await databaseManager.deleteGroup(id);

    return NextResponse.json({
      success: true,
      message: '分组删除成功'
    });
  } catch (error) {
    console.error('Delete group API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
