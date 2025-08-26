'use client';

import { useState, useEffect } from 'react';

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
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
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
        fetchUsers();
      } else {
        setError(data.message || '创建用户失败');
      }
    } catch (error) {
      console.error('Create user error:', error);
      setError('网络错误');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUser),
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
        fetchUsers();
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
        fetchUsers();
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
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : groupId;
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                创建用户
              </button>
            </div>

            {/* 用户列表 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分组
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getGroupName(user.group)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      创建
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 编辑用户表单 */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">编辑用户</h3>
                <form onSubmit={handleUpdateUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">用户名</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={editUser.username}
                      onChange={(e) => setEditUser({...editUser, username: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">邮箱</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      value={editUser.email}
                      onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    />
                  </div>
                  <div className="mb-4">
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
                  <div className="mb-4">
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
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      保存
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
