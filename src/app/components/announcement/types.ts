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
  onSave: (announcements: Announcement[]) => void;
  initialAnnouncements?: Announcement[];
}

export interface AnnouncementManagerState {
  announcements: Announcement[];
  isEditorOpen: boolean;
  clickCount: number;
  lastClickTime: number;
}
