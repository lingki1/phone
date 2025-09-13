'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { dataManager } from '../../../utils/dataManager';
import { ChatItem } from '../../../types/chat';
import MarkdownRenderer from './MarkdownRenderer';
import './MemorySummary.css';

interface MemorySummaryProps {
  chat: ChatItem;
  apiConfig: {
    proxyUrl: string;
    apiKey: string;
    model: string;
  };
  onSummaryGenerated?: (summary: string) => void;
}

export default function MemorySummary({ 
  chat, 
  apiConfig, 
  onSummaryGenerated 
}: MemorySummaryProps) {
  const { t, locale } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [streamingSummary, setStreamingSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  // 输入内容字节统计（用于结果提示）
  const [inputBytes, setInputBytes] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [customStart, setCustomStart] = useState(1);
  const [customEnd, setCustomEnd] = useState(100);
  const [totalMessages, setTotalMessages] = useState(0);
  
  // 临时输入状态，允许用户清空输入框
  const [customStartInput, setCustomStartInput] = useState('1');
  const [customEndInput, setCustomEndInput] = useState('100');

  // 获取消息总数
  const getTotalMessageCount = useCallback(async () => {
    try {
      const onlineMessages = chat.messages || [];
      const storyModeMessages = await dataManager.getStoryModeMessages(chat.id);
      return onlineMessages.length + storyModeMessages.length;
    } catch (error) {
      console.error('Failed to get total message count:', error);
      return 0;
    }
  }, [chat]);

  // 加载消息总数
  useEffect(() => {
    const loadTotalMessages = async () => {
      const count = await getTotalMessageCount();
      setTotalMessages(count);
      // 设置默认的自定义范围
      const defaultEnd = Math.min(100, count);
      setCustomEnd(defaultEnd);
      setCustomEndInput(defaultEnd.toString());
    };
    loadTotalMessages();
  }, [getTotalMessageCount]);

  // 获取所有聊天内容（线上+剧情）
  const getAllChatContent = useCallback(async () => {
    try {
      // 获取线上聊天消息
      const onlineMessages = chat.messages || [];
      
      // 获取剧情模式消息
      const storyModeMessages = await dataManager.getStoryModeMessages(chat.id);
      
      // 合并所有消息并按时间排序
      const allMessages = [
        ...onlineMessages.map(msg => ({ ...msg, source: 'online' })),
        ...storyModeMessages.map(msg => ({ ...msg, source: 'story' }))
      ].sort((a, b) => a.timestamp - b.timestamp);
      
        // 取指定范围的消息（从第start条到第end条）
        const startIndex = Math.max(0, customStart - 1); // 转换为0基索引
        const endIndex = Math.min(allMessages.length, customEnd);
      const filteredMessages = allMessages.slice(startIndex, endIndex);
      
      return filteredMessages;
    } catch (error) {
      console.error('Failed to get chat content:', error);
      throw error;
    }
  }, [chat, customStart, customEnd]);


  // 生成消息范围描述
  const getMessageRangeDescription = useCallback(() => {
    return `第${customStart}-${customEnd}条`;
  }, [customStart, customEnd]);

  // 保存到世界书
  const saveToWorldBook = useCallback(async (summaryContent: string) => {
    try {
      const messageRangeDesc = getMessageRangeDescription();
      const worldBookEntry = {
        id: `recollection_${chat.id}_${Date.now()}`,
        name: `${chat.name} - ${messageRangeDesc}`,
        title: `${chat.name} - ${messageRangeDesc}`,
        content: summaryContent,
        category: 'recollection',
        tags: ['记忆总结', chat.name, '聊天记录'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {
          chatId: chat.id,
          chatName: chat.name,
          messageCount: (await getAllChatContent()).length,
          generatedAt: new Date().toISOString()
        }
      };

      await dataManager.saveWorldBook(worldBookEntry);
      console.log(t('QQ.ChatInterface.Recollection.MemorySummary.logs.savedToWorldBook', '记忆总结已保存到世界书:'), worldBookEntry.title);
    } catch (error) {
      console.error(t('QQ.ChatInterface.Recollection.MemorySummary.errors.saveToWorldBookFailed', '保存到世界书失败:'), error);
      throw error;
    }
  }, [chat, getAllChatContent, getMessageRangeDescription, t]);

  // 生成记忆总结（流式传输）
  const generateSummary = useCallback(async () => {
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
      setError(t('QQ.ChatInterface.Recollection.MemorySummary.errors.apiConfigRequired', '请先设置API配置才能使用记忆总结功能'));
      return;
    }

    setIsGenerating(true);
    setIsStreaming(true);
    setError('');
    setSummary('');
    setStreamingSummary('');
    setInputBytes(null);

    try {
      // 获取所有聊天内容
      const allMessages = await getAllChatContent();
      
      console.log('=== 消息过滤调试信息 ===');
      console.log('过滤后的消息数量:', allMessages.length);
        console.log('自定义范围:', customStart, '到', customEnd);
      console.log('前3条消息示例:', allMessages.slice(0, 3).map(msg => ({
        role: msg.role,
        content: msg.content?.substring(0, 50) + '...',
        source: msg.source,
        timestamp: new Date(msg.timestamp).toLocaleString()
      })));
      
      if (allMessages.length === 0) {
        setError(t('QQ.ChatInterface.Recollection.MemorySummary.errors.noChatRecords', '没有找到聊天记录，无法生成总结'));
        return;
      }

      // 构建提示词
      const messagesText = allMessages.map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString(locale || 'zh-CN');
        const source = msg.source === 'online' ? t('QQ.ChatInterface.Recollection.MemorySummary.source.online', '[线上]') : t('QQ.ChatInterface.Recollection.MemorySummary.source.story', '[剧情]');
        const role = msg.role === 'user' ? t('QQ.ChatInterface.Recollection.MemorySummary.role.user', '用户') : (msg.senderName || chat.name);
        return `${source} ${timestamp} ${role}: ${msg.content}`;
      }).join('\n');

      const systemPrompt = `你是一位严谨且富有文学修养的回忆录作者。基于用户提供的聊天记录，生成“忠实于事实”的内容总结，并以“适度文学色彩”叙述，使用“美化的 Markdown”排版。

【写作目标】
- 内容总结：提炼核心要点、时间脉络与关键转折，删繁就简。
- 文学色彩：语言有节奏与画面感，但不得夸大或虚构事实。
- 完全忠实：不得添加聊天中未出现的新信息，不主观编造因果或细节。
- 可读排版：使用规范且美观的 Markdown。

【输出结构（Markdown）】
- 顶部一级标题：# 回忆总结
- 章节：2–5章，每章 300–800 字，二级标题格式“## 第一章：标题”
- 关键要点：每章或全局用无序列表（-）概述
- 重要对话：用引用块（>）保留原意与措辞（可适度裁剪）
- 轻量强调：对关键词使用加粗（**词语**），必要时少量斜体（*词语*）
- 如有清晰时间/事件节点，可用列表或简单表格补充

【内容准则】
- 严格以聊天内容为唯一信息源；不引入外部设定，不杜撰背景或角色动机
- 将零散对话整合为连贯叙述，突出：重要主题、关键决定/分歧、关系推进、时间线节点、具有代表性的对话
- 精炼表达，避免口水话、重复与过度抒情；第三人称叙述，客观中保留温度
- 若信息不足，省略推断，不填补空白

【输出示例（示意）】
# 回忆总结

## 第一章：相遇与开场
- 本章要点：……
> “关键对话原句或忠实节选”

## 第二章：分歧与转折
- 本章要点：……
> “关键对话原句或忠实节选”

（如需更多章节，保持同样格式）

【重要】
- 仅输出 Markdown 内容本身（不要额外说明、不要技术性前言）。
- 语言简洁、流畅、准确，绝不偏离聊天事实。`;

      const userPrompt = `聊天记录：
${messagesText}

请根据上述聊天记录生成记忆总结。`;

      // 计算输入tokens（基于实际数据优化的估算）
      const calculateTokens = (text: string) => {
        // 基于实际数据分析，重新调整权重系数
        
        // 中文字符：实际测试显示中文字符token密度更高
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        // 英文单词：按单词计算，不是按字符
        const englishWords = text.match(/[a-zA-Z]+/g) || [];
        const englishWordCount = englishWords.length;
        // 数字：按数字串计算
        const numberStrings = text.match(/\d+/g) || [];
        const numberCount = numberStrings.length;
        // 标点符号：按符号计算
        const punctuation = (text.match(/[^\w\s\u4e00-\u9fff]/g) || []).length;
        // 空格和换行：按字符计算
        const spaces = (text.match(/\s/g) || []).length;
        // 其他字符（如特殊符号等）
        const otherChars = text.length - chineseChars - englishWords.join('').length - numberStrings.join('').length - punctuation - spaces;
        
        // 重新调整权重系数，基于实际误差分析
        const calculatedTokens = Math.ceil(
          chineseChars * 0.8 +        // 中文字符权重提高
          englishWordCount * 1.2 +        // 英文单词权重提高
          numberCount * 0.6 +             // 数字权重提高
          punctuation * 0.8 +         // 标点符号权重提高
          spaces * 0.1 +              // 空格权重提高
          otherChars * 0.3            // 其他字符
        );
        
        // 使用更保守的简单比例作为备用
        const simpleRatio = Math.ceil(text.length / 1.8); // 调整比例系数
        
        // 取两种方法的平均值，并增加20%的缓冲
        const averageTokens = Math.ceil((calculatedTokens + simpleRatio) / 2);
        const finalTokens = Math.ceil(averageTokens * 1.2);
        
        return finalTokens;
      };
      
      const promptTokens = calculateTokens(systemPrompt + userPrompt);
      
      // 详细统计信息
      const totalChars = systemPrompt.length + userPrompt.length;
      setInputBytes(totalChars);
      const chineseChars = (userPrompt.match(/[\u4e00-\u9fff]/g) || []).length;
      const englishWords = userPrompt.match(/[a-zA-Z]+/g) || [];
      const englishWordCount = englishWords.length;
      const numberStrings = userPrompt.match(/\d+/g) || [];
      const numberCount = numberStrings.length;
      const punctuation = (userPrompt.match(/[^\w\s\u4e00-\u9fff]/g) || []).length;
      const spaces = (userPrompt.match(/\s/g) || []).length;
      const otherChars = userPrompt.length - chineseChars - englishWords.join('').length - numberStrings.join('').length - punctuation - spaces;
      
      // 计算简单比例估算
      const simpleRatioTokens = Math.ceil(totalChars / 1.8);
      
      // 使用固定的max_tokens
      const maxTokens = 16000;
      
      console.log('=== 记忆总结API调用开始 ===');
      console.log('聊天对象:', chat.name);
      console.log('消息总数:', allMessages.length);
      console.log('输入内容统计:');
      console.log('  - 总字符数:', totalChars, '字符');
      console.log('  - 中文字符:', chineseChars, '个 (×0.8)');
      console.log('  - 英文单词:', englishWordCount, '个 (×1.2)');
      console.log('  - 数字:', numberCount, '个 (×0.6)');
      console.log('  - 标点符号:', punctuation, '个 (×0.8)');
      console.log('  - 空格换行:', spaces, '个 (×0.1)');
      console.log('  - 其他字符:', otherChars, '个 (×0.3)');
      console.log('估算方法:');
      console.log('  - 加权计算:', promptTokens, 'tokens');
      console.log('  - 简单比例:', simpleRatioTokens, 'tokens (÷1.8)');
      console.log('  - 最终估算:', promptTokens, 'tokens (含20%缓冲)');
      console.log('API配置:', {
        model: apiConfig.model,
        proxyUrl: apiConfig.proxyUrl,
        hasApiKey: !!apiConfig.apiKey
      });
      
      // 构建API请求体（流式传输）
      const requestBody = {
        model: apiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: true  // 启用流式传输
      };
      
      console.log('API请求体（流式）:', {
        model: requestBody.model,
        messagesCount: requestBody.messages.length,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        temperature: requestBody.temperature,
        max_tokens: maxTokens,
        stream: true
      });

      // 调用API生成总结（流式传输）
      const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('响应体为空，无法进行流式传输');
      }

      console.log('=== 开始流式传输 ===');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      const actualPromptTokens = promptTokens;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('流式传输完成');
            break;
          }

          // 解码数据块
          buffer += decoder.decode(value, { stream: true });
          
          // 处理完整的SSE消息
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一个不完整的行
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                console.log('流式传输结束标记');
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                // 处理内容增量
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  if (delta.content) {
                    fullContent += delta.content;
                    setStreamingSummary(fullContent);
                  }
                }
              } catch (parseError) {
                console.warn('解析SSE数据失败:', parseError, '原始数据:', data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const generatedSummary = fullContent.trim();
      
      if (!generatedSummary) {
        throw new Error('流式传输完成但未收到任何内容');
      }

      // 不再展示tokens明细
      
      console.log('=== 流式传输完成 ===');
      console.log('生成总结长度:', generatedSummary.length, '字符');
      console.log('实际字符/token比例:', (totalChars / actualPromptTokens).toFixed(2), ':1');
      
      setSummary(generatedSummary);
      setIsStreaming(false);
      
      // 保存到世界书
      await saveToWorldBook(generatedSummary);
      
      // 通知父组件
      onSummaryGenerated?.(generatedSummary);
      
    } catch (error) {
      console.error(t('QQ.ChatInterface.Recollection.MemorySummary.errors.generateFailed', '生成记忆总结失败:'), error);
      setError(error instanceof Error ? error.message : t('QQ.ChatInterface.Recollection.MemorySummary.errors.generateFailedRetry', '生成总结失败，请重试'));
      setIsStreaming(false);
    } finally {
      setIsGenerating(false);
    }
  }, [apiConfig, getAllChatContent, chat, onSummaryGenerated, customEnd, customStart, saveToWorldBook, t, locale]);

  // 打开模态框
  const handleOpenModal = useCallback(() => {
    setShowModal(true);
    setError('');
    setSummary('');
  }, []);

  // 关闭模态框
  const handleCloseModal = useCallback(() => {
    // 如果正在生成中，不允许关闭
    if (isGenerating) {
      return;
    }
    setShowModal(false);
    setError('');
    setSummary('');
    setStreamingSummary('');
    setIsStreaming(false);
  }, [isGenerating]);

  return (
    <>
      {/* 记忆总结按钮 */}
      <button
        className="recollection-memory-summary-btn"
        onClick={handleOpenModal}
        disabled={isGenerating}
        title={t('QQ.ChatInterface.Recollection.MemorySummary.title.generate', '生成记忆总结')}
      >
        <span className="btn-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </span>
        <span className="btn-text">{t('QQ.ChatInterface.Recollection.MemorySummary.button', '记忆总结')}</span>
      </button>

      {/* 记忆总结模态框 */}
      {showModal && (
        <div className="recollection-memory-summary-modal">
          <div 
            className={`recollection-modal-overlay ${isGenerating ? 'locked' : ''}`}
            onClick={isGenerating ? undefined : handleCloseModal}
            title={isGenerating ? t('QQ.ChatInterface.Recollection.MemorySummary.generatingLocked', '正在生成中，无法关闭') : t('QQ.ChatInterface.Recollection.MemorySummary.clickToClose', '点击关闭')}
          ></div>
          <div className="recollection-modal-content">
            <div className="recollection-modal-header">
              <h3>{t('QQ.ChatInterface.Recollection.MemorySummary.header', '记忆总结')}</h3>
              <button 
                className={`recollection-modal-close ${isGenerating ? 'disabled' : ''}`}
                onClick={isGenerating ? undefined : handleCloseModal}
                disabled={isGenerating}
                title={isGenerating ? t('QQ.ChatInterface.Recollection.MemorySummary.generatingLocked', '正在生成中，无法关闭') : t('QQ.ChatInterface.Recollection.MemorySummary.close', '关闭')}
              >
                ×
              </button>
            </div>
            
            <div className="recollection-modal-body">
              {isGenerating ? (
                <div className="recollection-generating">
                  <div className="recollection-spinner"></div>
                  <p>{t('QQ.ChatInterface.Recollection.MemorySummary.generating', '正在生成记忆总结...')}</p>
                  <div className="recollection-lock-notice">
                    <span className="recollection-lock-icon">🔒</span>
                    <span>{t('QQ.ChatInterface.Recollection.MemorySummary.lockedNotice', '生成过程中窗口已锁定，请耐心等待')}</span>
                  </div>
                  
                  {/* 流式生成内容预览 */}
                  {isStreaming && streamingSummary && (
                    <div className="recollection-streaming-preview">
                      <h5>{t('QQ.ChatInterface.Recollection.MemorySummary.streamingPreview', '实时生成预览：')}</h5>
                      <div className="recollection-streaming-content">
                        <MarkdownRenderer content={streamingSummary} />
                        <div className="recollection-streaming-cursor">|</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="recollection-error">
                  <p>{error}</p>
                  <button 
                    className="recollection-retry-btn"
                    onClick={generateSummary}
                  >
                    {t('QQ.ChatInterface.Recollection.MemorySummary.retry', '重试')}
                  </button>
                </div>
              ) : summary ? (
                <div className="recollection-summary-result">
                  <h4>{t('QQ.ChatInterface.Recollection.MemorySummary.resultTitle', '总结内容：')}</h4>
                  <div className="recollection-summary-content">
                    <MarkdownRenderer content={summary} />
                  </div>
                  
                  {/* 输入字节统计信息 */}
                  {inputBytes !== null && (
                    <div className="recollection-token-stats">
                      <h5>{t('QQ.ChatInterface.Recollection.MemorySummary.processStatus', '处理状态')}</h5>
                      <div className="recollection-token-details">
                        <div className="recollection-token-item recollection-token-total">
                          <span className="recollection-token-label">{t('QQ.ChatInterface.Recollection.MemorySummary.resultLabel', '结果：')}</span>
                          <span className="recollection-token-value">{t('QQ.ChatInterface.Recollection.MemorySummary.resultBytes', '已把 {{bytes}} 字节内容总结完成').replace('{{bytes}}', String(inputBytes))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="recollection-summary-actions">
                    <button 
                      className="recollection-save-btn"
                      onClick={() => {
                        // 保存功能已在生成时自动执行，这里可以显示确认信息
                        alert(t('QQ.ChatInterface.Recollection.MemorySummary.success.saved', '记忆总结已自动保存到世界书！'));
                      }}
                    >
                      {t('QQ.ChatInterface.Recollection.MemorySummary.save', '保存')}
                    </button>
                    <button 
                      className="recollection-regenerate-btn"
                      onClick={generateSummary}
                    >
                      {t('QQ.ChatInterface.Recollection.MemorySummary.regenerate', '重新生成')}
                    </button>
                    <button 
                      className="recollection-complete-btn"
                      onClick={handleCloseModal}
                    >
                      {t('QQ.ChatInterface.Recollection.MemorySummary.complete', '完成')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="recollection-start">
                  <p>{t('QQ.ChatInterface.Recollection.MemorySummary.startTip1', '点击“生成总结”按钮，AI将根据您与{{name}}的聊天记录，创作一篇优美的回忆小说。').replace('{{name}}', chat.name)}</p>
                  <p>{t('QQ.ChatInterface.Recollection.MemorySummary.startTip2', '总结将自动保存到世界书的“recollection”分类中。')}</p>
                  
                  {/* 消息范围选择 */}
                  <div className="recollection-message-range">
                    <h4>{t('QQ.ChatInterface.Recollection.MemorySummary.pickRange', '选择要总结的消息范围：')}</h4>
                    
                    {/* 自定义范围选项 */}
                    <div className="recollection-range-option-group">
                      <div className="recollection-range-input-row">
                        <span>{t('QQ.ChatInterface.Recollection.MemorySummary.from', '从')}</span>
                            <input
                              type="number"
                              min="1"
                              max={totalMessages}
                              value={customStartInput}
                              onChange={(e) => {
                                setCustomStartInput(e.target.value);
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (value === '' || parseInt(value) < 1) {
                                  setCustomStartInput('1');
                                  setCustomStart(1);
                                } else {
                                  const num = parseInt(value);
                                  if (!isNaN(num) && num >= 1) {
                                    setCustomStart(num);
                                  }
                                }
                              }}
                              className="recollection-range-input"
                            />
                        <span>{t('QQ.ChatInterface.Recollection.MemorySummary.items', '条')}</span>
                          </div>
                      <div className="recollection-range-input-row">
                        <span>{t('QQ.ChatInterface.Recollection.MemorySummary.to', '到')}</span>
                            <input
                              type="number"
                              min="1"
                              max={totalMessages}
                              value={customEndInput}
                              onChange={(e) => {
                                setCustomEndInput(e.target.value);
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                if (value === '' || parseInt(value) < 1) {
                                  setCustomEndInput('1');
                                  setCustomEnd(1);
                                } else {
                                  const num = parseInt(value);
                                  if (!isNaN(num) && num >= 1) {
                                // 如果超过总消息数，自动设置为总消息数
                                const finalValue = Math.min(num, totalMessages);
                                setCustomEnd(finalValue);
                                setCustomEndInput(finalValue.toString());
                                  }
                                }
                              }}
                              className="recollection-range-input"
                            />
                          <span>{t('QQ.ChatInterface.Recollection.MemorySummary.items', '条')}</span>
                        </div>
                    </div>
                    
                    <div className="recollection-range-info">
                      <p>{t('QQ.ChatInterface.Recollection.MemorySummary.total', '总消息数：{{total}} 条').replace('{{total}}', String(totalMessages))}</p>
                        <p>{t('QQ.ChatInterface.Recollection.MemorySummary.rangeStat', '将总结第 {{start}} 到第 {{end}} 条消息（共 {{count}} 条）')
                          .replace('{{start}}', String(customStart))
                          .replace('{{end}}', String(customEnd))
                          .replace('{{count}}', String(Math.max(0, customEnd - customStart + 1)))
                        }</p>
                    </div>
                  </div>
                  
                  <button 
                    className="recollection-generate-btn"
                    onClick={generateSummary}
                  >
                    {t('QQ.ChatInterface.Recollection.MemorySummary.generate', '生成总结')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
