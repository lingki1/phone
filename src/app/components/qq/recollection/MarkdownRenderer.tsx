'use client';

import React, { useMemo } from 'react';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // 解析和渲染MD+HTML混合内容
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // 预处理：将HTML标签转换为安全的格式
    const processContent = (text: string) => {
      // 分割内容，分离Markdown和HTML部分
      const parts = text.split(/(<[^>]*>.*?<\/[^>]*>)/g);
      
      return parts.map((part, index) => {
        // 如果是HTML标签
        if (part.match(/^<[^>]*>.*?<\/[^>]*>$/)) {
          return (
            <div 
              key={index}
              className="recollection-html-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }}
            />
          );
        }
        
        // 处理Markdown内容
        return renderMarkdown(part, index);
      });
    };

    return processContent(content);
  }, [content]);

  return (
    <div className="recollection-markdown-renderer">
      {renderedContent}
    </div>
  );
}

// 渲染Markdown内容
function renderMarkdown(text: string, key: number): React.ReactNode {
  if (!text.trim()) return null;

  // 处理标题（按顺序处理，从多到少）
  text = text.replace(/^#### (.*$)/gim, '<h4 class="recollection-h4">$1</h4>');
  text = text.replace(/^### (.*$)/gim, '<h3 class="recollection-h3">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 class="recollection-h2">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 class="recollection-h1">$1</h1>');

  // 处理粗体和斜体
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="recollection-bold">$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em class="recollection-italic">$1</em>');

  // 处理代码块
  text = text.replace(/```([\s\S]*?)```/g, '<pre class="recollection-code-block"><code>$1</code></pre>');
  text = text.replace(/`(.*?)`/g, '<code class="recollection-inline-code">$1</code>');

  // 处理列表
  text = text.replace(/^\* (.*$)/gim, '<li class="recollection-list-item">$1</li>');
  text = text.replace(/^- (.*$)/gim, '<li class="recollection-list-item">$1</li>');
  text = text.replace(/^(\d+)\. (.*$)/gim, '<li class="recollection-ordered-item">$1. $2</li>');

  // 处理引用
  text = text.replace(/^> (.*$)/gim, '<blockquote class="recollection-blockquote">$1</blockquote>');

  // 处理链接
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="recollection-link" target="_blank" rel="noopener noreferrer">$1</a>');

  // 处理换行
  text = text.replace(/\n\n/g, '</p><p class="recollection-paragraph">');
  text = text.replace(/\n/g, '<br class="recollection-line-break">');

  // 包装段落
  if (!text.startsWith('<')) {
    text = `<p class="recollection-paragraph">${text}</p>`;
  }

  // 处理列表包装：将连续的 li 分组包裹为 ul/ol，避免孤立 li 被浏览器按默认样式渲染原点
  // 无序列表分组
  text = text.replace(/(?:\s*<li class=\"recollection-list-item\">[\s\S]*?<\/li>)+/g, (match) => {
    if (/^\s*<ul class=\"recollection-unordered-list\">[\s\S]*<\/ul>\s*$/.test(match)) return match;
    return `<ul class=\"recollection-unordered-list\">${match}<\/ul>`;
  });
  // 有序列表分组
  text = text.replace(/(?:\s*<li class=\"recollection-ordered-item\">[\s\S]*?<\/li>)+/g, (match) => {
    if (/^\s*<ol class=\"recollection-ordered-list\">[\s\S]*<\/ol>\s*$/.test(match)) return match;
    return `<ol class=\"recollection-ordered-list\">${match}<\/ol>`;
  });

  return (
    <div 
      key={key}
      className="recollection-markdown-content"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
    />
  );
}

// HTML内容清理函数
function sanitizeHtml(html: string): string {
  // 移除危险的标签和属性
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}
