import { NextResponse } from 'next/server';
import { findItemById } from '@/lib/blackmarket/storage';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const item = findItemById(id);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 构建文件路径
    const filename = path.basename(item.fileUrl);
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'blackmarket', filename);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 根据文件类型返回不同的内容
    if (item.type === 'worldbook') {
      // 世界书是JSON文件，直接返回解析后的内容
      const jsonData = JSON.parse(fileContent);
      return NextResponse.json(jsonData);
    } else {
      // 其他类型文件返回原始内容
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error getting item content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
