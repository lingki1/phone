'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  username: string;
  role: 'super_admin' | 'admin' | 'user';
  group: string;
  created_at: string;
  last_login?: string;
  email?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentUser, setCurrentUser] = useState<{ uid: string; username: string; role: 'super_admin' | 'admin' | 'user'; group: string } | null>(null);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [groupError, setGroupError] = useState('');

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        router.push('/admin/settings');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [router]);

  // 新用户表单状态
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    group: 'default'
  });

  // 编辑用户表单状态
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
    group: 'default'
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUsers(page, searchTerm);
    fetchGroups();
  }, [page, searchTerm]);

  // 获取当前登录用户（用于判断是否展示重置密码功能）
  useEffect(() => {
    let cancelled = false;
    const loadCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (_e) {
        // 忽略
      }
    };
    loadCurrentUser();
    return () => { cancelled = true; };
  }, []);

  const fetchUsers = async (p = 1, term = '') => {
    try {
      const q = term && term.trim() ? `&q=${encodeURIComponent(term.trim())}` : '';
      const response = await fetch(`/api/users?page=${p}&limit=20${q}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setTotalPages(Number(data.pagination?.totalPages || 1));
      } else {
        setError(data.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Fetch groups error:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setNewUser({
          username: '',
          password: '',
          email: '',
          role: 'user',
          group: 'default'
        });
        fetchUsers(page);
      } else {
        setError(data.message || '创建用户失败');
      }
    } catch (error) {
      console.error('Create user error:', error);
      setError('网络错误');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError('');

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGroup),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateGroupForm(false);
        setNewGroup({ name: '', description: '' });
        fetchGroups();
      } else {
        setGroupError(data.message || '创建分组失败');
      }
    } catch (error) {
      console.error('Create group error:', error);
      setGroupError('网络错误');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const payload: { username: string; email: string; role: 'user' | 'admin' | 'super_admin'; group: string; password?: string } = { ...editUser };
      // 仅超级管理员可重置用户密码
      if (currentUser?.role === 'super_admin' && newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const response = await fetch(`/api/users/${editingUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setEditingUser(null);
        setEditUser({
          username: '',
          email: '',
          role: 'user',
          group: 'default'
        });
        setNewPassword('');
        fetchUsers(page);
      } else {
        setError(data.message || '更新用户失败');
      }
    } catch (error) {
      console.error('Update user error:', error);
      setError('网络错误');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('确定要删除这个用户吗？')) return;

    try {
      const response = await fetch(`/api/users/${uid}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers(page);
      } else {
        setError(data.message || '删除用户失败');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      setError('网络错误');
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      username: user.username,
      email: user.email || '',
      role: user.role,
      group: user.group
    });
    setNewPassword('');
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      'super_admin': '超级管理员',
      'admin': '管理员',
      'user': '用户'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getGroupName = (groupId: string) => {
    if (!groupId) return '未分组';
    if (groupId === 'default') return '默认分组';
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : groupId;
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="dos min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/settings"
                  className="dos-btn px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  激活码与注册设置 (Ctrl+S)
                </Link>
                <button
                  onClick={() => setShowCreateGroupForm(true)}
                  className="dos-btn px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  创建分组
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="dos-btn bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  创建用户
                </button>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="搜索用户名、UID或邮箱..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={handleSearch}
                className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                搜索
              </button>
            </div>

            {/* 编辑用户表单 */}
            {editingUser && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">编辑用户</h3>
                <form onSubmit={handleUpdateUser}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">用户名</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={editUser.username}
                        onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">邮箱</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={editUser.email}
                        onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                      />
                    </div>
                    {currentUser?.role === 'super_admin' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">新密码（仅超级管理员可见）</label>
                        <input
                          type="password"
                          placeholder="重置用户密码（可选）"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">留空则不修改密码</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">角色</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={editUser.role}
                        onChange={(e) => setEditUser({...editUser, role: e.target.value as 'user' | 'admin' | 'super_admin'})}
                      >
                        <option value="user">用户</option>
                        <option value="admin">管理员</option>
                        <option value="super_admin">超级管理员</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">分组</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        value={editUser.group}
                        onChange={(e) => setEditUser({...editUser, group: e.target.value})}
                      >
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="dos-btn px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      保存
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 用户列表 */}
            <div className="border border-gray-200 rounded">
              <div className="grid grid-cols-8 text-sm font-medium bg-gray-50 border-b">
                <div className="p-2">用户名</div>
                <div className="p-2">UID</div>
                <div className="p-2">角色</div>
                <div className="p-2">分组</div>
                <div className="p-2">邮箱</div>
                <div className="p-2">创建时间</div>
                <div className="p-2">最后登录</div>
                <div className="p-2">操作</div>
              </div>
              <div className="divide-y">
                {users.map((user) => (
                  <div key={user.uid} className="grid grid-cols-8 text-sm items-center">
                    <div className="p-2 font-medium">{user.username}</div>
                    <div className="p-2 font-mono text-xs">{user.uid}</div>
                    <div className="p-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <div className="p-2">{getGroupName(user.group)}</div>
                    <div className="p-2">{user.email || '-'}</div>
                    <div className="p-2">{new Date(user.created_at).toLocaleString()}</div>
                    <div className="p-2">{user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</div>
                    <div className="p-2">
                      {user.role === 'super_admin' ? (
                        <span className="text-gray-400 text-xs">
                          超级管理员权限受保护
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">
                    {searchTerm ? '没有找到匹配的用户' : '暂无用户'}
                  </div>
                )}
              </div>
            </div>

            {/* 分页 */}
            <div className="flex items-center justify-between mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="dos-btn px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
              >上一页</button>
              <span className="text-sm text-gray-600">第 {page} / {totalPages} 页</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="dos-btn px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
              >下一页</button>
            </div>
          </div>
        </div>

        {/* 创建用户表单 */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">创建用户</h3>
                <form onSubmit={handleCreateUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">用户名</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">密码</label>
                    <input
                      type="password"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">邮箱</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">角色</label>
                                         <select
                       className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                       value={newUser.role}
                       onChange={(e) => setNewUser({...newUser, role: e.target.value as 'user' | 'admin'})}
                     >
                      <option value="user">用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">分组</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newUser.group}
                      onChange={(e) => setNewUser({...newUser, group: e.target.value})}
                    >
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="dos-btn px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      创建
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 创建分组表单 */}
        {showCreateGroupForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">创建分组</h3>
                <form onSubmit={handleCreateGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">分组名称</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">描述（可选）</label>
                    <textarea
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    />
                  </div>
                  {groupError && (
                    <div className="mb-3 text-sm text-red-600">{groupError}</div>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => { setShowCreateGroupForm(false); setGroupError(''); }}
                      className="dos-btn px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="dos-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      创建
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
