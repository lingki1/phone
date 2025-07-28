'use client';

import { useState, useEffect } from 'react';
import { ChatItem } from '../types/chat';
import './AddFriendModal.css';

interface EditFriendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUpdateFriend: (updatedChat: ChatItem) => void;
  chat: ChatItem | null;
}

export default function EditFriendModal({ 
  isVisible, 
  onClose, 
  onUpdateFriend,
  chat
}: EditFriendModalProps) {
  const [friendName, setFriendName] = useState('');
  const [friendPersona, setFriendPersona] = useState('');

  useEffect(() => {
    if (chat && isVisible) {
      setFriendName(chat.name);
      setFriendPersona(chat.persona || '');
    }
  }, [chat, isVisible]);

  const handleSubmit = () => {
    if (!friendName.trim()) {
      alert('请输入好友名称');
      return;
    }
    
    if (!chat) return;

    const updatedChat: ChatItem = {
      ...chat,
      name: friendName.trim(),
      persona: friendPersona.trim(),
      settings: {
        ...chat.settings,
        aiPersona: friendPersona.trim()
      }
    };
    
    onUpdateFriend(updatedChat);
    onClose();
  };

  const handleCancel = () => {
    // 重置表单
    if (chat) {
      setFriendName(chat.name);
      setFriendPersona(chat.persona || '');
    }
    onClose();
  };

  if (!isVisible || !chat) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="add-friend-modal">
        <div className="modal-header">
          <h2>编辑好友</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="friend-name">好友名称</label>
            <input
              type="text"
              id="friend-name"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="请输入Ta的名字"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="friend-persona">AI人设</label>
            <textarea
              id="friend-persona"
              value={friendPersona}
              onChange={(e) => setFriendPersona(e.target.value)}
              placeholder="描述这个AI角色的性格、背景等..."
              rows={4}
            />
          </div>

          <div className="tip-box">
            <p>💡 提示：修改后的信息将立即生效，你可以随时再次编辑。</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>取消</button>
          <button className="save-btn" onClick={handleSubmit}>保存修改</button>
        </div>
      </div>
    </div>
  );
}