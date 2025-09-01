import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;
    
    // 将路径数组重新组合为完整路径
    const fullPath = filename.join('/');
    
    // 安全检查：防止路径遍历攻击
    if (fullPath.includes('..') || fullPath.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'blackmarket', fullPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    
    // 根据文件扩展名设置正确的Content-Type
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': fullPath.includes('_thumb') 
          ? 'public, max-age=31536000' // 缩略图缓存1年
          : 'public, max-age=86400',   // 原图缓存1天
        'Content-Disposition': `inline; filename="${path.basename(fullPath)}"`,
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
