'use client';

import { useState, useEffect } from 'react';
import { ChatItem, GroupMember } from '../types/chat';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: ChatItem) => void;
  availableContacts: ChatItem[];
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  availableContacts
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('/avatars/default-avatar.svg');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [myNickname, setMyNickname] = useState('');
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 选择成员

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setGroupName('');
    setGroupAvatar('/avatars/default-avatar.svg');
    setSelectedContacts([]);
    setMyNickname('');
    setStep(1);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setGroupAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      alert('请输入群名称');
      return;
    }

    if (selectedContacts.length === 0) {
      alert('请至少选择一个群成员');
      return;
    }

    // 创建群成员列表
    const members: GroupMember[] = selectedContacts.map(contactId => {
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

    // 创建新群聊
    const newGroup: ChatItem = {
      id: `group_${Date.now()}`,
      name: groupName.trim(),
      avatar: groupAvatar,
      lastMessage: '群聊已创建',
      timestamp: new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isGroup: true,
      unreadCount: 0,
      messages: [],
      persona: '这是一个群聊',
      members: members,
      groupAvatar: groupAvatar,
      settings: {
        aiPersona: '',
        myPersona: '我是群主',
        myNickname: myNickname.trim() || '群主',
        maxMemory: 20,
        aiAvatar: '/avatars/default-avatar.svg',
        myAvatar: '/avatars/user-avatar.svg',
        groupAvatar: groupAvatar,
        background: '',
        theme: 'default',
        fontSize: 16,
        customCss: '',
        linkedWorldBookIds: [],
        aiAvatarLibrary: [],
        aiAvatarFrame: '',
        myAvatarFrame: ''
      }
    };

    onCreateGroup(newGroup);
    onClose();
  };

  const handleNextStep = () => {
    if (!groupName.trim()) {
      alert('请输入群名称');
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="create-group-modal-overlay">
      <div className="create-group-modal">
        <div className="modal-header">
          <h3>创建群聊</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {step === 1 && (
            <div className="step-1">
              <div className="step-header">
                <h4>第1步: 设置群信息</h4>
              </div>

              <div className="form-group">
                <label>群名称 *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="输入群名称"
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label>群头像</label>
                <div className="avatar-upload">
                  <img 
                    src={groupAvatar} 
                    alt="群头像"
                    className="avatar-preview"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                    id="group-avatar-input"
                  />
                  <button 
                    type="button"
                    onClick={() => document.getElementById('group-avatar-input')?.click()}
                  >
                    选择头像
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>我在群里的昵称</label>
                <input
                  type="text"
                  value={myNickname}
                  onChange={(e) => setMyNickname(e.target.value)}
                  placeholder="输入你的群昵称（可选）"
                  maxLength={15}
                />
              </div>

              <div className="step-actions">
                <button 
                  className="next-btn"
                  onClick={handleNextStep}
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-2">
              <div className="step-header">
                <h4>第2步: 选择群成员</h4>
                <p>从你的联系人中选择要加入群聊的成员</p>
              </div>

              <div className="contacts-list">
                {availableContacts
                  .filter(contact => !contact.isGroup)
                  .map(contact => (
                  <div key={contact.id} className="contact-item">
                    <input
                      type="checkbox"
                      id={`contact-${contact.id}`}
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleContactToggle(contact.id)}
                    />
                    <label htmlFor={`contact-${contact.id}`} className="contact-label">
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="contact-avatar" 
                      />
                      <div className="contact-info">
                        <div className="contact-name">{contact.name}</div>
                        <div className="contact-persona">
                          {contact.persona.substring(0, 40)}...
                        </div>
                      </div>
                    </label>
                  </div>
                ))}

                {availableContacts.filter(contact => !contact.isGroup).length === 0 && (
                  <div className="no-contacts">
                    <p>暂无可添加的联系人</p>
                    <p>请先添加一些好友，然后再创建群聊</p>
                  </div>
                )}
              </div>

              <div className="selected-summary">
                已选择 {selectedContacts.length} 个成员
              </div>

              <div className="step-actions">
                <button 
                  className="prev-btn"
                  onClick={handlePrevStep}
                >
                  上一步
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreateGroup}
                  disabled={selectedContacts.length === 0}
                >
                  创建群聊
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>
      </div>
    </div>
  );
}