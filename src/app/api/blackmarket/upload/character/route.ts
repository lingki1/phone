import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import { addItem, generateId, getUploadDir, toPublicUrl } from '@/lib/blackmarket/storage';
import { getCurrentUser } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  // 获取当前用户信息
  const currentUser = await getCurrentUser(req);
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const metadataRaw = formData.get('metadata');

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'file missing' }, { status: 400 });
  }

  if (typeof metadataRaw !== 'string') {
    return NextResponse.json({ error: 'metadata missing' }, { status: 400 });
  }

  const metadata = JSON.parse(metadataRaw) as { name: string; description: string; tags: string[] };
  const id = generateId();
  const uploadDir = getUploadDir();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filename = `${id}.png`;
  const absPath = path.join(uploadDir, filename);
  fs.writeFileSync(absPath, buffer);

  addItem({
    id,
    type: 'character',
    name: metadata.name,
    description: metadata.description,
    author: currentUser.username,
    uploadDate: new Date().toISOString(),
    downloadCount: 0,
    fileUrl: toPublicUrl(filename),
    thumbnailUrl: toPublicUrl(filename),
    tags: metadata.tags || [],
  });

  return NextResponse.json({
    character: {
      id,
      name: metadata.name,
      description: metadata.description,
      author: currentUser.username,
      uploadDate: new Date(),
      downloadCount: 0,
      fileUrl: toPublicUrl(filename),
      thumbnailUrl: toPublicUrl(filename),
      tags: metadata.tags || [],
    },
  });
}

