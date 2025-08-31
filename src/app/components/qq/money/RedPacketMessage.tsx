'use client';

import React, { useState } from 'react';
import { Message, ChatItem } from '../../../types/chat';
import ReceiveRedPacket from './ReceiveRedPacket';
import './RedPacketMessage.css';

interface RedPacketMessageProps {
  message: Message;
  chat: ChatItem; // 添加chat参数以访问avatarMap
  onClaim?: (redPacketId: string) => Promise<void>;
  onSend?: () => void;
  isUserMessage?: boolean;
}

export default function RedPacketMessage({
  message,
  chat,
  onClaim,
  onSend,
  isUserMessage = false
}: RedPacketMessageProps) {
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  if (!message.redPacketData) {
    return null;
  }

  const { redPacketData } = message;

  const handleRedPacketClick = () => {
    if (message.type === 'red_packet_receive' && onClaim) {
      setShowReceiveModal(true);
    } else if (message.type === 'red_packet_request' && onSend) {
      onSend();
    }
  };

  const handleClaimRedPacket = async (redPacketId: string) => {
    if (onClaim) {
      await onClaim(redPacketId);
      setShowReceiveModal(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRedPacketIcon = () => {
    switch (message.type) {
      case 'red_packet_send':
        return '📤';
      case 'red_packet_receive':
        return '🧧';
      case 'red_packet_request':
        return '🙏';
      default:
        return '🧧';
    }
  };

  const getRedPacketTitle = () => {
    switch (message.type) {
      case 'red_packet_send':
        return '发出红包';
      case 'red_packet_receive':
        return redPacketData.isClaimed ? '红包已领取' : '收到红包';
      case 'red_packet_request':
        return '请求红包';
      default:
        return '红包消息';
    }
  };

  const getRedPacketStatus = () => {
    if (message.type === 'red_packet_receive') {
      return redPacketData.isClaimed ? 'claimed' : 'unclaimed';
    }
    return 'normal';
  };

  const getStatusDisplay = () => {
    // 删除待处理状态，不再显示状态标签
    return null;
  };

  return (
    <>
      <div
        className={`red-packet-message ${message.type} ${getRedPacketStatus()} ${isUserMessage ? 'user' : 'ai'}`}
        onClick={handleRedPacketClick}
      >
        {/* 红包图标 */}
        <div className="red-packet-icon">
          {getRedPacketIcon()}
        </div>

        {/* 红包内容 */}
        <div className="red-packet-content">
          <div className="red-packet-header">
            <span className="red-packet-title">{getRedPacketTitle()}</span>
            {message.type === 'red_packet_receive' && !redPacketData.isClaimed && (
              <span className="red-packet-badge">待领取</span>
            )}
            {message.type === 'red_packet_receive' && redPacketData.isClaimed && (
              <span className="red-packet-badge claimed">已领取</span>
            )}
            {getStatusDisplay()}
          </div>

          {/* 金额显示 */}
          {(message.type === 'red_packet_send' || message.type === 'red_packet_receive') && (
            <div className="red-packet-amount">
              ¥{redPacketData.amount.toFixed(2)}
            </div>
          )}

          {/* 祝福语或请求消息 */}
          {redPacketData.message && (
            <div className="red-packet-message-text">
              {redPacketData.message}
            </div>
          )}

          {/* 发送者/接收者信息 */}
          <div className="red-packet-info">
            {message.type === 'red_packet_send' && (
              <span className="info-text">发给 {redPacketData.recipientName}</span>
            )}
            {message.type === 'red_packet_receive' && (
              <span className="info-text">来自 {redPacketData.senderName}</span>
            )}
            {message.type === 'red_packet_request' && (
              <span className="info-text">向你请求红包</span>
            )}
          </div>

          {/* 时间信息 */}
          <div className="red-packet-time">
            {formatTime(message.timestamp)}
            {redPacketData.isClaimed && redPacketData.claimedAt && (
              <span className="claim-time">
                · 领取于 {formatTime(redPacketData.claimedAt)}
              </span>
            )}
          </div>
        </div>

        {/* 操作提示 */}
        <div className="red-packet-action">
          {message.type === 'red_packet_receive' && !redPacketData.isClaimed && (
            <div className="action-hint">点击领取</div>
          )}
          {message.type === 'red_packet_request' && (
            <div className="action-hint">点击发送</div>
          )}
        </div>

        {/* 红包装饰效果 */}
        {message.type === 'red_packet_receive' && !redPacketData.isClaimed && (
          <div className="red-packet-glow"></div>
        )}
      </div>

      {/* 接收红包模态框 */}
      {showReceiveModal && message.redPacketData && (
        <div className="red-packet-modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="red-packet-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="redpacket-modal-close-btn"
              onClick={() => setShowReceiveModal(false)}
            >
              ×
            </button>
            <ReceiveRedPacket
              redPacket={{
                id: message.redPacketData.id,
                amount: message.redPacketData.amount,
                message: message.redPacketData.message,
                senderName: message.redPacketData.senderName,
                senderAvatarId: message.senderAvatarId, // 使用消息中的头像ID引用
                recipientName: message.redPacketData.recipientName,
                chatId: message.id, // 使用消息ID作为chatId
                timestamp: message.timestamp,
                isClaimed: message.redPacketData.isClaimed,
                claimedAt: message.redPacketData.claimedAt
              }}
              chat={chat} // 传递chat对象以访问avatarMap
              onClaim={handleClaimRedPacket}
              isClaimed={message.redPacketData.isClaimed}
            />
          </div>
        </div>
      )}
    </>
  );
}