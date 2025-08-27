import { NextResponse } from 'next/server';
import { readAllItems } from '@/lib/blackmarket/storage';

export async function GET() {
  const items = readAllItems().filter(i => i.type === 'worldbook');
  const worldbooks = items.map(i => ({
    id: i.id,
    name: i.name,
    description: i.description,
    author: i.author,
    uploadDate: new Date(i.uploadDate),
    downloadCount: i.downloadCount,
    fileUrl: i.fileUrl,
    tags: i.tags,
    entryCount: 0,
  }));
  return NextResponse.json({ worldbooks });
}

