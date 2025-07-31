'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SendRedPacketProps } from '../../../types/money';
import './SendRedPacket.css';

export default function SendRedPacket({
  isOpen,
  onClose,
  onSend,
  currentBalance,
  recipientName
}: SendRedPacketProps) {
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('恭喜发财，大吉大利！');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 预设金额选项
  const presetAmounts = [1, 5, 10, 20, 50, 100];

  const handleAmountChange = (value: string) => {
    // 只允许数字和小数点
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setAmount(value);
      setError('');
    }
  };

  const handlePresetAmount = (presetAmount: number) => {
    setAmount(presetAmount.toString());
    setError('');
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      setError('请输入有效金额');
      return false;
    }
    
    if (numAmount <= 0) {
      setError('金额必须大于0');
      return false;
    }
    
    if (numAmount > currentBalance) {
      setError('余额不足');
      return false;
    }
    
    if (numAmount > 10000) {
      setError('单次红包金额不能超过10000元');
      return false;
    }
    
    return true;
  };

  const handleSend = async () => {
    if (!validateAmount()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onSend(parseFloat(amount), message);
      // 发送成功后重置表单
      setAmount('');
      setMessage('恭喜发财，大吉大利！');
      onClose();
    } catch (error) {
      setError('发送失败，请重试');
      console.error('Send red packet error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setAmount('');
      setMessage('恭喜发财，大吉大利！');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="send-red-packet-overlay">
      <div className="send-red-packet-modal">
        {/* 头部 */}
        <div className="red-packet-header">
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
          <h3>发红包</h3>
          <div className="recipient-info">
            <span>发给: {recipientName}</span>
          </div>
        </div>

        {/* 红包样式区域 */}
        <div className="red-packet-preview">
          <div className="red-packet-bg">
            <div className="red-packet-icon">🧧</div>
            <div className="red-packet-title">恭喜发财</div>
            <div className="red-packet-amount">
              {amount ? `¥${amount}` : '¥0.00'}
            </div>
          </div>
        </div>

        {/* 金额输入区域 */}
        <div className="amount-input-section">
          <div className="balance-info">
            <span>当前余额: ¥{currentBalance.toFixed(2)}</span>
          </div>
          
          <div className="amount-input-container">
            <span className="currency-symbol">¥</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="amount-input"
              disabled={isLoading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {/* 预设金额按钮 */}
          <div className="preset-amounts">
            {presetAmounts.map((presetAmount) => (
              <button
                key={presetAmount}
                className={`preset-btn ${parseFloat(amount) === presetAmount ? 'active' : ''}`}
                onClick={() => handlePresetAmount(presetAmount)}
                disabled={isLoading}
              >
                {presetAmount}
              </button>
            ))}
          </div>
        </div>

        {/* 祝福语输入 */}
        <div className="message-input-section">
          <label>祝福语</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="恭喜发财，大吉大利！"
            className="message-input"
            maxLength={50}
            disabled={isLoading}
          />
          <div className="message-length">{message.length}/50</div>
        </div>

        {/* 发送按钮 */}
        <div className="send-button-section">
          <button
            className="send-button"
            onClick={handleSend}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            {isLoading ? '发送中...' : '塞钱进红包'}
          </button>
        </div>
      </div>
    </div>
  );
}