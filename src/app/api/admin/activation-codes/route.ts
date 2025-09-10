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
    const exportAll = request.nextUrl.searchParams.get('exportAll') === 'true';
    const statusParam = (request.nextUrl.searchParams.get('status') || '').toLowerCase();
    // 兼容旧参数 includeUsed → 映射为 status；若提供 status 参数则优先
    const status: 'all' | 'used' | 'unused' = (statusParam === 'all' || statusParam === 'used' || statusParam === 'unused')
      ? statusParam
      : (includeUsed ? 'all' : 'unused');

    if (exportAll) {
      const all = await databaseManager.listActivationCodesByStatusAll(status);
      return NextResponse.json({ success: true, codes: all });
    }

    const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get('limit') || 20)));
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
    const offset = (page - 1) * limit;

    const [total, codes] = await Promise.all([
      databaseManager.countActivationCodesByStatus(status),
      databaseManager.listActivationCodesByStatusPaged(status, limit, offset)
    ]);
    return NextResponse.json({ success: true, codes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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


