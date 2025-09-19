import { NextRequest, NextResponse } from 'next/server';
import databaseManager from '@/app/auth/utils/database';

// 公开读取基础设置：是否需要激活码、两个购卡链接
export async function GET(_request: NextRequest) {
  try {
    await databaseManager.init();

    const requireActivation = await databaseManager.getSetting('register_require_activation');
    const purchaseUrl1 = await databaseManager.getSetting('purchase_url_1');
    const purchaseUrl2 = await databaseManager.getSetting('purchase_url_2');

    return NextResponse.json({
      success: true,
      settings: {
        register_require_activation: requireActivation?.value === 'true',
        purchase_url_1: purchaseUrl1?.value || '',
        purchase_url_2: purchaseUrl2?.value || ''
      }
    });
  } catch (error) {
    console.error('Public settings GET error:', error);
    return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
  }
}


