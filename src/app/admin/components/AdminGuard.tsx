'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  username: string;
  role: 'super_admin' | 'admin' | 'user';
  group: string;
}

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        // 未登录，重定向到认证页面
        router.push('/auth?redirect=/admin');
        return;
      }
      
      const userData = data.user;
      
      // 检查是否有管理员权限
      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        setError('权限不足：需要管理员或超级管理员权限才能访问此页面');
        setLoading(false);
        return;
      }
      
      setUser(userData);
      setLoading(false);
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('认证检查失败，请重新登录');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="dos dos-body">
        <div className="min-h-screen flex items-center justify-center">
          <div className="dos-panel p-8">
            <div className="dos-title p-3 mb-4">ADMIN</div>
            <div className="text-center">
              <div className="text-lg mb-2">正在验证权限...</div>
              <div className="text-sm dos-dim">请稍候</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dos dos-body">
        <div className="min-h-screen flex items-center justify-center">
          <div className="dos-panel p-8">
            <div className="dos-title p-3 mb-4">ACCESS DENIED</div>
            <div className="text-center">
              <div className="text-lg mb-4 text-red-400">{error}</div>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth')}
                  className="dos-btn px-4 py-2 mr-3"
                >
                  重新登录
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="dos-btn px-4 py-2"
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {children}
    </>
  );
}