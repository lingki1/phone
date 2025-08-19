'use client';

import React from 'react';
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
  return (
    <button 
      className={`story-toggle-btn ${isStoryMode ? 'story-active' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      title={isStoryMode ? "切换到普通聊天模式" : "切换到剧情模式"}
    >
      <span className="story-toggle-text">
        {isStoryMode ? '聊天' : '剧情'}
      </span>
    </button>
  );
}

