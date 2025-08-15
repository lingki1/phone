import { Announcement } from './types';

const API_BASE_URL = '/api/announcements';

// API响应数据类型
interface ApiAnnouncement {
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

// 获取所有公告
export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ApiAnnouncement[] = await response.json();
    return data.map((item: ApiAnnouncement) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      startDate: item.startDate ? new Date(item.startDate) : undefined,
      endDate: item.endDate ? new Date(item.endDate) : undefined,
    }));
  } catch (error) {
    console.error('获取公告失败:', error);
    return [];
  }
}

// 创建新公告
export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement | null> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcement),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiAnnouncement = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };
  } catch (error) {
    console.error('创建公告失败:', error);
    return null;
  }
}

// 更新公告
export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiAnnouncement = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };
  } catch (error) {
    console.error('更新公告失败:', error);
    return null;
  }
}

// 删除公告
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('删除公告失败:', error);
    return false;
  }
}

// 批量更新公告
export async function updateAnnouncements(announcements: Announcement[]): Promise<boolean> {
  try {
    // 这里我们逐个更新，因为API设计是单个操作
    for (const announcement of announcements) {
      const success = await updateAnnouncement(announcement.id, announcement);
      if (!success) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('批量更新公告失败:', error);
    return false;
  }
}
