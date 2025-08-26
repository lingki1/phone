import { NextRequest, NextResponse } from 'next/server';
import authService from '@/app/auth/utils/auth';
import databaseManager from '@/app/auth/utils/database';

export async function GET(request: NextRequest) {
  try {
    await databaseManager.init();

    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });

    const authUser = await authService.verifyToken(token);
    if (!authUser || !authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const includeUsed = request.nextUrl.searchParams.get('includeUsed') === 'true';
    const codes = await databaseManager.listActivationCodes(includeUsed);
    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error('List activation codes error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await databaseManager.init();

    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });

    const authUser = await authService.verifyToken(token);
    if (!authUser || !authService.hasPermission(authUser.role, 'admin')) {
      return NextResponse.json({ success: false, message: '权限不足' }, { status: 403 });
    }

    const body = await request.json();
    const { count } = body;
    const num = Number(count);
    if (!Number.isInteger(num) || num <= 0 || num > 200) {
      return NextResponse.json({ success: false, message: '数量必须是1-200的整数' }, { status: 400 });
    }

    const codes = await databaseManager.createActivationCodes(num, authUser.uid);
    return NextResponse.json({ success: true, codes }, { status: 201 });
  } catch (error) {
    console.error('Create activation codes error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


