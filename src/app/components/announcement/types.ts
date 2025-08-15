// 公告系统类型定义

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementDisplayProps {
  announcements: Announcement[];
  onDismiss?: (id: string) => void;
}

export interface AnnouncementEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnnouncements?: Announcement[];
}

export interface AnnouncementManagerProps {
  isEditorOpen: boolean;
  onEditorClose: () => void;
}
