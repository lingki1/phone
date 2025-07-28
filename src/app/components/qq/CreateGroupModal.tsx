'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChatItem } from '../types/chat';
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
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('/avatars/default-avatar.svg');
  const [myNickname, setMyNickname] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const resetForm = () => {
    setStep(1);
    setGroupName('');
    setGroupAvatar('/avatars/default-avatar.svg');
    setMyNickname('');
    setSelectedContacts([]);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedContacts.length === 0) return;

    const selectedContactObjects = availableContacts.filter(contact => 
      selectedContacts.includes(contact.id)
    );

    const newGroup: ChatItem = {
      id: Date.now().toString(),
      name: groupName,
      avatar: groupAvatar,
      lastMessage: '群聊已创建',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isGroup: true,
      messages: [],
      persona: '',
      settings: {
        aiPersona: '',
        myPersona: myNickname || '用户',
        maxMemory: 20,
        aiAvatar: '/avatars/default-avatar.svg',
        myAvatar: '/avatars/user-avatar.svg',
        background: 'default',
        theme: 'light',
        fontSize: 14,
        customCss: '',
        linkedWorldBookIds: [],
        aiAvatarLibrary: [],
        aiAvatarFrame: '',
        myAvatarFrame: ''
      },
      members: [
        {
          id: 'me',
          originalName: '用户',
          groupNickname: myNickname || '用户',
          avatar: '/avatars/user-avatar.svg',
          persona: '我是群主'
        },
        ...selectedContactObjects.map(contact => ({
          id: contact.id,
          originalName: contact.name,
          groupNickname: contact.name,
          avatar: contact.avatar,
          persona: contact.persona
        }))
      ]
    };

    onCreateGroup(newGroup);
    resetForm();
    onClose();
  };

  const handleNextStep = () => {
    if (groupName.trim()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>创建群聊</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="step-1">
              <div className="step-header">
                <h4>第1步: 群聊信息</h4>
                <p>设置群聊的基本信息</p>
              </div>

              <div className="form-group">
                <label>群聊名称</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="输入群聊名称"
                  maxLength={20}
                />
              </div>

              <div className="form-group">
                <label>群头像</label>
                <div className="avatar-upload">
                  <Image 
                    src={groupAvatar} 
                    alt="群头像"
                    className="avatar-preview"
                    width={60}
                    height={60}
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
                      <Image 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="contact-avatar" 
                        width={40}
                        height={40}
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