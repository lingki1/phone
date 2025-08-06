'use client';

import React from 'react';
import './AiPendingIndicator.css';

interface AiPendingIndicatorProps {
  isPending: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dots' | 'pulse' | 'wave';
  aiName?: string; // AI角色名字
}

export const AiPendingIndicator: React.FC<AiPendingIndicatorProps> = ({
  isPending,
  className = '',
  size = 'medium',
  variant = 'dots',
  aiName = 'AI'
}) => {
  if (!isPending) return null;

  const sizeClass = `ai-indicator-${size}`;
  const variantClass = `ai-indicator-${variant}`;

  return (
    <div 
      className={`ai-pending-indicator ${sizeClass} ${variantClass} ${className}`}
      title={`${aiName}正在输入中`}
    >
      {variant === 'dots' && (
        <div className="ai-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      
      {variant === 'pulse' && (
        <div className="ai-pulse">
          <div className="pulse-circle"></div>
        </div>
      )}
      
      {variant === 'wave' && (
        <div className="ai-wave">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
};

export default AiPendingIndicator; 