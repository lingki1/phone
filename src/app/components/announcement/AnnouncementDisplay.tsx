'use client';

import { useState, useEffect } from 'react';
import { Announcement, AnnouncementDisplayProps } from './types';
import './AnnouncementDisplay.css';

export default function AnnouncementDisplay({ announcements, onDismiss }: AnnouncementDisplayProps) {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // 过滤并排序公告
  useEffect(() => {
    const now = new Date();
    const filtered = announcements
      .filter(announcement => {
        // 检查是否已被关闭
        if (dismissedIds.has(announcement.id)) return false;
        
        // 检查是否激活
        if (!announcement.isActive) return false;
        
        // 检查时间范围
        if (announcement.startDate && now < announcement.startDate) return false;
        if (announcement.endDate && now > announcement.endDate) return false;
        
        return true;
      })
      .sort((a, b) => {
        // 按优先级排序：high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // 优先级相同时按创建时间排序（新的在前）
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    
    setVisibleAnnouncements(filtered);
  }, [announcements, dismissedIds]);

  // 处理关闭公告
  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  // 获取公告类型对应的图标
  const getTypeIcon = (type: Announcement['type']) => {
    const icons = {
      info: '📢',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || icons.info;
  };

  // 获取优先级对应的样式类
  const getPriorityClass = (priority: Announcement['priority']) => {
    return `priority-${priority}`;
  };

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="announcement-container">
      {visibleAnnouncements.map((announcement, index) => (
        <div
          key={announcement.id}
          className={`announcement-item ${announcement.type} ${getPriorityClass(announcement.priority)}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="announcement-header">
            <span className="announcement-icon">
              {getTypeIcon(announcement.type)}
            </span>
            <h3 className="announcement-title">{announcement.title}</h3>
            <button
              className="announcement-close"
              onClick={() => handleDismiss(announcement.id)}
              title="关闭公告"
            >
              ×
            </button>
          </div>
          <div className="announcement-content">
            {announcement.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {announcement.priority === 'high' && (
            <div className="announcement-priority-badge">
              重要
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
