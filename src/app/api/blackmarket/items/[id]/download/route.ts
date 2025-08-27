import { NextResponse } from 'next/server';
import { incrementDownload } from '@/lib/blackmarket/storage';

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  incrementDownload(id);
  return NextResponse.json({ success: true });
}

