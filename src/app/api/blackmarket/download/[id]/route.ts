import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { findItemById } from '@/lib/blackmarket/storage';

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const item = findItemById(id);
  if (!item) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  // 文件位于 public 下，直接读取返回
  const absPath = path.join(process.cwd(), 'public', item.fileUrl.replace(/^\//, ''));
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: 'file missing' }, { status: 404 });
  }
  const buffer = fs.readFileSync(absPath);
  const filename = path.basename(absPath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': item.type === 'character' ? 'image/png' : 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

