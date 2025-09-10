import { NextRequest, NextResponse } from 'next/server';
import databaseManager from '@/app/auth/utils/database';

export const runtime = 'nodejs';

async function handle(req: NextRequest) {
  await databaseManager.init();
  const cfg = await databaseManager.getSystemApiConfig();
  if (!cfg) {
    return NextResponse.json({ success: false, message: '平台未配置AI服务' }, { status: 503 });
  }

  // 目标 URL：将 /api/server-ai/xxx 代理到 cfg.proxyUrl/xxx
  const pathname = req.nextUrl.pathname.replace(/^\/api\/server-ai\/?/, '');
  const targetUrl = new URL(pathname, cfg.proxyUrl.replace(/\/$/, '/') ).toString();

  // 构造转发头（白名单）
  const forwardHeaders = new Headers();
  forwardHeaders.set('Authorization', `Bearer ${cfg.apiKey}`);
  forwardHeaders.set('Accept', 'application/json');
  // 传递 UA 有助于部分提供商识别请求来源
  const ua = req.headers.get('user-agent') || 'Lingki-Server-Proxy/1.0';
  forwardHeaders.set('User-Agent', ua);
  if (!['GET','HEAD'].includes(req.method)) {
    const ct = req.headers.get('content-type') || 'application/json';
    forwardHeaders.set('Content-Type', ct);
  }

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
    body: ['GET','HEAD'].includes(req.method) ? undefined : await req.text()
  };

  try {
    const resp = await fetch(targetUrl, init);
    const proxyHeaders = new Headers(resp.headers);
    // 安全处理：删除敏感头
    proxyHeaders.delete('set-cookie');
    return new NextResponse(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: proxyHeaders,
    });
  } catch (error) {
    console.error('server-ai proxy error:', { targetUrl, error });
    return NextResponse.json({ success: false, message: 'Upstream fetch failed', targetUrl, error: (error as Error).message }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;


