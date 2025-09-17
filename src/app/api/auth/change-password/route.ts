import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

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

    const body = await request.json();
    const { oldPassword, newPassword, confirmNewPassword } = body || {};

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { success: false, message: '请填写完整信息' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { success: false, message: '两次输入的新密码不一致' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: '新密码长度不能少于6个字符' },
        { status: 400 }
      );
    }

    const user = await databaseManager.getUserByUid(authUser.uid);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const bcrypt = await import('bcryptjs');
    const isOldPasswordValid = await bcrypt.default.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return NextResponse.json(
        { success: false, message: '旧密码不正确' },
        { status: 400 }
      );
    }

    const hashedNew = await bcrypt.default.hash(newPassword, 10);
    await databaseManager.updateUser(user.uid, { password: hashedNew });

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}


