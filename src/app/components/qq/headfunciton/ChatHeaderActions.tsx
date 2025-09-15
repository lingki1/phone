import React from 'react';
import { ChatItem } from '../../../types/chat';
import IntegratedFunctionMenu from './IntegratedFunctionMenu';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface ChatHeaderActionsProps {
  chat: ChatItem;
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

export default function ChatHeaderActions(props: ChatHeaderActionsProps) {
  return (
    <div className="chat-actions" style={{ position: 'relative' }}>
      <IntegratedFunctionMenu {...props} />
    </div>
  );
}
