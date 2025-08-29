import React from 'react';
import { render, screen } from '@testing-library/react';
import StoryModeDisplay from './StoryModeDisplay';

// 模拟测试数据
const mockChat = {
  id: 'test-chat',
  name: '测试角色',
  avatar: '/test-avatar.jpg',
  isGroup: false,
  messages: [],
  settings: {}
};

const mockMessages = [
  {
    id: '1',
    role: 'assistant',
    content: '*"你好，我是小明"* 小明微笑着说。\n\n**她紧张地握紧了拳头。**\n\n房间里弥漫着淡淡的咖啡香。\n\n*如果我说出来，你会怎么看我呢？* 她心里忐忑不安。\n\n**终于，她下定决心。**\n\n(小明：也许这就是机会)\n\n*叮咚* 门铃突然响起。\n\n[第二天早上] 阳光透过窗帘洒进房间。',
    timestamp: Date.now(),
    type: 'text',
    senderName: '测试角色',
    isRead: true
  }
];

describe('StoryModeDisplay 文本装饰解析', () => {
  it('应该正确解析斜体对话', () => {
    render(
      <StoryModeDisplay
        messages={mockMessages}
        chat={mockChat}
        onQuoteMessage={() => {}}
        onEditMessage={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onDeleteMessage={() => {}}
        onRegenerateAI={() => {}}
        editingMessage={null}
        setEditingMessage={() => {}}
      />
    );

    // 检查斜体对话是否正确渲染
    const dialogueElement = screen.getByText('"你好，我是小明"');
    expect(dialogueElement).toBeInTheDocument();
    expect(dialogueElement.tagName).toBe('EM');
  });

  it('应该正确解析加粗动作', () => {
    render(
      <StoryModeDisplay
        messages={mockMessages}
        chat={mockChat}
        onQuoteMessage={() => {}}
        onEditMessage={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onDeleteMessage={() => {}}
        onRegenerateAI={() => {}}
        editingMessage={null}
        setEditingMessage={() => {}}
      />
    );

    // 检查加粗动作是否正确渲染
    const actionElement = screen.getByText('她紧张地握紧了拳头。');
    expect(actionElement).toBeInTheDocument();
    expect(actionElement.tagName).toBe('STRONG');
  });

  it('应该正确解析心理活动', () => {
    render(
      <StoryModeDisplay
        messages={mockMessages}
        chat={mockChat}
        onQuoteMessage={() => {}}
        onEditMessage={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onDeleteMessage={() => {}}
        onRegenerateAI={() => {}}
        editingMessage={null}
        setEditingMessage={() => {}}
      />
    );

    // 检查心理活动是否正确渲染
    const mentalElement = screen.getByText('小明：也许这就是机会');
    expect(mentalElement).toBeInTheDocument();
    expect(mentalElement.className).toContain('story-mental-text');
  });

  it('应该正确解析时间标记', () => {
    render(
      <StoryModeDisplay
        messages={mockMessages}
        chat={mockChat}
        onQuoteMessage={() => {}}
        onEditMessage={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onDeleteMessage={() => {}}
        onRegenerateAI={() => {}}
        editingMessage={null}
        setEditingMessage={() => {}}
      />
    );

    // 检查时间标记是否正确渲染
    const timeElement = screen.getByText('第二天早上');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement.className).toContain('story-time-mark');
  });

  it('应该正确解析声音效果', () => {
    render(
      <StoryModeDisplay
        messages={mockMessages}
        chat={mockChat}
        onQuoteMessage={() => {}}
        onEditMessage={() => {}}
        onSaveEdit={() => {}}
        onCancelEdit={() => {}}
        onDeleteMessage={() => {}}
        onRegenerateAI={() => {}}
        editingMessage={null}
        setEditingMessage={() => {}}
      />
    );

    // 检查声音效果是否正确渲染
    const soundElement = screen.getByText('叮咚');
    expect(soundElement).toBeInTheDocument();
    expect(soundElement.className).toContain('story-sound-effect');
  });
});
