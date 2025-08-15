'use client';

import { useState } from 'react';
import { AnnouncementManager } from '../components/announcement';

export default function AnnouncementTestPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>公告系统测试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setIsEditorOpen(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📢 管理公告
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>说明：</h3>
        <ul>
          <li>点击&quot;管理公告&quot;按钮可以打开公告编辑器</li>
          <li>创建的公告会保存到服务器，所有用户都能看到</li>
          <li>公告数据存储在 <code>data/announcements.json</code> 文件中</li>
          <li>系统会自动每5分钟刷新一次公告数据</li>
        </ul>
      </div>

      <AnnouncementManager
        isEditorOpen={isEditorOpen}
        onEditorClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
