'use client';

import { useState, useEffect } from 'react';
import { Announcement, AnnouncementEditorProps } from './types';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from './announcementService';
import './AnnouncementEditor.css';

export default function AnnouncementEditor({ 
  isOpen, 
  onClose, 
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
  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement || !editingAnnouncement.title.trim()) {
      alert('请填写公告标题');
      return;
    }

    try {
      if (isCreating) {
        // 创建新公告
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...createData } = editingAnnouncement;
        const newAnnouncement = await createAnnouncement(createData);
        if (newAnnouncement) {
          setAnnouncements(prev => [...prev, newAnnouncement]);
          alert('公告创建成功！');
        } else {
          alert('创建公告失败，请重试');
          return;
        }
      } else {
        // 更新现有公告
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...updateData } = editingAnnouncement;
        const updatedAnnouncement = await updateAnnouncement(id, updateData);
        if (updatedAnnouncement) {
          setAnnouncements(prev => 
            prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a)
          );
          alert('公告更新成功！');
        } else {
          alert('更新公告失败，请重试');
          return;
        }
      }

      setEditingAnnouncement(null);
      setIsCreating(false);
    } catch (error) {
      console.error('保存公告失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 删除公告
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条公告吗？')) {
      try {
        const success = await deleteAnnouncement(id);
        if (success) {
          setAnnouncements(prev => prev.filter(a => a.id !== id));
          alert('公告删除成功！');
        } else {
          alert('删除公告失败，请重试');
        }
      } catch (error) {
        console.error('删除公告失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // 切换公告状态
  const handleToggleActive = async (id: string) => {
    try {
      const announcement = announcements.find(a => a.id === id);
      if (!announcement) return;

      const success = await updateAnnouncement(id, { isActive: !announcement.isActive });
      if (success) {
        setAnnouncements(prev => 
          prev.map(a => 
            a.id === id ? { ...a, isActive: !a.isActive, updatedAt: new Date() } : a
          )
        );
        alert(`公告已${!announcement.isActive ? '启用' : '禁用'}`);
      } else {
        alert('状态更新失败，请重试');
      }
    } catch (error) {
      console.error('切换公告状态失败:', error);
      alert('状态更新失败，请重试');
    }
  };

  // 保存所有更改 - 现在不需要了，因为每个操作都是实时保存的
  const handleSaveAll = () => {
    alert('所有更改已实时保存！');
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
