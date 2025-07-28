'use client';

import { useState } from 'react';
import './AddFriendModal.css';

interface AddFriendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddFriend: (name: string, persona: string) => void;
}

export default function AddFriendModal({ 
  isVisible, 
  onClose, 
  onAddFriend 
}: AddFriendModalProps) {
  const [friendName, setFriendName] = useState('');
  const [friendPersona, setFriendPersona] = useState('你是谁呀。');

  const handleSubmit = () => {
    if (!friendName.trim()) {
      alert('请输入好友名称');
      return;
    }
    
    onAddFriend(friendName.trim(), friendPersona.trim());
    
    // 重置表单
    setFriendName('');
    setFriendPersona('你是谁呀。');
    onClose();
  };

  const handleCancel = () => {
    // 重置表单
    setFriendName('');
    setFriendPersona('你是谁呀。');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <div className="add-friend-modal">
        <div className="modal-header">
          <h2>添加好友</h2>
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
            <label htmlFor="friend-persona">AI人设 (可选)</label>
            <textarea
              id="friend-persona"
              value={friendPersona}
              onChange={(e) => setFriendPersona(e.target.value)}
              placeholder="描述这个AI角色的性格、背景等..."
              rows={4}
            />
          </div>

          <div className="tip-box">
            <p>💡 提示：添加好友后，你可以在聊天设置中进一步自定义AI的人设、头像等信息。</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel}>取消</button>
          <button className="save-btn" onClick={handleSubmit}>添加好友</button>
        </div>
      </div>
    </div>
  );
} 