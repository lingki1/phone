'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import './StoryModeInput.css';

interface StoryModeInputProps {
  onSend: (content: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isPending: boolean;
  hasNewUserMessage: boolean;
  placeholder?: string;
}

export default function StoryModeInput({
  onSend,
  onGenerate,
  isLoading,
  isPending,
  hasNewUserMessage,
  placeholder = "继续编写剧情..."
}: StoryModeInputProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 200);
    textarea.style.height = `${newHeight}px`;
    
    // 根据内容长度决定是否展开
    setIsExpanded(content.length > 100);
  }, [content.length]);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSend = () => {
    if (!content.trim() || isLoading || isPending) return;
    onSend(content.trim());
    setContent('');
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerate = () => {
    if (isLoading || isPending || !hasNewUserMessage) return;
    onGenerate();
  };

  return (
    <div className={`story-input-container ${isExpanded ? 'story-expanded' : ''}`}>
      <div className="story-input-header">
        <div className="story-input-title">
          <span className="story-title-icon">✍️</span>
          <span className="story-title-text">剧情编写</span>
        </div>
        <div className="story-input-stats">
          <span className="story-char-count">{content.length}</span>
          <span className="story-char-label">字符</span>
        </div>
      </div>
      
      <div className="story-textarea-wrapper">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="story-textarea"
          disabled={isLoading || isPending}
          rows={1}
        />
      </div>
      
      <div className="story-input-actions">
        <button
          className="story-send-btn"
          onClick={handleSend}
          disabled={!content.trim() || isLoading || isPending}
          title="继续剧情"
        >
          <span className="story-btn-icon">📝</span>
          <span className="story-btn-text">继续</span>
        </button>
        
        <button
          className="story-generate-btn"
          onClick={handleGenerate}
          disabled={isLoading || isPending || !hasNewUserMessage}
          title={hasNewUserMessage ? "AI生成剧情" : "需要新内容才能生成"}
        >
          <span className="story-btn-icon">🤖</span>
          <span className="story-btn-text">AI生成</span>
        </button>
      </div>
    </div>
  );
}

