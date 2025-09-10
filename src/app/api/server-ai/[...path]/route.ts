import { NextRequest, NextResponse } from 'next/server';
import databaseManager from '@/app/auth/utils/database';

async function handle(req: NextRequest) {
  await databaseManager.init();
  const cfg = await databaseManager.getSystemApiConfig();
  if (!cfg) {
    return NextResponse.json({ success: false, message: '平台未配置AI服务' }, { status: 503 });
  }

  // 目标 URL：将 /api/server-ai/xxx 代理到 cfg.proxyUrl/xxx
  const pathname = req.nextUrl.pathname.replace(/^\/api\/server-ai\/?/, '');
  const targetUrl = new URL(pathname, cfg.proxyUrl.replace(/\/$/, '/') ).toString();

  const headers = new Headers(req.headers);
  headers.set('Authorization', `Bearer ${cfg.apiKey}`);
  // 确保 JSON 类型
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET','HEAD'].includes(req.method) ? undefined : await req.text()
  };

  const resp = await fetch(targetUrl, init);
  const proxyHeaders = new Headers(resp.headers);
  // 安全处理：删除敏感头
  proxyHeaders.delete('set-cookie');
  return new NextResponse(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: proxyHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;


