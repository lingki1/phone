import { NextResponse } from 'next/server';
import { readAllItems } from '@/lib/blackmarket/storage';

export async function GET(
  _req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const items = readAllItems().filter(i => i.author === username);
  return NextResponse.json({ items });
}

