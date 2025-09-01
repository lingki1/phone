import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
import { addItem, generateId, getUploadDir, toPublicUrl } from '@/lib/blackmarket/storage';
import { getCurrentUser } from '@/lib/auth-utils';
import { ImageProcessor } from '@/lib/blackmarket/imageProcessor';

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

  // 保存原始PNG文件（保持完整性）
  const originalFilename = `${id}.png`;
  const originalPath = path.join(uploadDir, originalFilename);
  fs.writeFileSync(originalPath, buffer);

  // 生成按比例压缩的缩略图
  const thumbnailDir = path.join(uploadDir, 'thumbnails');
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }

  let thumbnailFilename = originalFilename; // 默认使用原图
  let thumbnails: { small: string; medium: string; large: string } | null = null;
  let pngMetadata: Record<string, unknown> = {};
  
  try {
    // 生成多种尺寸的缩略图
    thumbnails = await ImageProcessor.generateMultipleProportionalThumbnails(
      originalPath,
      thumbnailDir,
      id
    );
    
    // 使用中等尺寸作为默认缩略图
    thumbnailFilename = `thumbnails/${thumbnails.medium}`;
    
    // 提取PNG元数据
    pngMetadata = await ImageProcessor.extractPNGMetadata(originalPath);
    
    console.log(`缩略图生成成功: ${thumbnailFilename}`);
    console.log(`原图尺寸: ${pngMetadata.width}x${pngMetadata.height}`);
  } catch (error) {
    console.error('生成缩略图失败:', error);
    // 如果缩略图生成失败，继续使用原图
  }

  addItem({
    id,
    type: 'character',
    name: metadata.name,
    description: metadata.description,
    author: currentUser.username,
    uploadDate: new Date().toISOString(),
    downloadCount: 0,
    fileUrl: toPublicUrl(originalFilename), // 原始PNG文件URL
    thumbnailUrl: toPublicUrl(thumbnailFilename), // 按比例压缩的缩略图URL
    tags: metadata.tags || [],
    thumbnails: thumbnails ? {
      small: toPublicUrl(`thumbnails/${thumbnails.small}`),
      medium: toPublicUrl(`thumbnails/${thumbnails.medium}`),
      large: toPublicUrl(`thumbnails/${thumbnails.large}`)
    } : undefined,
    metadata: pngMetadata
  });

  return NextResponse.json({
    character: {
      id,
      name: metadata.name,
      description: metadata.description,
      author: currentUser.username,
      uploadDate: new Date(),
      downloadCount: 0,
      fileUrl: toPublicUrl(originalFilename),
      thumbnailUrl: toPublicUrl(thumbnailFilename),
      tags: metadata.tags || [],
      thumbnails: thumbnails ? {
        small: toPublicUrl(`thumbnails/${thumbnails.small}`),
        medium: toPublicUrl(`thumbnails/${thumbnails.medium}`),
        large: toPublicUrl(`thumbnails/${thumbnails.large}`)
      } : undefined,
      metadata: pngMetadata
    },
  });
}

