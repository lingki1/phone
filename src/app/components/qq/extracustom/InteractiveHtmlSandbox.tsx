'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

interface InteractiveHtmlSandboxProps {
  html: string;
  height?: number | string;
  // 允许从沙箱向上抛出自定义事件
  onEvent?: (eventName: string, payload: unknown) => void;
  // 是否自动调整大小
  autoSize?: boolean;
  // 是否显示边框
  showBorder?: boolean;
  // 最小高度
  minHeight?: number;
}

/**
 * 使用 iframe 沙箱安全加载可交互 HTML。
 * - 采用 srcdoc + sandbox 属性隔离执行环境
 * - 阻止表单自动提交、弹窗等高危能力
 * - 通过 window.postMessage 建立有限通信通道
 * - 支持自动调整大小和边框控制
 */
export default function InteractiveHtmlSandbox({ 
  html, 
  height = 100, // 降低默认高度
  onEvent, 
  autoSize = false,
  showBorder = true,
  minHeight = 30 // 降低默认最小高度
}: InteractiveHtmlSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(typeof height === 'number' ? height : 100);

  // 包装一层基础样式与桥接脚本
  const srcDoc = useMemo(() => {
    const MIN_HEIGHT_VAL = Number.isFinite(minHeight as unknown as number) ? Number(minHeight) : 30;

    const SAFE_BRIDGE = `
      <script>
        // 安全桥：仅允许显式 postMessage 到父页面，且不暴露父域 API
        window.__emitToParent = function(eventName, payload){
          try { parent.postMessage({ __sandbox_event__: true, eventName, payload }, '*'); } catch(e) {}
        };
        
         // 自动调整大小功能（带去抖与去重）
         (function(){
           const MIN_HEIGHT = ${MIN_HEIGHT_VAL};
           let __lastSentHeight = 0;
           let __lastSentAt = 0;
           function getMaxElementBottom(){
             try {
               let maxBottom = 0;
               const elements = document.body.getElementsByTagName('*');
               for (let i = 0; i < elements.length; i++) {
                 const rect = elements[i].getBoundingClientRect();
                 const bottom = rect.bottom + (window.scrollY || window.pageYOffset || 0);
                 if (bottom > maxBottom) maxBottom = bottom;
               }
               return Math.ceil(maxBottom);
             } catch (e) { return 0; }
           }

           function reportHeight() {
             try {
               // 等待内容完全渲染
               setTimeout(() => {
                 try {
                   // 使用更准确的高度计算方法
                   const bodyScrollHeight = document.body ? document.body.scrollHeight : 0;
                   const bodyOffsetHeight = document.body ? document.body.offsetHeight : 0;
                   const documentHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
                   const maxElementBottom = getMaxElementBottom();

                   // 取所有方法的最大值，确保内容完全显示
                   const contentHeight = Math.max(
                     bodyScrollHeight,
                     bodyOffsetHeight,
                     maxElementBottom,
                     documentHeight,
                     30 // 最小基础高度兜底
                   );
                   
                   // 确保最小高度
                   const finalHeight = Math.max(MIN_HEIGHT, contentHeight);
                   
                   // 去抖 + 去重：高度变化小于1px或200ms内重复汇报则忽略
                   const now = Date.now();
                   if (Math.abs(finalHeight - __lastSentHeight) <= 1 && (now - __lastSentAt) < 200) {
                     return;
                   }
                   __lastSentHeight = finalHeight;
                   __lastSentAt = now;
                   
                   parent.postMessage({ __sandbox_event__: true, eventName: 'resize', payload: { height: finalHeight } }, '*');
                 } catch(e) {
                   console.error('Height calculation error:', e);
                 }
               }, 100); // 增加延迟时间，确保内容完全渲染
             } catch(e) {}
           }
          
          // 页面加载完成后报告高度
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', reportHeight);
          } else {
            reportHeight();
          }
          
          // 监听内容变化
          const observer = new MutationObserver(reportHeight);
          observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
          
          // 监听窗口大小变化
          window.addEventListener('resize', reportHeight);
          
          // 监听图片加载完成
          document.addEventListener('load', reportHeight, true);
          
          // 监听字体加载完成
          if (document.fonts) {
            document.fonts.ready.then(reportHeight);
          }
          
          // 定期检查高度变化（作为备用方案）
          const heightCheckInterval = setInterval(reportHeight, 2000);
          
          // 清理函数
          window.addEventListener('beforeunload', () => {
            clearInterval(heightCheckInterval);
          });
          
          // 监听强制高度计算消息
          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'forceHeightCalculation') {
              reportHeight();
            }
          });
        })();
        
        // 限制一些同步阻塞/高危 API
        (function(){
          const blocked = ['alert','confirm','prompt','print'];
          blocked.forEach(k=>{ try { window[k] = function(){}; } catch(e){} });
        })();
      </script>
    `;

    const BASE_STYLE = `<style>html,body{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:transparent;height:auto;min-height:auto;max-height:none;}
      *{box-sizing:inherit;} a{color:#0d6efd} button{cursor:pointer}
      body{height:auto;min-height:auto;max-height:none;overflow:visible;}
      html{height:auto;min-height:auto;max-height:none;overflow:visible;}</style>`;

    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>${BASE_STYLE}</head><body>${html}${SAFE_BRIDGE}</body></html>`;
  }, [html, minHeight]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // 仅处理来自当前 iframe 的消息，避免多个 sandbox 相互影响
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;

      const data = e.data || {};
      if (data && data.__sandbox_event__) {
        if (data.eventName === 'resize' && autoSize && data.payload?.height) {
          const nextHeight = Math.max(0, Number(data.payload.height));
          setContentHeight(prev => {
            if (!Number.isFinite(nextHeight)) return prev;
            // 高度变化小于等于1px时忽略，避免频繁刷新与日志
            if (Math.abs(nextHeight - prev) <= 1) return prev;
            return nextHeight;
          });
        } else if (typeof onEvent === 'function') {
          onEvent(String(data.eventName), data.payload);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEvent, autoSize]);

  // 当autoSize为true时，确保初始高度设置正确
  useEffect(() => {
    if (autoSize && loaded) {
      // 延迟一点时间确保iframe内容完全加载
      const timer = setTimeout(() => {
        console.log('AutoSize enabled, current contentHeight:', contentHeight);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoSize, loaded, contentHeight]);

  const containerStyle: React.CSSProperties = {
    background: 'transparent',
    overflow: 'visible',
    maxHeight: 'none', // 移除容器高度限制
    height: 'auto', // 自动高度
    ...(showBorder && {
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 8
    })
  };

  const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: autoSize ? `${contentHeight}px` : (typeof height === 'number' ? `${height}px` : height),
    border: 'none',
    overflow: 'visible',
    maxHeight: 'none', // 移除iframe的高度限制
    display: 'block'
  };

  return (
    <div style={containerStyle}>
      <iframe
        ref={iframeRef}
        title="interactive-html"
        srcDoc={srcDoc}
        sandbox="allow-same-origin allow-forms allow-scripts allow-pointer-lock"
        style={iframeStyle}
        onLoad={() => {
          setLoaded(true);
          // 强制触发高度计算
          if (autoSize) {
            setTimeout(() => {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ type: 'forceHeightCalculation' }, '*');
              }
            }, 100);
          }
        }}
      />
    </div>
  );
}


