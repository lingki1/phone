'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

export default function RegisterForm({ onSwitchToLogin: _onSwitchToLogin, onRegisterSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证密码确认
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      setError('密码长度不能少于6个字符');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          email: email || undefined 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 注册成功
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          // 如果没有回调，则跳转到主页
          router.push('/');
          router.refresh();
        }
      } else {
        setError(data.message || '注册失败');
      }
    } catch (error) {
      console.error('Register error:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && (
        <div className="auth-error">{error}</div>
      )}

      <div className="auth-form-group">
        <label htmlFor="username" className="auth-label">
          用户名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="auth-input"
          placeholder="请输入用户名 (3-20个字符)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={20}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="email" className="auth-label">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="auth-input"
          placeholder="请输入邮箱 (可选)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="password" className="auth-label">
          密码
        </label>
        <div className="auth-password-toggle">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="auth-input"
            placeholder="请输入密码 (至少6个字符)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
      </div>

      <div className="auth-form-group">
        <label htmlFor="confirmPassword" className="auth-label">
          确认密码
        </label>
        <div className="auth-password-toggle">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="auth-input"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="auth-button"
      >
        {loading && <span className="auth-loading"></span>}
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  );
}
