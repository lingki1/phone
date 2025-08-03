'use client';

import React from 'react';
import { ChatStatus } from './ChatStatusManager';
import './ChatStatusDisplay.css';

interface ChatStatusDisplayProps {
  status: ChatStatus;
  chatName?: string;
}

export default function ChatStatusDisplay({ status }: ChatStatusDisplayProps) {
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

  return (
    <div className="chat-status-display">
      <div className="status-main">
        <span className="status-icon online-icon">
          {getStatusIcon('online')}
        </span>
        <span className="status-text">
          {status.isOnline ? '在线' : '离线'}
        </span>
      </div>
      
      <div className="status-details">
        <span className="status-item">
          <span className="status-icon">{getStatusIcon('mood')}</span>
          <span className="status-text">{status.mood}</span>
        </span>
        
        <span className="status-separator">·</span>
        
        <span className="status-item">
          <span className="status-icon">{getStatusIcon('location')}</span>
          <span className="status-text">{status.location}</span>
        </span>
        
        <span className="status-separator">·</span>
        
        <span className="status-item">
          <span className="status-icon">{getStatusIcon('outfit')}</span>
          <span className="status-text">{status.outfit}</span>
        </span>
      </div>
    </div>
  );
} 