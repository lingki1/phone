import React from 'react';
import { ChatItem } from '../../../types/chat';
import ChatHeaderInfo from './ChatHeaderInfo';
import ChatHeaderActions from './ChatHeaderActions';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface ChatStatus {
  isOnline: boolean;
  mood: string;
  location: string;
  outfit: string;
  lastUpdate: number;
}

interface ChatHeaderProps {
  chat: ChatItem;
  chatStatus: ChatStatus;
  onBack: () => void;
  onShowWorldBookAssociationSwitch: () => void;
  onShowExtraInfoSettings: () => void;
  onShowBackgroundModal: () => void;
  onShowGiftHistory: () => void;
  onShowMemoryManager: () => void;
  onShowMemberManager: () => void;
  onShowSingleChatMemoryManager: () => void;
  personalSettings?: PersonalSettings;
  dbPersonalSettings?: PersonalSettings | null;
}

export default function ChatHeader({
  chat,
  chatStatus,
  onBack,
  onShowWorldBookAssociationSwitch,
  onShowExtraInfoSettings,
  onShowBackgroundModal,
  onShowGiftHistory,
  onShowMemoryManager,
  onShowMemberManager,
  onShowSingleChatMemoryManager,
  personalSettings,
  dbPersonalSettings
}: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <button className="back-btn" onClick={onBack}>‹</button>
      
      <ChatHeaderInfo 
        chat={chat} 
        chatStatus={chatStatus} 
      />
      
      <ChatHeaderActions
        chat={chat}
        onShowWorldBookAssociationSwitch={onShowWorldBookAssociationSwitch}
        onShowExtraInfoSettings={onShowExtraInfoSettings}
        onShowBackgroundModal={onShowBackgroundModal}
        onShowGiftHistory={onShowGiftHistory}
        onShowMemoryManager={onShowMemoryManager}
        onShowMemberManager={onShowMemberManager}
        onShowSingleChatMemoryManager={onShowSingleChatMemoryManager}
        personalSettings={personalSettings}
        dbPersonalSettings={dbPersonalSettings}
      />
    </div>
  );
}
