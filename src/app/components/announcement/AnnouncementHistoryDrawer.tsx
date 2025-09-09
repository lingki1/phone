'use client';

import { useEffect, useState } from 'react';
import type { Announcement } from './types';
import { fetchAnnouncements } from './announcementService';
import './AnnouncementHistoryDrawer.css';

interface AnnouncementHistoryDrawerProps {
  announcements: Announcement[];
}

export default function AnnouncementHistoryDrawer({ announcements }: AnnouncementHistoryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [list, setList] = useState<Announcement[]>([]);

  // 初始化时采用外部传入的数据，但仅保留启用中的公告
  useEffect(() => {
    setList((announcements || []).filter(a => a.isActive));
  }, [announcements]);

  // 打开抽屉时自动刷新公告列表
  useEffect(() => {
    if (!isOpen) return;
    const reload = async () => {
      try {
        const data = await fetchAnnouncements();
        setList((data || []).filter(a => a.isActive));
      } catch (_e) {
        // 静默失败，保留现有列表
      }
    };
    reload();
  }, [isOpen]);

  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      {isOpen && (
        <div className="groupmember-annc-drawer-backdrop" onClick={() => setIsOpen(false)} />
      )}
      <aside className={`groupmember-annc-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="groupmember-annc-drawer-panel">
          <div className="groupmember-annc-header">
            <h3 className="groupmember-annc-title">历史公告</h3>
            <button
              className="groupmember-annc-close"
              onClick={() => setIsOpen(false)}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
          <div className="groupmember-annc-timeline">
            {sorted.map((a, idx) => (
              <div key={a.id} className="groupmember-annc-timeline-item">
                <div className="groupmember-annc-marker">
                  <span className="groupmember-annc-dot" />
                  {idx !== sorted.length - 1 && <span className="groupmember-annc-line" />}
                </div>
                <div className="groupmember-annc-content">
                  <div className="groupmember-annc-meta">
                    <span className="groupmember-annc-date">
                      {new Date(a.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="groupmember-annc-item-title">{a.title}</div>
                  <div className="groupmember-annc-text">
                    {a.content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <button
        className={`groupmember-annc-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(v => !v)}
        title={isOpen ? '关闭历史公告' : '查看历史公告'}
        aria-label={isOpen ? '关闭历史公告' : '查看历史公告'}
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        )}
      </button>
    </>
  );
}


