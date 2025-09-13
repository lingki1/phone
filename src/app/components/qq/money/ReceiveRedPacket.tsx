'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ReceiveRedPacketProps } from '../../../types/money';
import { useI18n } from '../../i18n/I18nProvider';
import './ReceiveRedPacket.css';

export default function ReceiveRedPacket({
  redPacket,
  chat,
  onClaim,
  isClaimed
}: ReceiveRedPacketProps) {
  const { t, locale } = useI18n();
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(isClaimed);
  const [showSuccess, setShowSuccess] = useState(false);
  const [senderAvatar, setSenderAvatar] = useState<string>('/avatars/default-avatar.svg');

  // 获取发送者头像
  useEffect(() => {
    const loadSenderAvatar = () => {
      if (redPacket.senderAvatarId && chat.avatarMap?.[redPacket.senderAvatarId]) {
        // 优先使用头像映射表中的数据
        setSenderAvatar(chat.avatarMap[redPacket.senderAvatarId]);
      } else {
        // 回退到使用最新的AI头像（确保头像更新后能立即显示）
        if (!chat.isGroup && chat.settings.aiAvatar) {
          setSenderAvatar(chat.settings.aiAvatar);
        } else if (chat.isGroup && chat.members) {
          // 群聊中查找对应成员的最新头像
          const member = chat.members.find(m => m.originalName === redPacket.senderName);
          setSenderAvatar(member?.avatar || '/avatars/default-avatar.svg');
        } else {
          setSenderAvatar('/avatars/default-avatar.svg');
        }
      }
    };

    loadSenderAvatar();
  }, [redPacket.senderAvatarId, redPacket.senderName, chat.avatarMap, chat.settings.aiAvatar, chat.isGroup, chat.members]);

  const handleClaim = async () => {
    if (isOpened || isOpening) return;

    setIsOpening(true);
    
    try {
      await onClaim(redPacket.id);
      setIsOpened(true);
      setShowSuccess(true);
      
      // 3秒后隐藏成功提示
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Claim red packet error:', error);
    } finally {
      setIsOpening(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(locale || 'zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="receive-red-packet">
      {/* 红包封面 */}
      <div className={`red-packet-cover ${isOpened ? 'opened' : ''}`}>
        <div className="red-packet-background">
          <div className="red-packet-pattern"></div>
          
          {/* 发送者信息 */}
          <div className="sender-info">
            <div className="sender-avatar">
              <Image
                src={senderAvatar}
                alt={redPacket.senderName}
                width={60}
                height={60}
                className="avatar-image"
              />
            </div>
            <div className="sender-name">{redPacket.senderName}</div>
            <div className="red-packet-message">
              {redPacket.message || t('QQ.ChatInterface.Money.ReceiveRedPacket.defaultMessage', '恭喜发财，大吉大利！')}
            </div>
          </div>

          {/* 红包图标 */}
          <div className="red-packet-icon-container">
            <div className={`red-packet-icon ${isOpening ? 'shaking' : ''}`}>
              🧧
            </div>
          </div>

          {/* 金额显示 */}
          {isOpened ? (
            <div className="amount-display opened">
              <div className="amount-value">¥{redPacket.amount.toFixed(2)}</div>
              <div className="claim-status">{t('QQ.ChatInterface.Money.ReceiveRedPacket.status.claimed', '已领取')}</div>
              {redPacket.claimedAt && (
                <div className="claim-time">
                  {formatTime(redPacket.claimedAt)}
                </div>
              )}
            </div>
          ) : (
            <div className="claim-hint">
              <div className="hint-text">{t('QQ.ChatInterface.Money.ReceiveRedPacket.hint.clickToOpen', '点击拆开红包')}</div>
            </div>
          )}

          {/* 点击区域 */}
          {!isOpened && (
            <div 
              className="click-area"
              onClick={handleClaim}
            >
              <div className={`claim-button ${isOpening ? 'loading' : ''}`}>
                {isOpening ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>{t('QQ.ChatInterface.Money.ReceiveRedPacket.loading.opening', '正在拆开...')}</span>
                  </div>
                ) : (
                  t('QQ.ChatInterface.Money.ReceiveRedPacket.buttons.open', '拆开红包')
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 成功动画 */}
      {showSuccess && (
        <div className="success-animation">
          <div className="success-content">
            <div className="success-icon">🎉</div>
            <div className="success-text">{t('QQ.ChatInterface.Money.ReceiveRedPacket.success.congratulations', '恭喜你获得红包')}</div>
            <div className="success-amount">¥{redPacket.amount.toFixed(2)}</div>
          </div>
          <div className="confetti">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={`confetti-piece confetti-${i % 4}`}></div>
            ))}
          </div>
        </div>
      )}

      {/* 红包详情 */}
      <div className="red-packet-details">
        <div className="detail-item">
          <span className="detail-label">{t('QQ.ChatInterface.Money.ReceiveRedPacket.details.sendTime', '发送时间:')}</span>
          <span className="detail-value">{formatTime(redPacket.timestamp)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('QQ.ChatInterface.Money.ReceiveRedPacket.details.status', '红包状态:')}</span>
          <span className={`detail-value ${isOpened ? 'claimed' : 'unclaimed'}`}>
            {isOpened ? t('QQ.ChatInterface.Money.ReceiveRedPacket.status.claimed', '已领取') : t('QQ.ChatInterface.Money.ReceiveRedPacket.status.pending', '待领取')}
          </span>
        </div>
      </div>
    </div>
  );
}