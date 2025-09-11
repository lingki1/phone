'use client';

import { useEffect, useState } from 'react';

export default function AudioHelpPortal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener('audio:open-help', open as EventListener);
    return () => window.removeEventListener('audio:open-help', open as EventListener);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      onClick={() => setIsOpen(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2147483000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(92vw, 420px)',
          borderRadius: 16,
          background: 'rgba(28,28,30,0.78)',
          color: '#fff',
          boxShadow: '0 18px 44px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.18)',
          zIndex: 2147483001,
          overflow: 'hidden',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ fontWeight: 700 }}>获取本地音乐文件</div>
          <button style={{ marginLeft: 'auto', ...glassBtn() }} onClick={() => setIsOpen(false)}>关闭</button>
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.6 }}>
          <div>1. 打开哔哩哔哩（B站），搜索你想要的音乐，复制视频页面地址。</div>
          <div>
            2. 访问解析网站：
            <a href="https://m.kedou.life/extract/bilibili" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>https://m.kedou.life/extract/bilibili</a>
            <button
              style={{ marginLeft: 8, ...glassBtn() }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText('https://m.kedou.life/extract/bilibili');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                } catch {}
              }}
            >{copied ? '已复制' : '复制链接'}</button>
            ，将刚才复制的 B 站地址粘贴到输入框解析。
          </div>
          <div>3. 解析完成后，选择下载“音频”文件，保存到本地即可在播放器中导入。</div>
        </div>
      </div>
    </div>
  );
}

function glassBtn(): React.CSSProperties {
  return {
    border: 'none',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)'
  };
}


