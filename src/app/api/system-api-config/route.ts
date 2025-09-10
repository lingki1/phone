import { NextRequest, NextResponse } from 'next/server';
import databaseManager from '@/app/auth/utils/database';

// 公共端：仅返回可公开字段（不含 apiKey）
export async function GET(_request: NextRequest) {
  try {
    await databaseManager.init();
    const cfg = await databaseManager.getSystemApiConfig();
    if (!cfg) return NextResponse.json({ success: true, data: null });
    return NextResponse.json({
      success: true,
      data: {
        proxyUrl: '/api/server-ai', // 提供平台代理前缀，避免暴露真实地址
        model: cfg.model || ''
      }
    });
  } catch (error) {
    console.error('Public system api config error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


