import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const conn = process.env.REDIS_CONN_STRING || '';
  if (!conn) return null;
  redisClient = new Redis(conn, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true
  });
  redisClient.on('error', (err: unknown) => {
    console.error('Redis error:', err);
  });
  return redisClient;
}

export async function incrGroupDailyUsage(groupId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  const key = getGroupDailyKey(groupId);
  const val = await client.incr(key);
  if (val === 1) {
    // 第一次设置当天过期
    const ttl = secondsUntilTomorrow();
    await client.expire(key, ttl);
  }
  return val;
}

export async function getGroupDailyUsage(groupId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  const key = getGroupDailyKey(groupId);
  const v = await client.get(key);
  return v ? Number(v) : 0;
}

export function getGroupDailyKey(groupId: string): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `group:${groupId}:daily:${y}${m}${d}`;
}

export function getUserDailyKey(userId: string): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `user:${userId}:daily:${y}${m}${d}`;
}

function secondsUntilTomorrow(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

// 分组配额缓存键（静态值，不随日期变化）
function getGroupQuotaKey(groupId: string): string {
  return `group:${groupId}:quota`;
}

export async function setGroupQuota(groupId: string, quota: number | null | undefined): Promise<void> {
  const client = getRedis();
  if (!client) return;
  const key = getGroupQuotaKey(groupId);
  if (!quota || quota <= 0) {
    await client.del(key);
    return;
  }
  await client.set(key, String(Math.max(0, Math.floor(quota))));
}

export async function getGroupQuota(groupId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  const key = getGroupQuotaKey(groupId);
  const v = await client.get(key);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function clearGroupQuota(groupId: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.del(getGroupQuotaKey(groupId));
}

export async function getUserDailyUsage(userId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  const key = getUserDailyKey(userId);
  const v = await client.get(key);
  return v ? Number(v) : 0;
}

export async function incrUserDailyUsage(userId: string): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;
  const key = getUserDailyKey(userId);
  const val = await client.incr(key);
  if (val === 1) {
    const ttl = secondsUntilTomorrow();
    await client.expire(key, ttl);
  }
  return val;
}


