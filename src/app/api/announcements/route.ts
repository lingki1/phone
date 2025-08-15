import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 公告数据文件路径
const ANNOUNCEMENTS_FILE = path.join(process.cwd(), 'data', 'announcements.json');

// 公告数据类型定义
interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 确保数据目录存在
async function ensureDataDirectory() {
  const dataDir = path.dirname(ANNOUNCEMENTS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取公告数据
async function readAnnouncements(): Promise<AnnouncementData[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(ANNOUNCEMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // 如果文件不存在，返回空数组
    return [];
  }
}

// 写入公告数据
async function writeAnnouncements(announcements: AnnouncementData[]) {
  await ensureDataDirectory();
  await fs.writeFile(ANNOUNCEMENTS_FILE, JSON.stringify(announcements, null, 2));
}

// GET - 获取所有公告
export async function GET() {
  try {
    const announcements = await readAnnouncements();
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('获取公告失败:', error);
    return NextResponse.json(
      { error: '获取公告失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新公告
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type, priority, isActive, startDate, endDate } = body;

    // 验证必填字段
    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const newAnnouncement: AnnouncementData = {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: type || 'info',
      priority: priority || 'medium',
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const announcements = await readAnnouncements();
    announcements.push(newAnnouncement);
    await writeAnnouncements(announcements);

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('创建公告失败:', error);
    return NextResponse.json(
      { error: '创建公告失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新公告
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: '公告ID不能为空' },
        { status: 400 }
      );
    }

    const announcements = await readAnnouncements();
    const index = announcements.findIndex((a: AnnouncementData) => a.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      );
    }

    // 更新公告
    announcements[index] = {
      ...announcements[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await writeAnnouncements(announcements);

    return NextResponse.json(announcements[index]);
  } catch (error) {
    console.error('更新公告失败:', error);
    return NextResponse.json(
      { error: '更新公告失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除公告
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '公告ID不能为空' },
        { status: 400 }
      );
    }

    const announcements = await readAnnouncements();
    const filteredAnnouncements = announcements.filter((a: AnnouncementData) => a.id !== id);

    if (filteredAnnouncements.length === announcements.length) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      );
    }

    await writeAnnouncements(filteredAnnouncements);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除公告失败:', error);
    return NextResponse.json(
      { error: '删除公告失败' },
      { status: 500 }
    );
  }
}
