'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChatItem } from '../../types/chat';
import './GroupSettings.css';

interface GroupSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem;
  onUpdateChat: (chat: ChatItem) => void;
}

export default function GroupSettings({
  isOpen,
  onClose,
  chat,
  onUpdateChat
}: GroupSettingsProps) {
  const [groupName, setGroupName] = useState(chat.name);
  const [groupAvatar, setGroupAvatar] = useState(chat.avatar);
  const [groupNotice, setGroupNotice] = useState(chat.notice || '');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, notice, members

  useEffect(() => {
    if (isOpen) {
      setGroupName(chat.name);
      setGroupAvatar(chat.avatar);
      setGroupNotice(chat.notice || '');
      setIsEditing(false);
    }
  }, [isOpen, chat]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedChat = {
      ...chat,
      name: groupName,
      avatar: groupAvatar,
      notice: groupNotice
    };
    onUpdateChat(updatedChat);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setGroupName(chat.name);
    setGroupAvatar(chat.avatar);
    setGroupNotice(chat.notice || '');
    setIsEditing(false);
  };

  const avatarOptions = [
    '/avatars/default-avatar.svg',
    '/avatars/user-avatar.svg',
    '/avatars/user-avatar.png'
  ];

  return (
    <div className="group-settings-overlay" onClick={onClose}>
      <div className="group-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="group-settings-header">
          <h3>群聊设置</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="group-settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            基本信息
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notice' ? 'active' : ''}`}
            onClick={() => setActiveTab('notice')}
          >
            群公告
          </button>
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            群成员
          </button>
        </div>

        <div className="group-settings-content">
          {activeTab === 'basic' && (
            <div className="basic-settings">
              <div className="setting-item">
                <label>群头像</label>
                <div className="avatar-setting">
                  <Image 
                    src={groupAvatar}
                    alt="群头像"
                    width={60}
                    height={60}
                    className="current-avatar"
                  />
                  {isEditing && (
                    <div className="avatar-options">
                      {avatarOptions.map((avatar, index) => (
                        <Image 
                          key={index}
                          src={avatar}
                          alt={`头像选项${index + 1}`}
                          width={40}
                          height={40}
                          className={`avatar-option ${avatar === groupAvatar ? 'selected' : ''}`}
                          onClick={() => setGroupAvatar(avatar)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="setting-item">
                <label>群名称</label>
                <input 
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isEditing}
                  className="group-name-input"
                  maxLength={20}
                />
              </div>

              <div className="setting-item">
                <label>群ID</label>
                <div className="group-id">{chat.id}</div>
              </div>

              <div className="setting-item">
                <label>创建时间</label>
                <div className="create-time">
                  {new Date(parseInt(chat.id)).toLocaleDateString('zh-CN')}
                </div>
              </div>

              <div className="setting-item">
                <label>群成员数量</label>
                <div className="member-count">
                  {chat.members ? chat.members.length : 0}人
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notice' && (
            <div className="notice-settings">
              <div className="setting-item">
                <label>群公告</label>
                <textarea 
                  value={groupNotice}
                  onChange={(e) => setGroupNotice(e.target.value)}
                  disabled={!isEditing}
                  className="group-notice-input"
                  placeholder="暂无群公告"
                  rows={6}
                  maxLength={200}
                />
                <div className="char-count">
                  {groupNotice.length}/200
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-settings">
              <div className="members-list">
                {chat.members?.map((member, index) => (
                  <div key={member.id} className="member-item">
                    <Image 
                      src={member.avatar}
                      alt={member.groupNickname}
                      width={40}
                      height={40}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <div className="member-name">{member.groupNickname}</div>
                      <div className="member-original-name">({member.originalName})</div>
                    </div>
                    {index === 0 && (
                      <div className="member-role">群主</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="group-settings-footer">
          {!isEditing ? (
            <button 
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              编辑
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                取消
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
              >
                保存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 