'use client';

import React from 'react';
import './AiRedPacketResponse.css';

interface AiRedPacketResponseProps {
  action: 'accepted' | 'rejected';
  amount: number;
  message: string;
  timestamp: number;
}

export default function AiRedPacketResponse({
  action,
  amount,
  message,
  timestamp
}: AiRedPacketResponseProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseIcon = () => {
    return action === 'accepted' ? '✅' : '❌';
  };

  const getResponseTitle = () => {
    return action === 'accepted' ? '已接受红包' : '已拒绝红包';
  };

  const getResponseColor = () => {
    return action === 'accepted' ? 'accepted' : 'rejected';
  };

  return (
    <div className={`ai-red-packet-response ${getResponseColor()}`}>
      <div className="response-container">
        {/* 响应图标 */}
        <div className="response-icon">
          {getResponseIcon()}
        </div>

        {/* 响应内容 */}
        <div className="response-content">
          <div className="response-header">
            <span className="response-title">{getResponseTitle()}</span>
            <span className={`response-badge ${getResponseColor()}`}>
              {action === 'accepted' ? '已接受' : '已拒绝'}
            </span>
          </div>

          {/* 金额显示（接受时显示金额，拒绝时显示返还金额） */}
          {amount > 0 && (
            <div className="response-amount">
              {action === 'accepted' ? '¥' : '返还 ¥'}{amount.toFixed(2)}
            </div>
          )}

          {/* 响应消息 */}
          {message && (
            <div className="response-message">
              {message}
            </div>
          )}

          {/* 时间信息 */}
          <div className="response-time">
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
} 