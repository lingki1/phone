import { NextRequest, NextResponse } from 'next/server';
import databaseManager, { User as DBUser } from '@/app/auth/utils/database';
import authService from '@/app/auth/utils/auth';
import { getUserDailyUsage, incrUserDailyUsage, getGroupQuota } from '@/lib/redis';

export const runtime = 'nodejs';

async function handle(req: NextRequest) {
  await databaseManager.init();
  // 可选鉴权：识别当前用户与分组
  const token = req.cookies.get('token')?.value;
  let groupId: string | null = null;
  let userId: string | null = null;
  if (token) {
    const authUser = await authService.verifyToken(token);
    if (authUser) {
      userId = authUser.uid;
      // 使用数据库中的最新分组，避免 token 中分组信息过期
      try {
        const dbUser = await databaseManager.getUserByUid(authUser.uid);
        if (dbUser) {
          type DbUserWithOptional = DBUser & { group_id?: string; group_expires_at?: string | null };
          const u = dbUser as DbUserWithOptional;
          const gidCandidate = (u.group && u.group.trim()) ? u.group : (u.group_id || 'default');
          const expStr = u.group_expires_at ?? undefined;
          const expTs = expStr ? Date.parse(expStr) : NaN;
          groupId = Number.isFinite(expTs) && expTs <= Date.now() ? 'default' : gidCandidate;
        } else {
          groupId = authUser.group || 'default';
        }
      } catch {
        groupId = authUser.group || 'default';
      }
    }
  }

  // 如果能识别分组，做每日配额校验（依赖 Redis 与 DB 中的 daily_api_quota）
  if (groupId && userId) {
    try {
      // 优先读 Redis 缓存中的配额，其次回退 DB
      let quota = await getGroupQuota(groupId);
      if (quota == null) {
        const group = await databaseManager.getGroupById(groupId);
        quota = Number(group?.daily_api_quota || 0);
      }
      if (quota > 0) {
        const used = await getUserDailyUsage(userId) || 0;
        if (used >= quota) {
          return NextResponse.json({ success: false, message: '已达本分组今日内置API使用上限' }, { status: 429 });
        }
      }
    } catch (e) {
      console.error('quota precheck error:', e);
    }
  }
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
    // 请求成功后再计数，失败不计（可按需调整）
    if (groupId && userId) {
      try {
        let quota = await getGroupQuota(groupId);
        if (quota == null) {
          const group = await databaseManager.getGroupById(groupId);
          quota = Number(group?.daily_api_quota || 0);
        }
        if (quota > 0) {
          await incrUserDailyUsage(userId);
        }
      } catch (e) {
        console.error('quota post incr error:', e);
      }
    }

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


