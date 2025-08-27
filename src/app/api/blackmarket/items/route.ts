import { NextResponse } from 'next/server';
import { readAllItems } from '@/lib/blackmarket/storage';

export async function GET() {
  const items = readAllItems();
  return NextResponse.json({ items });
}

