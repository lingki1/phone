'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GroupMember, ChatItem } from '../../types/chat';
import PersonalSettingsModal from './PersonalSettingsModal';
import './GroupMemberManager.css';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface GroupMemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem;
  onUpdateChat: (chat: ChatItem) => void;
  availableContacts: ChatItem[]; // 可添加的联系人列表
  personalSettings?: PersonalSettings;
  onUpdatePersonalSettings?: (settings: PersonalSettings) => void;
}

export default function GroupMemberManager({
  isOpen,
  onClose,
  chat,
  onUpdateChat,
  availableContacts,
  personalSettings,
  onUpdatePersonalSettings
}: GroupMemberManagerProps) {
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showPersonalSettings, setShowPersonalSettings] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPersona, setNewMemberPersona] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('/avatars/default-avatar.svg');

  useEffect(() => {
    if (!isOpen) {
      setEditingMember(null);
      setShowAddMember(false);
      setSelectedContacts([]);
      resetNewMemberForm();
    }
  }, [isOpen]);

  const resetNewMemberForm = () => {
    setNewMemberName('');
    setNewMemberPersona('');
    setNewMemberAvatar('/avatars/default-avatar.svg');
  };

  // 移除群成员
  const handleRemoveMember = (memberId: string) => {
    if (!chat.members) return;
    
    const memberToRemove = chat.members.find(m => m.id === memberId);
    if (!memberToRemove) return;
    
    if (confirm(`确定要移除 ${memberToRemove.groupNickname} 吗？移除后该成员将无法继续参与群聊。`)) {
    const updatedMembers = chat.members.filter(m => m.id !== memberId);
    const updatedChat = {
      ...chat,
      members: updatedMembers
    };
    onUpdateChat(updatedChat);
    }
  };

  // 编辑群成员
  const handleEditMember = (member: GroupMember, memberIndex: number) => {
    // 如果是群主（第一个成员），打开个人设置
    if (memberIndex === 0 && personalSettings && onUpdatePersonalSettings) {
      setShowPersonalSettings(true);
    } else {
      // 其他成员使用普通编辑
      setEditingMember({ ...member });
    }
  };

  // 保存成员编辑
  const handleSaveMemberEdit = () => {
    if (!editingMember || !chat.members) return;

    const updatedMembers = chat.members.map(m => 
      m.id === editingMember.id ? editingMember : m
    );
    const updatedChat = {
      ...chat,
      members: updatedMembers
    };
    onUpdateChat(updatedChat);
    setEditingMember(null);
  };

  // 从现有联系人添加群成员
  const handleAddExistingContacts = () => {
    if (selectedContacts.length === 0) return;

    const newMembers: GroupMember[] = selectedContacts.map(contactId => {
      const contact = availableContacts.find(c => c.id === contactId);
      if (!contact) return null;

      return {
        id: `member_${Date.now()}_${Math.random()}`,
        originalName: contact.name,
        groupNickname: contact.name,
        avatar: contact.avatar,
        persona: contact.persona
      };
    }).filter(Boolean) as GroupMember[];

    const updatedMembers = [...(chat.members || []), ...newMembers];
    const updatedChat = {
      ...chat,
      members: updatedMembers
    };
    onUpdateChat(updatedChat);
    setSelectedContacts([]);
    setShowAddMember(false);
  };

  // 创建新群成员
  const handleCreateNewMember = () => {
    if (!newMemberName.trim() || !newMemberPersona.trim()) {
      alert('请填写完整的成员信息');
      return;
    }

    const newMember: GroupMember = {
      id: `member_${Date.now()}_${Math.random()}`,
      originalName: newMemberName.trim(),
      groupNickname: newMemberName.trim(),
      avatar: newMemberAvatar,
      persona: newMemberPersona.trim()
    };

    const updatedMembers = [...(chat.members || []), newMember];
    const updatedChat = {
      ...chat,
      members: updatedMembers
    };
    onUpdateChat(updatedChat);
    resetNewMemberForm();
    setShowAddMember(false);
  };


  // 处理头像上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>, isForEdit = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (isForEdit && editingMember) {
        setEditingMember({ ...editingMember, avatar: result });
      } else {
        setNewMemberAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="groupmember-overlay">
      <div className="groupmember-container">
        <div className="groupmember-header">
          <h3 className="groupmember-header-title">群成员管理</h3>
          <button className="groupmember-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="groupmember-content">
          {!showAddMember && !editingMember && (
            <>
              <div className="groupmember-list">
                <div className="groupmember-list-header">
                  <h4 className="groupmember-list-title">当前群成员 ({chat.members?.length || 0})</h4>
                  <button 
                    className="groupmember-add-btn"
                    onClick={() => setShowAddMember(true)}
                  >
                    添加成员
                  </button>
                </div>
                
                <div className="groupmember-list">
                  {chat.members?.map((member, index) => (
                    <div key={member.id} className="groupmember-item">
                      <Image 
                        src={member.avatar} 
                        alt={member.groupNickname}
                        className="groupmember-avatar"
                        width={40}
                        height={40}
                      />
                      <div className="groupmember-info">
                        <div className="groupmember-name">{member.groupNickname}</div>
                        <div className="groupmember-original-name">原名: {member.originalName}</div>
                        <div className="groupmember-persona">{member.persona.substring(0, 50)}...</div>
                      </div>
                      <div className="groupmember-actions">
                        <button 
                          className="groupmember-action-btn groupmember-edit-btn"
                          onClick={() => handleEditMember(member, index)}
                        >
                          {index === 0 ? '个人设置' : '编辑'}
                        </button>
                        <button 
                          className="groupmember-action-btn groupmember-remove-btn"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(!chat.members || chat.members.length === 0) && (
                    <div className="groupmember-empty">
                      <div className="groupmember-empty-text">暂无群成员</div>
                      <div className="groupmember-empty-hint">点击&quot;添加成员&quot;开始邀请朋友加入群聊</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {showAddMember && (
            <div className="groupmember-add-section">
              <div className="groupmember-add-header">
                <h4 className="groupmember-add-title">添加群成员</h4>
                <button 
                  className="groupmember-back-btn"
                  onClick={() => setShowAddMember(false)}
                >
                  返回
                </button>
              </div>

              <div className="groupmember-tabs">
                <button 
                  className="groupmember-tab active"
                  onClick={() => {/* 切换到现有联系人 */}}
                >
                  从联系人添加
                </button>
                <button 
                  className="groupmember-tab"
                  onClick={() => {/* 切换到创建新成员 */}}
                >
                  创建新成员
                </button>
              </div>

              <div className="groupmember-contacts-section">
                <h5 className="groupmember-contacts-title">选择要添加的联系人</h5>
                <div className="groupmember-contacts-list">
                  {availableContacts
                    .filter(contact => !contact.isGroup && !chat.members?.some(m => m.originalName === contact.name))
                    .map(contact => (
                    <div key={contact.id} className="groupmember-contact-item">
                      <input
                        type="checkbox"
                        id={`contact-${contact.id}`}
                        className="groupmember-contact-checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact.id]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                          }
                        }}
                      />
                      <label htmlFor={`contact-${contact.id}`} className="groupmember-contact-label">
                        <Image src={contact.avatar} alt={contact.name} className="groupmember-contact-avatar" width={32} height={32} />
                        <span className="groupmember-contact-name">{contact.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                {selectedContacts.length > 0 && (
                  <button 
                    className="groupmember-confirm-btn"
                    onClick={handleAddExistingContacts}
                  >
                    添加选中的联系人 ({selectedContacts.length})
                  </button>
                )}
              </div>

              <div className="groupmember-create-section" style={{ marginTop: '20px' }}>
                <h5 className="groupmember-create-title">或者创建新的群成员</h5>
                <div className="groupmember-form-group">
                  <label className="groupmember-form-label">成员名称</label>
                  <input
                    type="text"
                    className="groupmember-form-input"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="输入成员名称"
                  />
                </div>
                <div className="groupmember-form-group">
                  <label className="groupmember-form-label">成员人设</label>
                  <textarea
                    className="groupmember-form-textarea"
                    value={newMemberPersona}
                    onChange={(e) => setNewMemberPersona(e.target.value)}
                    placeholder="描述这个成员的性格特点、说话风格等"
                    rows={3}
                  />
                </div>
                <div className="groupmember-form-group">
                  <label className="groupmember-form-label">成员头像</label>
                  <div className="groupmember-avatar-upload">
                    <Image 
                      src={newMemberAvatar} 
                      alt="新成员头像"
                      className="groupmember-avatar-preview"
                      width={60}
                      height={60}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarUpload(e, false)}
                      style={{ display: 'none' }}
                      id="new-member-avatar-input"
                    />
                    <button 
                      type="button"
                      className="groupmember-avatar-upload-btn"
                      onClick={() => document.getElementById('new-member-avatar-input')?.click()}
                    >
                      选择头像
                    </button>
                  </div>
                </div>
                <button 
                  className="groupmember-create-btn"
                  onClick={handleCreateNewMember}
                >
                  创建成员
                </button>
              </div>
            </div>
          )}

          {editingMember && (
            <div className="groupmember-edit-section">
              <div className="groupmember-edit-header">
                <h4 className="groupmember-edit-title">编辑群成员</h4>
                <button 
                  className="groupmember-back-btn"
                  onClick={() => setEditingMember(null)}
                >
                  返回
                </button>
              </div>

              <div className="groupmember-form-group">
                <label className="groupmember-form-label">群昵称</label>
                <input
                  type="text"
                  className="groupmember-form-input"
                  value={editingMember.groupNickname}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    groupNickname: e.target.value
                  })}
                />
              </div>

              <div className="groupmember-form-group">
                <label className="groupmember-form-label">原始名称</label>
                <input
                  type="text"
                  className="groupmember-form-input"
                  value={editingMember.originalName}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    originalName: e.target.value
                  })}
                />
              </div>

              <div className="groupmember-form-group">
                <label className="groupmember-form-label">人设描述</label>
                <textarea
                  className="groupmember-form-textarea"
                  value={editingMember.persona}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    persona: e.target.value
                  })}
                  rows={4}
                />
              </div>

              <div className="groupmember-form-group">
                <label className="groupmember-form-label">头像</label>
                <div className="groupmember-avatar-upload">
                  <Image 
                    src={editingMember.avatar} 
                    alt="成员头像"
                    className="groupmember-avatar-preview"
                    width={60}
                    height={60}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarUpload(e, true)}
                    style={{ display: 'none' }}
                    id="edit-member-avatar-input"
                  />
                  <button 
                    type="button"
                    className="groupmember-avatar-upload-btn"
                    onClick={() => document.getElementById('edit-member-avatar-input')?.click()}
                  >
                    更换头像
                  </button>
                </div>
              </div>

              <div className="groupmember-edit-actions">
                <button 
                  className="groupmember-save-btn"
                  onClick={handleSaveMemberEdit}
                >
                  保存修改
                </button>
                <button 
                  className="groupmember-cancel-btn"
                  onClick={() => setEditingMember(null)}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 个人设置模态框 */}
      {personalSettings && onUpdatePersonalSettings && (
        <PersonalSettingsModal
          isVisible={showPersonalSettings}
          onClose={() => setShowPersonalSettings(false)}
          onSave={(settings) => {
            onUpdatePersonalSettings(settings);
            setShowPersonalSettings(false);
          }}
          currentSettings={personalSettings}
        />
      )}
    </div>
  );
} 