import { NextResponse } from 'next/server';
import { readAllItems } from '@/lib/blackmarket/storage';

export async function GET() {
  const items = readAllItems().filter(i => i.type === 'character');
  // 兼容前端 CharacterCard 形状
  const characters = items.map(i => ({
    id: i.id,
    name: i.name,
    description: i.description,
    author: i.author,
    uploadDate: new Date(i.uploadDate),
    downloadCount: i.downloadCount,
    fileUrl: i.fileUrl,
    thumbnailUrl: i.thumbnailUrl,
    tags: i.tags,
  }));
  return NextResponse.json({ characters });
}

