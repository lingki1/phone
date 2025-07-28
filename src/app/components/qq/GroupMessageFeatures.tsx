'use client';

import { useState } from 'react';
import { Message, ChatItem, PollMessage, RedPacketMessage } from '../../types/chat';
import './GroupMessageFeatures.css';

interface GroupMessageFeaturesProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatItem;
  onSendMessage: (message: Message) => void;
}

export default function GroupMessageFeatures({
  isOpen,
  onClose,
  chat,
  onSendMessage
}: GroupMessageFeaturesProps) {
  const [activeFeature, setActiveFeature] = useState<'poll' | 'notice' | 'redpacket' | null>(null);
  
  // 投票功能状态
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  // 群公告状态
  const [noticeContent, setNoticeContent] = useState('');
  
  // 红包功能状态
  const [redPacketType, setRedPacketType] = useState<'lucky' | 'direct'>('lucky');
  const [redPacketAmount, setRedPacketAmount] = useState('');
  const [redPacketCount, setRedPacketCount] = useState('');
  const [redPacketGreeting, setRedPacketGreeting] = useState('恭喜发财，大吉大利！');
  const [redPacketReceiver, setRedPacketReceiver] = useState('');

  if (!isOpen) return null;

  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2) {
      alert('请输入投票问题和至少两个选项');
      return;
    }

    const validOptions = pollOptions.filter(opt => opt.trim());
    const pollMessage: PollMessage = {
      id: Date.now().toString(),
      role: 'system',
      content: `发起了投票：${pollQuestion}`,
      timestamp: Date.now(),
      type: 'poll',
      question: pollQuestion,
      options: validOptions,
      votes: {},
      isClosed: false,
      senderName: '我',
      senderAvatar: '/avatars/user-avatar.svg'
    };

    onSendMessage(pollMessage);
    resetPollForm();
    onClose();
  };

  const handleSendNotice = () => {
    if (!noticeContent.trim()) {
      alert('请输入公告内容');
      return;
    }

    const noticeMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: `📢 群公告：${noticeContent}`,
      timestamp: Date.now(),
      senderName: '我',
      senderAvatar: '/avatars/user-avatar.svg',
      type: 'text'
    };

    // 同时更新群聊的公告
    // const updatedChat = {
    //   ...chat,
    //   notice: noticeContent
    // };

    onSendMessage(noticeMessage);
    setNoticeContent('');
    onClose();
  };

  const handleSendRedPacket = () => {
    const amount = parseFloat(redPacketAmount);
    const count = parseInt(redPacketCount);

    if (!amount || amount <= 0) {
      alert('请输入有效的红包金额');
      return;
    }

    if (redPacketType === 'lucky' && (!count || count <= 0 || count > 100)) {
      alert('拼手气红包数量应在1-100之间');
      return;
    }

    if (redPacketType === 'direct' && !redPacketReceiver) {
      alert('请选择专属红包接收者');
      return;
    }

    const redPacketMessage: RedPacketMessage = {
      id: Date.now().toString(),
      role: 'system',
      content: redPacketType === 'lucky' 
        ? `发了一个拼手气红包，金额${amount}元，共${count}个` 
        : `给 ${redPacketReceiver} 发了专属红包，金额${amount}元`,
      timestamp: Date.now(),
      type: 'red_packet',
      packetType: redPacketType,
      totalAmount: amount,
      count: redPacketType === 'lucky' ? count : 1,
      greeting: redPacketGreeting,
      receiverName: redPacketType === 'direct' ? redPacketReceiver : undefined,
      claimedBy: {},
      isFullyClaimed: false,
      senderName: '我',
      senderAvatar: '/avatars/user-avatar.svg'
    };

    onSendMessage(redPacketMessage);
    resetRedPacketForm();
    onClose();
  };

  const resetPollForm = () => {
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const resetRedPacketForm = () => {
    setRedPacketAmount('');
    setRedPacketCount('');
    setRedPacketGreeting('恭喜发财，大吉大利！');
    setRedPacketReceiver('');
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <div className="group-features-overlay" onClick={onClose}>
      <div className="group-features-modal" onClick={(e) => e.stopPropagation()}>
        <div className="group-features-header">
          <h3>群功能</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!activeFeature ? (
          <div className="features-menu">
            <button 
              className="feature-btn"
              onClick={() => setActiveFeature('poll')}
            >
              <span className="feature-icon">📊</span>
              <div className="feature-info">
                <div className="feature-name">群投票</div>
                <div className="feature-desc">发起群投票，收集大家意见</div>
              </div>
            </button>

            <button 
              className="feature-btn"
              onClick={() => setActiveFeature('notice')}
            >
              <span className="feature-icon">📢</span>
              <div className="feature-info">
                <div className="feature-name">群公告</div>
                <div className="feature-desc">发布重要通知给群成员</div>
              </div>
            </button>

            <button 
              className="feature-btn"
              onClick={() => setActiveFeature('redpacket')}
            >
              <span className="feature-icon">🧧</span>
              <div className="feature-info">
                <div className="feature-name">红包</div>
                <div className="feature-desc">发红包给群成员</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="feature-content">
            {activeFeature === 'poll' && (
              <div className="poll-creator">
                <div className="form-group">
                  <label>投票问题</label>
                  <input 
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="请输入投票问题..."
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label>投票选项</label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="option-input">
                      <input 
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`选项 ${index + 1}`}
                        maxLength={50}
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          className="remove-option"
                          onClick={() => removePollOption(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {pollOptions.length < 6 && (
                    <button className="add-option" onClick={addPollOption}>
                      + 添加选项
                    </button>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setActiveFeature(null)}
                  >
                    返回
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreatePoll}
                  >
                    发起投票
                  </button>
                </div>
              </div>
            )}

            {activeFeature === 'notice' && (
              <div className="notice-creator">
                <div className="form-group">
                  <label>公告内容</label>
                  <textarea 
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="请输入群公告内容..."
                    rows={6}
                    maxLength={200}
                  />
                  <div className="char-count">
                    {noticeContent.length}/200
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setActiveFeature(null)}
                  >
                    返回
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSendNotice}
                  >
                    发布公告
                  </button>
                </div>
              </div>
            )}

            {activeFeature === 'redpacket' && (
              <div className="redpacket-creator">
                <div className="form-group">
                  <label>红包类型</label>
                  <div className="radio-group">
                    <label className="radio-item">
                      <input 
                        type="radio"
                        value="lucky"
                        checked={redPacketType === 'lucky'}
                        onChange={(e) => setRedPacketType(e.target.value as 'lucky')}
                      />
                      <span>拼手气红包</span>
                    </label>
                    <label className="radio-item">
                      <input 
                        type="radio"
                        value="direct"
                        checked={redPacketType === 'direct'}
                        onChange={(e) => setRedPacketType(e.target.value as 'direct')}
                      />
                      <span>专属红包</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>红包金额</label>
                  <input 
                    type="number"
                    value={redPacketAmount}
                    onChange={(e) => setRedPacketAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    max="200"
                    step="0.01"
                  />
                </div>

                {redPacketType === 'lucky' && (
                  <div className="form-group">
                    <label>红包个数</label>
                    <input 
                      type="number"
                      value={redPacketCount}
                      onChange={(e) => setRedPacketCount(e.target.value)}
                      placeholder="1"
                      min="1"
                      max="100"
                    />
                  </div>
                )}

                {redPacketType === 'direct' && (
                  <div className="form-group">
                    <label>接收者</label>
                    <select 
                      value={redPacketReceiver}
                      onChange={(e) => setRedPacketReceiver(e.target.value)}
                    >
                      <option value="">请选择接收者</option>
                      {chat.members?.map(member => (
                        <option key={member.id} value={member.groupNickname}>
                          {member.groupNickname}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>红包祝福语</label>
                  <input 
                    type="text"
                    value={redPacketGreeting}
                    onChange={(e) => setRedPacketGreeting(e.target.value)}
                    placeholder="恭喜发财，大吉大利！"
                    maxLength={30}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setActiveFeature(null)}
                  >
                    返回
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleSendRedPacket}
                  >
                    发红包
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 