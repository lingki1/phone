import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import databaseManager from '@/app/auth/utils/database';

export async function POST() {
  try {
    // 初始化数据库
    await databaseManager.init();

    return NextResponse.json({
      success: true,
      message: '数据库初始化成功'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, message: '数据库初始化失败' },
      { status: 500 }
    );
  }
}
