'use client';

import React from 'react';
import './ExtraInfoDisplay.css';
import { useI18n } from '../../i18n/I18nProvider';

interface ExtraInfoDisplayProps {
  message: {
    id: string;
    type: 'extra_info';
    htmlContent: string;
    timestamp: number;
    description: string;
  };
  chatName: string;
}

export default function ExtraInfoDisplay({ message }: ExtraInfoDisplayProps) {
  const { t } = useI18n();
  // 安全地渲染HTML内容
  const renderHTMLContent = () => {
    try {
      // 创建一个临时的div元素来解析HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.htmlContent;
      
      // 检查是否包含危险的脚本标签
      const scripts = tempDiv.querySelectorAll('script');
      if (scripts.length > 0) {
        console.warn('HTML content contains script tags, removing for security');
        scripts.forEach(script => script.remove());
      }
      
      return tempDiv.innerHTML;
    } catch (error) {
      console.error('Failed to render HTML content:', error);
      return `<div class="extra-info-error">${t('QQ.ChatInterface.ExtraInfoDisplay.renderError', 'HTML渲染失败')}</div>`;
    }
  };

  return (
    <div className="extra-info-display">
      {/* 只保留内容卡片：移除头部与底部信息区 */}
      <div 
        className="extra-info-content"
        dangerouslySetInnerHTML={{ __html: renderHTMLContent() }}
      />
    </div>
  );
}
