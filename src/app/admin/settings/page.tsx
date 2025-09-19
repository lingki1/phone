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
  const [purchaseUrl1, setPurchaseUrl1] = useState('');
  const [purchaseUrl2, setPurchaseUrl2] = useState('');
  const [savingRegisterConfig, setSavingRegisterConfig] = useState(false);
  // 平台内置API配置表单状态
  const [sysProxyUrl, setSysProxyUrl] = useState('');
  const [sysApiKey, setSysApiKey] = useState('');
  const [sysModel, setSysModel] = useState('');
  const [savingSystemApi, setSavingSystemApi] = useState(false);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [lastGeneratedCodes, setLastGeneratedCodes] = useState<string[]>([]);
  const [downloadType, setDownloadType] = useState<'all' | 'used' | 'unused'>('all');
  const [codePage, setCodePage] = useState(1);
  const [codeTotalPages, setCodeTotalPages] = useState(1);

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
    fetchCodes(codePage);
  }, [codePage]);

  useEffect(() => {
    fetchSystemApiConfig();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setRequireActivation(Boolean(data.settings?.register_require_activation));
        setPurchaseUrl1(String(data.settings?.purchase_url_1 || ''));
        setPurchaseUrl2(String(data.settings?.purchase_url_2 || ''));
      } else {
        setError(data.message || '获取设置失败');
      }
    } catch (_e) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemApiConfig = async () => {
    try {
      const res = await fetch('/api/admin/system-api-config');
      const data = await res.json();
      if (data.success && data.data) {
        setSysProxyUrl(String(data.data.proxyUrl || ''));
        setSysApiKey(''); // 安全起见不回显，留空表示不变
        setSysModel(String(data.data.model || ''));
      }
    } catch (_e) {
      // ignore
    }
  };

  const handleSaveSystemApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSystemApi) return;
    setSavingSystemApi(true);
    setError('');
    try {
      const body: Record<string, string> = {
        proxyUrl: sysProxyUrl,
        model: sysModel
      };
      if (sysApiKey && sysApiKey.trim()) {
        body.apiKey = sysApiKey.trim();
      }
      const res = await fetch('/api/admin/system-api-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || '保存平台内置API配置失败');
      } else {
        // 保存成功后，清空密钥输入框
        setSysApiKey('');
        alert('平台内置API配置已保存');
      }
    } catch (_e) {
      setError('网络错误');
    } finally {
      setSavingSystemApi(false);
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

  const handleSaveRegisterConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRegisterConfig) return;
    setSavingRegisterConfig(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 可只保存链接，不影响当前开关；若需要同步保存也可加入 register_require_activation: requireActivation
          purchase_url_1: purchaseUrl1,
          purchase_url_2: purchaseUrl2
        })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || '保存失败');
      } else {
        alert('注册设置已保存');
      }
    } catch (_e) {
      setError('网络错误');
    } finally {
      setSavingRegisterConfig(false);
    }
  };

  const fetchCodes = async (p = 1) => {
    try {
      const res = await fetch(`/api/admin/activation-codes?includeUsed=true&page=${p}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setCodes(data.codes || []);
        setCodeTotalPages(Number(data.pagination?.totalPages || 1));
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

  // 处理不同类型的激活码下载
  const handleDownloadCodes = async (type: 'all' | 'used' | 'unused') => {
    try {
      const status = type; // 'all' | 'used' | 'unused'
      const res = await fetch(`/api/admin/activation-codes?status=${status}&exportAll=true`);
      const data = await res.json();
      if (!data.success) {
        alert(data.message || '导出失败');
        return;
      }
      const list: ActivationCode[] = data.codes || [];
      if (list.length === 0) {
        alert('没有符合条件的激活码');
        return;
      }

      let filename = '';
      let header = '';
      if (type === 'all') { filename = 'activation-codes-all.txt'; header = '全部激活码：'; }
      if (type === 'used') { filename = 'activation-codes-used.txt'; header = '已经使用的激活码：'; }
      if (type === 'unused') { filename = 'activation-codes-unused.txt'; header = '未用的激活码：'; }
      const lines = [
        header,
        ...list.map((c) => type === 'unused' ? c.code : `${c.code} - ${c.used_by || '未使用'} - ${c.created_by}`)
      ];
      downloadTxt(lines, filename);
    } catch (_e) {
      alert('网络错误');
    }
  };

  if (loading) {
    return (
      <div className="p-6">加载中...</div>
    );
  }

  return (
    <div className="dos space-y-8">
      {/* 页面标题和导航 */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold">系统设置</h1>
        <Link
          href="/admin/users"
          className="dos-btn px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          用户管理 (Ctrl+U)
        </Link>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 border border-red-300 text-red-700 rounded bg-red-50">{error}</div>
      )}

      {/* 平台内置API配置（移至顶部） */}
      <section className="bg-white p-6 border border-gray-200 rounded-lg space-y-4">
        <h2 className="text-lg font-medium">平台内置API配置</h2>
        <p className="text-sm text-gray-500">该配置保存在服务器（SQLite），前端不可见密钥。用户可在客户端一键使用此配置，通过服务器代理调用。</p>
        <form className="space-y-4" onSubmit={handleSaveSystemApi}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">服务器地址（无需 /v1）</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              type="text"
              placeholder="如 https://api.openai.com"
              value={sysProxyUrl}
              onChange={(e) => setSysProxyUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">访问密钥（留空则不修改）</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              type="password"
              placeholder="sk-***"
              value={sysApiKey}
              onChange={(e) => setSysApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">默认模型（可选）</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              type="text"
              placeholder="如 gpt-4o-mini"
              value={sysModel}
              onChange={(e) => setSysModel(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingSystemApi}
              className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {savingSystemApi ? '保存中...' : '保存平台内置配置'}
            </button>
            <button
              type="button"
              onClick={fetchSystemApiConfig}
              className="dos-btn px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              重新载入
            </button>
          </div>
          <div className="text-xs text-gray-500">
            前端用户将通过 `/api/server-ai` 代理使用该配置，密钥仅保存在服务器端并由代理注入。
          </div>
        </form>
      </section>

      {/* 注册设置区域 */}
      <section className="bg-white p-6 border border-gray-200 rounded-lg space-y-4">
        <h2 className="text-lg font-medium">注册设置</h2>
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={requireActivation}
            onChange={(e) => updateSettings(e.target.checked)}
          />
          <span>注册需要激活码</span>
        </label>

        {requireActivation && (
          <form className="space-y-3" onSubmit={handleSaveRegisterConfig}>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">国内购卡</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="url"
                placeholder="https://example.com/buy-1"
                value={purchaseUrl1}
                onChange={(e) => setPurchaseUrl1(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">海外购卡</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="url"
                placeholder="https://example.com/buy-2"
                value={purchaseUrl2}
                onChange={(e) => setPurchaseUrl2(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingRegisterConfig}
                className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {savingRegisterConfig ? '保存中...' : '保存购卡链接'}
              </button>
            </div>
            <div className="text-xs text-gray-500">上述购卡链接将公开给注册页显示为两个按钮。</div>
          </form>
        )}
      </section>

      {/* 激活码管理区域 */}
      <section className="bg-white p-6 border border-gray-200 rounded-lg space-y-6">
        {/* 激活码管理标题和下载按钮 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">激活码管理</h2>
          <div className="flex items-center gap-3">
            <select
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value as 'all' | 'used' | 'unused')}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">全部激活码</option>
              <option value="used">已使用激活码</option>
              <option value="unused">未使用激活码</option>
            </select>
            <button
              type="button"
              onClick={() => handleDownloadCodes(downloadType)}
              className="dos-btn px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              下载TXT
            </button>
            {lastGeneratedCodes.length > 0 && (
              <button
                type="button"
                onClick={() => downloadTxt(lastGeneratedCodes, `activation-codes-latest.txt`)}
                className="dos-btn px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
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
              className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60 transition-colors"
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
                    className="dos-btn px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
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
        {/* 分页 */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            disabled={codePage <= 1}
            onClick={() => setCodePage(p => Math.max(1, p - 1))}
            className="dos-btn px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
          >上一页</button>
          <span className="text-sm text-gray-600">第 {codePage} / {codeTotalPages} 页</span>
          <button
            type="button"
            disabled={codePage >= codeTotalPages}
            onClick={() => setCodePage(p => Math.min(codeTotalPages, p + 1))}
            className="dos-btn px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
          >下一页</button>
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
  const content = lines.join('\n') + '\n';
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


