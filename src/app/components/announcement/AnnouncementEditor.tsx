'use client';

import { useState, useEffect } from 'react';
import { Announcement, AnnouncementEditorProps } from './types';
import './AnnouncementEditor.css';

export default function AnnouncementEditor({ 
  isOpen, 
  onClose, 
  onSave, 
  initialAnnouncements = [] 
}: AnnouncementEditorProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 初始化编辑器数据
  useEffect(() => {
    if (isOpen) {
      setAnnouncements([...initialAnnouncements]);
      setEditingAnnouncement(null);
      setIsCreating(false);
    }
  }, [isOpen, initialAnnouncements]);

  // 创建新公告
  const createNewAnnouncement = (): Announcement => {
    const now = new Date();
    return {
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      content: '',
      type: 'info',
      priority: 'medium',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  };

  // 开始创建新公告
  const handleCreateNew = () => {
    const newAnnouncement = createNewAnnouncement();
    setEditingAnnouncement(newAnnouncement);
    setIsCreating(true);
  };

  // 编辑现有公告
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement({ ...announcement });
    setIsCreating(false);
  };

  // 保存公告
  const handleSaveAnnouncement = () => {
    if (!editingAnnouncement || !editingAnnouncement.title.trim()) {
      alert('请填写公告标题');
      return;
    }

    const updatedAnnouncement = {
      ...editingAnnouncement,
      updatedAt: new Date()
    };

    if (isCreating) {
      // 添加新公告
      setAnnouncements(prev => [...prev, updatedAnnouncement]);
    } else {
      // 更新现有公告
      setAnnouncements(prev => 
        prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a)
      );
    }

    setEditingAnnouncement(null);
    setIsCreating(false);
  };

  // 删除公告
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条公告吗？')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  // 切换公告状态
  const handleToggleActive = (id: string) => {
    setAnnouncements(prev => 
      prev.map(a => 
        a.id === id ? { ...a, isActive: !a.isActive, updatedAt: new Date() } : a
      )
    );
  };

  // 保存所有更改
  const handleSaveAll = () => {
    onSave(announcements);
    onClose();
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    setIsCreating(false);
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="announcement-editor-overlay">
      <div className="announcement-editor">
        <div className="editor-header">
          <h2>公告管理</h2>
          <div className="header-actions">
            <button className="btn-create" onClick={handleCreateNew}>
              ➕ 新建公告
            </button>
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="editor-content">
          {/* 编辑表单 */}
          {editingAnnouncement && (
            <div className="edit-form">
              <h3>{isCreating ? '创建新公告' : '编辑公告'}</h3>
              
              <div className="form-row">
                <label>标题 *</label>
                <input
                  type="text"
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement(prev => 
                    prev ? { ...prev, title: e.target.value } : null
                  )}
                  placeholder="请输入公告标题"
                  maxLength={100}
                />
              </div>

              <div className="form-row">
                <label>内容 *</label>
                <textarea
                  value={editingAnnouncement.content}
                  onChange={(e) => setEditingAnnouncement(prev => 
                    prev ? { ...prev, content: e.target.value } : null
                  )}
                  placeholder="请输入公告内容（支持换行）"
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="form-row-group">
                <div className="form-col">
                  <label>类型</label>
                  <select
                    value={editingAnnouncement.type}
                    onChange={(e) => setEditingAnnouncement(prev => 
                      prev ? { ...prev, type: e.target.value as Announcement['type'] } : null
                    )}
                  >
                    <option value="info">信息</option>
                    <option value="warning">警告</option>
                    <option value="success">成功</option>
                    <option value="error">错误</option>
                  </select>
                </div>

                <div className="form-col">
                  <label>优先级</label>
                  <select
                    value={editingAnnouncement.priority}
                    onChange={(e) => setEditingAnnouncement(prev => 
                      prev ? { ...prev, priority: e.target.value as Announcement['priority'] } : null
                    )}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>

              <div className="form-row-group">
                <div className="form-col">
                  <label>开始时间（可选）</label>
                  <input
                    type="datetime-local"
                    value={editingAnnouncement.startDate ? 
                      new Date(editingAnnouncement.startDate.getTime() - editingAnnouncement.startDate.getTimezoneOffset() * 60000)
                        .toISOString().slice(0, 16) : ''
                    }
                    onChange={(e) => setEditingAnnouncement(prev => 
                      prev ? { 
                        ...prev, 
                        startDate: e.target.value ? new Date(e.target.value) : undefined 
                      } : null
                    )}
                  />
                </div>

                <div className="form-col">
                  <label>结束时间（可选）</label>
                  <input
                    type="datetime-local"
                    value={editingAnnouncement.endDate ? 
                      new Date(editingAnnouncement.endDate.getTime() - editingAnnouncement.endDate.getTimezoneOffset() * 60000)
                        .toISOString().slice(0, 16) : ''
                    }
                    onChange={(e) => setEditingAnnouncement(prev => 
                      prev ? { 
                        ...prev, 
                        endDate: e.target.value ? new Date(e.target.value) : undefined 
                      } : null
                    )}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={handleSaveAnnouncement}>
                  💾 保存
                </button>
                <button className="btn-cancel" onClick={handleCancelEdit}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 公告列表 */}
          <div className="announcement-list">
            <h3>现有公告 ({announcements.length})</h3>
            {announcements.length === 0 ? (
              <div className="empty-state">
                <p>暂无公告</p>
                <button className="btn-create-empty" onClick={handleCreateNew}>
                  创建第一条公告
                </button>
              </div>
            ) : (
              <div className="list-container">
                {announcements.map(announcement => (
                  <div key={announcement.id} className={`list-item ${announcement.isActive ? 'active' : 'inactive'}`}>
                    <div className="item-header">
                      <span className={`type-badge ${announcement.type}`}>
                        {announcement.type === 'info' && '📢'}
                        {announcement.type === 'warning' && '⚠️'}
                        {announcement.type === 'success' && '✅'}
                        {announcement.type === 'error' && '❌'}
                      </span>
                      <h4>{announcement.title}</h4>
                      <span className={`priority-badge ${announcement.priority}`}>
                        {announcement.priority === 'high' && '高'}
                        {announcement.priority === 'medium' && '中'}
                        {announcement.priority === 'low' && '低'}
                      </span>
                    </div>
                    <p className="item-content">{announcement.content}</p>
                    <div className="item-meta">
                      <span>创建：{formatDate(announcement.createdAt)}</span>
                      {announcement.startDate && (
                        <span>开始：{formatDate(announcement.startDate)}</span>
                      )}
                      {announcement.endDate && (
                        <span>结束：{formatDate(announcement.endDate)}</span>
                      )}
                    </div>
                    <div className="item-actions">
                      <button 
                        className={`btn-toggle ${announcement.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(announcement.id)}
                      >
                        {announcement.isActive ? '🟢 启用' : '🔴 禁用'}
                      </button>
                      <button className="btn-edit" onClick={() => handleEdit(announcement)}>
                        ✏️ 编辑
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(announcement.id)}>
                        🗑️ 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn-save-all" onClick={handleSaveAll}>
            💾 保存所有更改
          </button>
          <button className="btn-cancel-all" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
