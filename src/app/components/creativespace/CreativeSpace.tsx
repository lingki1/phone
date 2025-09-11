'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import './CreativeSpace.css';
import { dataManager } from '../../utils/dataManager';

interface CreativeSpaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

export default function CreativeSpace({ isOpen, onClose }: CreativeSpaceProps) {
  const [idea, setIdea] = useState<string>('');
  const [htmlGame, setHtmlGame] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const normalizeHtmlResponse = useCallback((content: string): string => {
    if (!content) return '';
    // 提取 ```html ``` 或 ``` ``` 围栏中的内容
    const fenceMatch = content.match(/```(?:html)?\s*([\s\S]*?)```/i);
    let extracted = fenceMatch ? fenceMatch[1] : content;
    // 去除可能残留的围栏符号
    extracted = extracted.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
    const trimmed = extracted.trim();
    // 如果不是完整 HTML，则自动包裹为可运行 HTML
    const looksLikeFullHtml = /<html[\s>]/i.test(trimmed) || /<!doctype/i.test(trimmed);
    if (looksLikeFullHtml) return trimmed;
    return `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />\n<title>Game</title>\n<style>html,body{margin:0;padding:0;background:#000;color:#fff;touch-action:manipulation;-ms-touch-action:manipulation;overscroll-behavior:none;height:100%;}canvas{display:block}*{box-sizing:border-box}</style>\n</head>\n<body>\n${trimmed}\n</body>\n</html>`;
  }, []);

  const generateGame = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setHtmlGame('');
    try {
      await dataManager.initDB();
      const api: ApiConfig = await dataManager.getApiConfig();
      if (!api?.proxyUrl || !api?.apiKey || !api?.model) {
        throw new Error('请先在设置里配置 API 代理地址、密钥与模型');
      }

      // 参考 ChatInterface.tsx 的请求形式
      const systemPrompt = `你是一个前端小游戏生成器。返回一个完整可运行的单文件 HTML（含 CSS/JS），无需依赖外部资源，可在移动端（小屏触摸）流畅运行。要求：
1) 视口自适应，禁止滚动条，使用触摸事件。
2) 放置开始/重新开始入口。
3) 只返回 HTML 文本，不要解释。`;

      const userPrompt = `请根据这个想法生成小游戏：${idea}`;

      const response = await fetch(`${api.proxyUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.apiKey}`
        },
        body: JSON.stringify({
          model: api.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        })
      });

      const data = await response.json();
      if (data?.error) throw new Error(data.error?.message || '生成失败');
      const raw = data?.choices?.[0]?.message?.content || '';
      const html = normalizeHtmlResponse(raw);
      if (!html) throw new Error('返回内容为空');
      setHtmlGame(html);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  }, [idea, normalizeHtmlResponse]);

  useEffect(() => {
    if (!isOpen) {
      setHtmlGame('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="creative-overlay" role="dialog" aria-modal="true">
      <div className="creative-container">
        <div className="creative-header">
          <div className="creative-title">我的创意</div>
          <button className="creative-close" onClick={onClose}>✕</button>
        </div>

        <div className="creative-input-row">
          <input
            className="creative-input"
            placeholder="描述你想要的小游戏，例如：横版跳跃、打砖块、贪吃蛇..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={isLoading}
          />
          <button className="creative-generate" onClick={generateGame} disabled={isLoading || !idea.trim()}>
            {isLoading ? '生成中…' : '生成小游戏'}
          </button>
        </div>

        {error && <div className="creative-error">{error}</div>}

        <div className="creative-stage">
          {htmlGame ? (
            <iframe
              ref={iframeRef}
              title="creative-game"
              className="creative-iframe"
              sandbox="allow-scripts allow-pointer-lock allow-same-origin"
              srcDoc={htmlGame}
            />
          ) : (
            <div className="creative-placeholder">生成后将在这里展示小游戏</div>
          )}
        </div>
      </div>
    </div>
  );
}


