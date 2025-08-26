'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ActivationCode {
  code: string;
  used_by?: string;
  used_at?: string;
  created_by: string;
  created_at: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requireActivation, setRequireActivation] = useState(false);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [lastGeneratedCodes, setLastGeneratedCodes] = useState<string[]>([]);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        router.push('/admin/users');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setRequireActivation(Boolean(data.settings?.register_require_activation));
      } else {
        setError(data.message || '获取设置失败');
      }
    } catch (_e) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (value: boolean) => {
    try {
      setRequireActivation(value);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ register_require_activation: value })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || '更新失败');
        setRequireActivation(!value);
      }
    } catch (_e) {
      setError('网络错误');
      setRequireActivation(!value);
    }
  };

  const fetchCodes = async () => {
    try {
      const res = await fetch(`/api/admin/activation-codes?includeUsed=true`);
      const data = await res.json();
      if (data.success) {
        setCodes(data.codes || []);
      }
    } catch (_e) {
      // ignore
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/activation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: generateCount })
      });
      const data = await res.json();
      if (data.success) {
        // prepend newly generated codes
        setCodes((prev) => [...data.codes, ...prev]);
        setLastGeneratedCodes((data.codes || []).map((c: ActivationCode) => c.code));
      } else {
        setError(data.message || '生成失败');
      }
    } catch (_e) {
      setError('网络错误');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">加载中...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题和导航 */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold">系统设置</h1>
        <Link
          href="/admin/users"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          用户管理 (Ctrl+U)
        </Link>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 border border-red-300 text-red-700 rounded bg-red-50">{error}</div>
      )}

      {/* 注册设置区域 */}
      <section className="bg-white p-6 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-medium mb-4">注册设置</h2>
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={requireActivation}
            onChange={(e) => updateSettings(e.target.checked)}
          />
          <span>注册需要激活码</span>
        </label>
      </section>

      {/* 激活码管理区域 */}
      <section className="bg-white p-6 border border-gray-200 rounded-lg space-y-6">
        {/* 激活码管理标题和下载按钮 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">激活码管理</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => downloadTxt(codes.map(c => c.code), 'activation-codes-all.txt')}
              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              下载全部TXT
            </button>
            {lastGeneratedCodes.length > 0 && (
              <button
                type="button"
                onClick={() => downloadTxt(lastGeneratedCodes, `activation-codes-latest.txt`)}
                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                下载本次生成TXT
              </button>
            )}
          </div>
        </div>

        {/* 生成激活码表单 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <form className="flex items-end space-x-3" onSubmit={handleGenerate}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生成数量 (1-200)</label>
              <input
                className="w-32 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="number"
                min={1}
                max={200}
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
              />
            </div>
            <button
              type="submit"
              disabled={generating}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {generating ? '生成中...' : '生成激活码'}
            </button>
          </form>
        </div>

        <div className="border border-gray-200 rounded">
          <div className="grid grid-cols-6 text-sm font-medium bg-gray-50 border-b">
            <div className="p-2">激活码</div>
            <div className="p-2">创建者</div>
            <div className="p-2">创建时间</div>
            <div className="p-2">使用者</div>
            <div className="p-2">使用时间</div>
            <div className="p-2">操作</div>
          </div>
          <div className="divide-y">
            {codes.map((c) => (
              <div key={c.code} className="grid grid-cols-6 text-sm items-center">
                <div className="p-2 font-mono break-all">{c.code}</div>
                <div className="p-2">{c.created_by || '-'}</div>
                <div className="p-2">{formatDate(c.created_at)}</div>
                <div className="p-2">{c.used_by || '-'}</div>
                <div className="p-2">{c.used_at ? formatDate(c.used_at) : '-'}</div>
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(c.code)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    复制
                  </button>
                </div>
              </div>
            ))}
            {codes.length === 0 && (
              <div className="p-3 text-sm text-gray-500">暂无激活码</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 旧浏览器回退
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } finally { document.body.removeChild(textarea); }
  }
}

function downloadTxt(lines: string[], filename: string) {
  const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


