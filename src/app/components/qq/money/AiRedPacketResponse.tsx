'use client';

import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
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
  const { t, locale } = useI18n();
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(locale || 'zh-CN', {
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
    return action === 'accepted' ? t('QQ.ChatInterface.Money.AiRedPacketResponse.title.accepted', '已接受红包') : t('QQ.ChatInterface.Money.AiRedPacketResponse.title.rejected', '已拒绝红包');
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
              {action === 'accepted' ? t('QQ.ChatInterface.Money.AiRedPacketResponse.badge.accepted', '已接受') : t('QQ.ChatInterface.Money.AiRedPacketResponse.badge.rejected', '已拒绝')}
            </span>
          </div>

          {/* 金额显示（接受时显示金额，拒绝时显示返还金额） */}
          {amount > 0 && (
            <div className="response-amount">
              {action === 'accepted' ? '¥' : t('QQ.ChatInterface.Money.AiRedPacketResponse.amount.return', '返还 ¥')}{amount.toFixed(2)}
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