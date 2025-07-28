'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GroupMember, ChatItem } from '../../types/chat';
import './GroupMemberManager.css';

interface GroupMemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem;
  onUpdateChat: (chat: ChatItem) => void;
  availableContacts: ChatItem[]; // 可添加的联系人列表
}

export default function GroupMemberManager({
  isOpen,
  onClose,
  chat,
  onUpdateChat,
  availableContacts
}: GroupMemberManagerProps) {
  const [editingMember, setEditingMember] = useState<GroupMember | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
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
  const handleEditMember = (member: GroupMember) => {
    setEditingMember({ ...member });
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

  // 设置群管理员
  const handleSetAdmin = (memberId: string) => {
    // 这里可以添加设置管理员的逻辑
    console.log('设置管理员:', memberId);
    alert('管理员功能开发中...');
  };

  // 禁言成员
  const handleMuteMember = (memberId: string) => {
    // 这里可以添加禁言逻辑
    console.log('禁言成员:', memberId);
    alert('禁言功能开发中...');
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
    <div className="group-member-manager-overlay">
      <div className="group-member-manager">
        <div className="member-manager-header">
          <h3>群成员管理</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="member-manager-content">
          {!showAddMember && !editingMember && (
            <>
              <div className="member-list">
                <div className="member-list-header">
                  <h4>当前群成员 ({chat.members?.length || 0})</h4>
                  <button 
                    className="add-member-btn"
                    onClick={() => setShowAddMember(true)}
                  >
                    添加成员
                  </button>
                </div>
                
                <div className="member-items">
                  {chat.members?.map(member => (
                    <div key={member.id} className="member-item">
                      <Image 
                        src={member.avatar} 
                        alt={member.groupNickname}
                        className="member-avatar"
                        width={40}
                        height={40}
                      />
                      <div className="member-info">
                        <div className="member-name">{member.groupNickname}</div>
                        <div className="member-original-name">原名: {member.originalName}</div>
                        <div className="member-persona">{member.persona.substring(0, 50)}...</div>
                      </div>
                      <div className="member-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditMember(member)}
                        >
                          编辑
                        </button>
                        <button 
                          className="admin-btn"
                          onClick={() => handleSetAdmin(member.id)}
                          title="设置管理员"
                        >
                          👑
                        </button>
                        <button 
                          className="mute-btn"
                          onClick={() => handleMuteMember(member.id)}
                          title="禁言"
                        >
                          🔇
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(!chat.members || chat.members.length === 0) && (
                    <div className="empty-members">
                      <p>暂无群成员，点击&quot;添加成员&quot;开始邀请朋友加入群聊</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {showAddMember && (
            <div className="add-member-section">
              <div className="add-member-header">
                <h4>添加群成员</h4>
                <button 
                  className="back-btn"
                  onClick={() => setShowAddMember(false)}
                >
                  返回
                </button>
              </div>

              <div className="add-member-tabs">
                <button 
                  className="tab-btn active"
                  onClick={() => {/* 切换到现有联系人 */}}
                >
                  从联系人添加
                </button>
                <button 
                  className="tab-btn"
                  onClick={() => {/* 切换到创建新成员 */}}
                >
                  创建新成员
                </button>
              </div>

              <div className="existing-contacts">
                <h5>选择要添加的联系人</h5>
                <div className="contact-list">
                  {availableContacts
                    .filter(contact => !contact.isGroup && !chat.members?.some(m => m.originalName === contact.name))
                    .map(contact => (
                    <div key={contact.id} className="contact-item">
                      <input
                        type="checkbox"
                        id={`contact-${contact.id}`}
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts([...selectedContacts, contact.id]);
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                          }
                        }}
                      />
                      <label htmlFor={`contact-${contact.id}`} className="contact-label">
                        <Image src={contact.avatar} alt={contact.name} className="contact-avatar" width={32} height={32} />
                        <span className="contact-name">{contact.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
                
                {selectedContacts.length > 0 && (
                  <button 
                    className="confirm-add-btn"
                    onClick={handleAddExistingContacts}
                  >
                    添加选中的联系人 ({selectedContacts.length})
                  </button>
                )}
              </div>

              <div className="create-new-member" style={{ marginTop: '20px' }}>
                <h5>或者创建新的群成员</h5>
                <div className="form-group">
                  <label>成员名称</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="输入成员名称"
                  />
                </div>
                <div className="form-group">
                  <label>成员人设</label>
                  <textarea
                    value={newMemberPersona}
                    onChange={(e) => setNewMemberPersona(e.target.value)}
                    placeholder="描述这个成员的性格特点、说话风格等"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>成员头像</label>
                  <div className="avatar-upload">
                    <Image 
                      src={newMemberAvatar} 
                      alt="新成员头像"
                      className="avatar-preview"
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
                      onClick={() => document.getElementById('new-member-avatar-input')?.click()}
                    >
                      选择头像
                    </button>
                  </div>
                </div>
                <button 
                  className="create-member-btn"
                  onClick={handleCreateNewMember}
                >
                  创建成员
                </button>
              </div>
            </div>
          )}

          {editingMember && (
            <div className="edit-member-section">
              <div className="edit-member-header">
                <h4>编辑群成员</h4>
                <button 
                  className="back-btn"
                  onClick={() => setEditingMember(null)}
                >
                  返回
                </button>
              </div>

              <div className="form-group">
                <label>群昵称</label>
                <input
                  type="text"
                  value={editingMember.groupNickname}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    groupNickname: e.target.value
                  })}
                />
              </div>

              <div className="form-group">
                <label>原始名称</label>
                <input
                  type="text"
                  value={editingMember.originalName}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    originalName: e.target.value
                  })}
                />
              </div>

              <div className="form-group">
                <label>人设描述</label>
                <textarea
                  value={editingMember.persona}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    persona: e.target.value
                  })}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>头像</label>
                <div className="avatar-upload">
                  <Image 
                    src={editingMember.avatar} 
                    alt="成员头像"
                    className="avatar-preview"
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
                    onClick={() => document.getElementById('edit-member-avatar-input')?.click()}
                  >
                    更换头像
                  </button>
                </div>
              </div>

              <div className="edit-actions">
                <button 
                  className="save-btn"
                  onClick={handleSaveMemberEdit}
                >
                  保存修改
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setEditingMember(null)}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 