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

  try {
    // 从fileUrl中提取实际的文件名
    // fileUrl格式: /api/blackmarket/files/filename 或 /api/blackmarket/files/thumbnails/filename
    const urlPath = new URL(item.fileUrl, 'http://localhost').pathname;
    const filePathParts = urlPath.split('/');
    
    // 移除开头的空字符串和api/blackmarket/files部分
    const filePathPartsFiltered = filePathParts.filter(part => part && part !== 'api' && part !== 'blackmarket' && part !== 'files');
    
    // 构建完整的文件系统路径
    const relativeFilePath = filePathPartsFiltered.join('/');
    const absPath = path.join(process.cwd(), 'public', 'uploads', 'blackmarket', relativeFilePath);
    
    console.log('下载文件路径:', {
      originalFileUrl: item.fileUrl,
      urlPath,
      filePathParts,
      filePathPartsFiltered,
      relativeFilePath,
      absPath
    });

    if (!fs.existsSync(absPath)) {
      console.error('文件不存在:', absPath);
      return NextResponse.json({ error: 'file missing' }, { status: 404 });
    }

    const buffer = fs.readFileSync(absPath);
    const filename = path.basename(absPath);
    
    // 根据文件类型设置正确的Content-Type
    let contentType = 'application/octet-stream';
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('下载文件时发生错误:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

