import React from 'react';
import Image from 'next/image';
import { ChatItem } from '../../../types/chat';
import { ChatStatusDisplay } from '../chatstatus';

interface ChatStatus {
  isOnline: boolean;
  mood: string;
  location: string;
  outfit: string;
  lastUpdate: number;
}

interface ChatHeaderInfoProps {
  chat: ChatItem;
  chatStatus: ChatStatus;
}

export default function ChatHeaderInfo({ chat, chatStatus }: ChatHeaderInfoProps) {
  return (
    <div className="chat-info" style={{ position: 'relative' }}>
      <Image 
        src={chat.avatar} 
        alt={chat.name}
        width={40}
        height={40}
        className="chat-avatar"
        unoptimized={chat.avatar?.startsWith('data:')}
      />
      <div className="chat-details">
        <span className="chat-name">{chat.name}</span>
        {chat.isGroup && chat.members ? (
          <span className="chat-status">{`${chat.members.length}人`}</span>
        ) : (
          <ChatStatusDisplay status={chatStatus} chatName={chat.name} />
        )}
      </div>
    </div>
  );
}
