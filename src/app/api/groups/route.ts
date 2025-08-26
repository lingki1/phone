import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

// 获取分组列表
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

    // 检查权限：只有管理员可以查看分组列表
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const groups = await databaseManager.getAllGroups();

    return NextResponse.json({
      success: true,
      groups
    });
  } catch (error) {
    console.error('Get groups API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建分组
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

    // 检查权限：只有管理员可以创建分组
    if (!authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // 验证输入
    if (!name) {
      return NextResponse.json(
        { success: false, message: '分组名称不能为空' },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { success: false, message: '分组名称长度必须在2-50个字符之间' },
        { status: 400 }
      );
    }

    // 检查分组名称是否已存在
    const existingGroups = await databaseManager.getAllGroups();
    const existingGroup = existingGroups.find(group => group.name === name);
    if (existingGroup) {
      return NextResponse.json(
        { success: false, message: '分组名称已存在' },
        { status: 400 }
      );
    }

    // 创建分组
    const group = await databaseManager.createGroup({
      name,
      description,
      created_by: authUser.uid
    });

    return NextResponse.json({
      success: true,
      message: '分组创建成功',
      group
    }, { status: 201 });
  } catch (error) {
    console.error('Create group API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
