'use client';

import React from 'react';
import Image from 'next/image';
import { useI18n } from '../../i18n/I18nProvider';
import UnicodeEmojiPicker from '../../Unicode/UnicodeEmojiPicker';
import MemorySummary from '../recollection/MemorySummary';
import type { ChatItem, GroupMember, QuoteMessage } from '../../../types/chat';
import './InputArea.css';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

interface InputAreaProps {
  isStoryMode: boolean;
  message: string;
  storyModeInput: string;
  isLoading: boolean;
  isPending: boolean;
  autoGenerateOnSend: boolean;
  onToggleAutoGenerate: (v: boolean) => void;

  onSendMessage: () => void;
  onGenerateAI: () => void;
  onStoryModeSend: (content: string) => void;
  onStoryModeGenerate: () => void;
  onStoryModeToggle: () => void;

  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStoryModeInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;

  quotedMessage?: QuoteMessage;
  onCancelQuote: () => void;

  showMentionList: boolean;
  isGroup: boolean;
  filteredMembers: GroupMember[];
  onSelectMention: (member: GroupMember) => void;

  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: (open: boolean) => void;
  onEmojiSelect: (emoji: string) => void;

  onOpenSendRedPacket: () => void;

  chat: ChatItem;
  apiConfig: ApiConfig;
  hasNewUserMessage: boolean;
  storyModeHasMessages: boolean;
}

export default function InputArea(props: InputAreaProps) {
  const {
    isStoryMode,
    message,
    storyModeInput,
    isLoading,
    isPending,
    autoGenerateOnSend,
    onToggleAutoGenerate,
    onSendMessage,
    onGenerateAI,
    onStoryModeSend,
    onStoryModeGenerate,
    onStoryModeToggle,
    onMessageChange,
    onStoryModeInputChange,
    onKeyPress,
    quotedMessage,
    onCancelQuote,
    showMentionList,
    isGroup,
    filteredMembers,
    onSelectMention,
    emojiButtonRef,
    textareaRef,
    showEmojiPicker,
    onToggleEmojiPicker,
    onEmojiSelect,
    onOpenSendRedPacket,
    chat,
    apiConfig,
    hasNewUserMessage,
    storyModeHasMessages
  } = props;

  const { t } = useI18n();

  return (
    <div className="input-container">
      {quotedMessage && (
        <div className="quote-preview">
          <div className="quote-preview-content">
            <span className="quote-preview-sender">{quotedMessage.senderName}:</span>
            <span className="quote-preview-text">{quotedMessage.content}</span>
          </div>
          <button className="quote-cancel" onClick={onCancelQuote}>×</button>
        </div>
      )}

      {showMentionList && isGroup && (
        <div className="mention-list">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="mention-item"
              onClick={() => onSelectMention(member)}
            >
              <Image
                src={member.avatar}
                alt={member.groupNickname}
                width={24}
                height={24}
                className="mention-avatar"
              />
              <span className="mention-name">{member.groupNickname}</span>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons-row">
        <div className="action-buttons-left">
          <div style={{ position: 'relative' }}>
            <button
              ref={emojiButtonRef}
              className="action-btn unicode-emoji-btn"
              onClick={() => onToggleEmojiPicker(!showEmojiPicker)}
              disabled={isLoading || isPending}
              title={t('QQ.ChatInterface.emoji', '表情')}
            >
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </span>
              <span className="btn-text">{t('QQ.ChatInterface.emoji', '表情')}</span>
            </button>

            <UnicodeEmojiPicker
              isOpen={showEmojiPicker}
              onClose={() => onToggleEmojiPicker(false)}
              onEmojiSelect={onEmojiSelect}
              triggerRef={emojiButtonRef}
            />
          </div>

          {!isStoryMode && (
            <button
              className="action-btn red-packet-btn"
              onClick={onOpenSendRedPacket}
              disabled={isLoading || isPending}
              title={t('QQ.ChatInterface.redPacket', '发送红包')}
            >
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,12 20,22 4,22 4,12"/>
                  <rect x="2" y="7" width="20" height="5"/>
                  <line x1="12" y1="22" x2="12" y2="7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </span>
              <span className="btn-text">{t('QQ.ChatInterface.redPacketShort', '红包')}</span>
            </button>
          )}
        </div>

        <div className="action-buttons-right">
          <MemorySummary
            chat={chat}
            apiConfig={apiConfig}
            onSummaryGenerated={(summary) => {
              console.log(t('QQ.ChatInterface.MemorySummary.summaryGenerated', '记忆总结已生成:'), summary);
            }}
          />
          <button
            className={`action-btn story-mode-btn ${isStoryMode ? 'active' : ''}`}
            onClick={onStoryModeToggle}
            disabled={isLoading || isPending}
            title={isStoryMode ? t('QQ.ChatInterface.StoryToggle.title.toNormal', '切换到普通聊天模式') : t('QQ.ChatInterface.StoryToggle.title.toStory', '切换到剧情模式')}
          >
            <span className="btn-text">{isStoryMode ? t('QQ.ChatInterface.StoryToggle.text.story', '剧情') : t('QQ.ChatInterface.StoryToggle.text.online', '线上')}</span>
          </button>
          <button
            className={`action-btn instant-reply-btn ${autoGenerateOnSend ? 'active' : ''}`}
            onClick={() => onToggleAutoGenerate(!autoGenerateOnSend)}
            disabled={isLoading || isPending}
            title={autoGenerateOnSend ? t('QQ.ChatInterface.instantReplyOn', 'Instant Reply Mode - AI will automatically generate responses after sending messages') : t('QQ.ChatInterface.instantReplyOff', 'Manual Reply Mode - Click AI Reply button to generate responses')}
          >
            <span className="btn-text">{t('QQ.ChatInterface.instantReply', '立刻回复')}</span>
          </button>
        </div>
      </div>

      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={isStoryMode ? storyModeInput : message}
          onChange={isStoryMode ? onStoryModeInputChange : onMessageChange}
          onKeyPress={isStoryMode ? (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (storyModeInput.trim()) {
                onStoryModeSend(storyModeInput);
              }
            }
          } : onKeyPress}
          onFocus={() => {
            if (!isStoryMode) {
              setTimeout(() => {
                textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }
          }}
          placeholder={
            isPending
              ? (isStoryMode ? t('QQ.ChatInterface.placeholder.generatingStory', 'AI正在生成剧情中，请稍候...') : t('QQ.ChatInterface.placeholder.generating', 'AI正在回复中，请稍候...'))
              : (isStoryMode ? t('QQ.ChatInterface.placeholder.story', '继续编写剧情...') : (isGroup ? t('QQ.ChatInterface.placeholder.group', '输入消息，@可提及群成员...') : t('QQ.ChatInterface.placeholder.single', '输入消息...')))
          }
          rows={1}
          disabled={isLoading || isPending}
          style={{
            resize: 'none',
            overflow: 'hidden',
            minHeight: '32px',
            maxHeight: '96px'
          }}
        />
        <div className="send-buttons">
          <button
            className="send-btn"
            onClick={isStoryMode ? () => {
              if (storyModeInput.trim()) {
                onStoryModeSend(storyModeInput);
              }
            } : onSendMessage}
            disabled={isLoading || isPending || (isStoryMode ? !storyModeInput.trim() : !message.trim())}
            title={isStoryMode ? t('QQ.ChatInterface.title.continue', '继续剧情') : t('QQ.ChatInterface.title.send', '发送消息')}
          >
            <span className="btn-text">{isStoryMode ? t('QQ.ChatInterface.continue', '继续') : t('QQ.ChatInterface.send', '发送')}</span>
          </button>
          {!autoGenerateOnSend && (
            <button
              className="generate-btn"
              onClick={isStoryMode ? onStoryModeGenerate : onGenerateAI}
              disabled={
                isLoading ||
                isPending ||
                !hasNewUserMessage ||
                (isStoryMode ? !storyModeHasMessages : chat.messages.length === 0)
              }
              title={
                isStoryMode
                  ? (hasNewUserMessage ? t('QQ.ChatInterface.title.generateStory', 'AI生成剧情') : t('QQ.ChatInterface.title.needContent', '需要新内容才能生成'))
                  : (hasNewUserMessage ? t('QQ.ChatInterface.title.generate', '生成AI回复') : t('QQ.ChatInterface.title.needMessage', '需要新消息才能生成回复'))
              }
            >
              <span className="btn-text">{isStoryMode ? t('QQ.ChatInterface.generate', 'AI生成') : t('QQ.ChatInterface.reply', 'AI回复')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


