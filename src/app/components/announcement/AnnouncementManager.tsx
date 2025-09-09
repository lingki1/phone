'use client';

import { useState, useEffect } from 'react';
import { Announcement } from './types';
import { fetchAnnouncements } from './announcementService';
// AnnouncementDisplay 已废弃
import AnnouncementEditor from './AnnouncementEditor';
import './AnnouncementManager.css';

interface AnnouncementManagerProps {
  isEditorOpen: boolean;
  onEditorClose: () => void;
}

export default function AnnouncementManager({ 
  isEditorOpen, 
  onEditorClose 
}: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // 从API获取公告数据
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('加载公告失败:', err);
      setError('加载公告失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // 定期刷新公告数据（每5分钟）
  useEffect(() => {
    const interval = setInterval(loadAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 处理关闭公告（已不再用于弹窗显示，保留占位可按需恢复）

  // 处理编辑器保存 - 现在不需要了，因为每个操作都是实时保存的
  // const handleEditorSave = () => {
  //   // 重新加载公告数据
  //   loadAnnouncements();
  // };

  if (loading) {
    return (
      <div className="announcement-loading">
        <div className="loading-spinner">📢</div>
        <p>加载公告中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcement-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={loadAnnouncements} className="retry-button">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="announcement-manager">
      {/* 公告显示已移除，统一使用抽屉在页面侧边查看历史 */}
      
      {/* 公告编辑器 */}
      <AnnouncementEditor
        isOpen={isEditorOpen}
        onClose={onEditorClose}
        initialAnnouncements={announcements}
      />
    </div>
  );
}
