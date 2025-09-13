'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatStatus } from './ChatStatusManager';
import { useI18n } from '../../i18n/I18nProvider';
import './ChatStatusDisplay.css';

interface ChatStatusDisplayProps {
  status: ChatStatus;
  chatName?: string;
}

export default function ChatStatusDisplay({ status }: ChatStatusDisplayProps) {
  const { t } = useI18n();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && triggerRef.current && 
          !tooltipRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // 计算弹窗位置
  const calculateTooltipPosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = triggerRect.bottom + 8; // 触发器下方8px
    let left = triggerRect.left;
    
    // 如果是移动端，使用不同的定位策略
    if (isMobile) {
      // 移动端：在触发器下方居中显示
      const tooltipWidth = 200; // 预估弹窗宽度
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
      
      // 确保不超出屏幕右边界
      if (left + tooltipWidth > viewportWidth - 16) {
        left = viewportWidth - tooltipWidth - 16;
      }
      
      // 确保不超出屏幕左边界
      if (left < 16) {
        left = 16;
      }
      
      // 如果下方空间不够，显示在上方
      if (top + 120 > viewportHeight) { // 预估弹窗高度120px
        top = triggerRect.top - 120 - 8;
      }
    } else {
      // 桌面端：在触发器右下方显示
      const tooltipWidth = 180;
      
      // 如果右侧空间不够，显示在左侧
      if (left + tooltipWidth > viewportWidth - 16) {
        left = triggerRect.right - tooltipWidth;
      }
      
      // 如果下方空间不够，显示在上方
      if (top + 100 > viewportHeight) {
        top = triggerRect.top - 100 - 8;
      }
    }
    
    setTooltipPosition({ top, left });
  };

  const getStatusIcon = (type: 'online' | 'mood' | 'location' | 'outfit') => {
    switch (type) {
      case 'online':
        return status.isOnline ? '🟢' : '🔴';
      case 'mood':
        return '😊';
      case 'location':
        return '📍';
      case 'outfit':
        return '👕';
      default:
        return '';
    }
  };

  const handleTriggerClick = () => {
    if (isMobile) {
      if (!showTooltip) {
        calculateTooltipPosition();
      }
      setShowTooltip(!showTooltip);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      calculateTooltipPosition();
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowTooltip(false);
    }
  };

  return (
    <div className="chat-status-display">
      {/* 桌面端显示在线状态 */}
      <div className="status-main desktop-only">
        <span className="status-icon online-icon">
          {getStatusIcon('online')}
        </span>
        <span className="status-text">
          {status.isOnline ? t('QQ.ChatInterface.status.online', '在线') : t('QQ.ChatInterface.status.offline', '离线')}
        </span>
      </div>
      
      {/* 整合状态触发器 */}
      <div 
        ref={triggerRef}
        className="status-trigger"
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="status-icon">{getStatusIcon('mood')}</span>
        <span className="status-text">{t('QQ.ChatInterface.status.status', '状态')}</span>
        <span className="status-arrow">▼</span>
      </div>

      {/* 悬浮弹窗 */}
      {showTooltip && (
        <div 
          ref={tooltipRef} 
          className="status-tooltip"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className="status-detail-item">
            <span className="status-icon">{getStatusIcon('mood')}</span>
            <span className="status-label">{t('QQ.ChatInterface.status.mood', '心情')}:</span>
            <span className="status-value">{status.mood}</span>
          </div>
          
          <div className="status-detail-item">
            <span className="status-icon">{getStatusIcon('location')}</span>
            <span className="status-label">{t('QQ.ChatInterface.status.location', '位置')}:</span>
            <span className="status-value">{status.location}</span>
          </div>
          
          <div className="status-detail-item">
            <span className="status-icon">{getStatusIcon('outfit')}</span>
            <span className="status-label">{t('QQ.ChatInterface.status.outfit', '穿着')}:</span>
            <span className="status-value">{status.outfit}</span>
          </div>
        </div>
      )}
    </div>
  );
} 