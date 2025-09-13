'use client';

import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import './StoryModeToggle.css';

interface StoryModeToggleProps {
  isStoryMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function StoryModeToggle({ 
  isStoryMode, 
  onToggle, 
  disabled = false 
}: StoryModeToggleProps) {
  const { t } = useI18n();
  return (
    <button 
      className={`story-toggle-btn ${isStoryMode ? 'story-active' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      title={isStoryMode 
        ? t('QQ.ChatInterface.StoryToggle.title.toNormal', '切换到普通聊天模式') 
        : t('QQ.ChatInterface.StoryToggle.title.toStory', '切换到剧情模式')}
    >
      <span className="story-toggle-text">
        {isStoryMode 
          ? t('QQ.ChatInterface.StoryToggle.text.story', '剧情') 
          : t('QQ.ChatInterface.StoryToggle.text.online', '线上')}
      </span>
    </button>
  );
}

