import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  uid: string;
  username: string;
  password: string;
  role: 'super_admin' | 'admin' | 'user';
  group: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  avatar?: string;
  email?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  uid: string;
  token: string;
  expires_at: string;
  created_at: string;
}

class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // 根据环境确定数据库路径
    if (process.env.NODE_ENV === 'production') {
      // Docker环境：使用挂载的data目录
      this.dbPath = '/app/data/phone.db';
    } else {
      // 本地开发环境：使用相对路径
      this.dbPath = path.join(process.cwd(), 'data', 'phone.db');
    }

    // 确保data目录存在
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async init(): Promise<void> {
    try {
      // 创建数据库连接
      this.db = new sqlite3.Database(this.dbPath);
      
      // 启用WAL模式提高性能
      await this.run('PRAGMA journal_mode = WAL');
      
      // 创建用户表
      await this.run(`
        CREATE TABLE IF NOT EXISTS users (
          uid TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')) DEFAULT 'user',
          group_id TEXT NOT NULL DEFAULT 'default',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login TEXT,
          avatar TEXT,
          email TEXT
        )
      `);

      // 创建用户分组表
      await this.run(`
        CREATE TABLE IF NOT EXISTS user_groups (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_by TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (created_by) REFERENCES users (uid)
        )
      `);

      // 创建用户会话表
      await this.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          uid TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (uid) REFERENCES users (uid)
        )
      `);

      // 创建索引
      await this.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_users_group ON users (group_id)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions (token)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_sessions_uid ON user_sessions (uid)');
      await this.run('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions (expires_at)');

      // 初始化默认分组
      await this.initDefaultGroups();
      
      // 初始化超级管理员（如果不存在）
      await this.initSuperAdmin();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async initDefaultGroups(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    // 创建默认分组
    await this.run(`
      INSERT OR IGNORE INTO user_groups (id, name, description, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['default', '默认分组', '系统默认分组', 'system', now, now]);
  }

  private async initSuperAdmin(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const hashedPassword = await bcrypt.hash('11111111', 10);
    
    await this.run(`
      INSERT OR IGNORE INTO users (uid, username, password, role, group_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), 'lingki', hashedPassword, 'super_admin', 'default', now, now]);
  }

  // 辅助方法：执行SQL语句
  private run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.run(sql, params, function(err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  // 辅助方法：获取单条记录
  private get(sql: string, params: unknown[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.get(sql, params, (err: Error | null, row: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 辅助方法：获取多条记录
  private all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      this.db.all(sql, params, (err: Error | null, rows: unknown[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // 用户相关方法
  async createUser(userData: Omit<User, 'uid' | 'created_at' | 'updated_at'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    const user: User = {
      ...userData,
      uid: uuidv4(),
      created_at: now,
      updated_at: now
    };

    await this.run(`
      INSERT INTO users (uid, username, password, role, group_id, created_at, updated_at, last_login, avatar, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.uid,
      user.username,
      user.password,
      user.role,
      user.group,
      user.created_at,
      user.updated_at,
      user.last_login,
      user.avatar,
      user.email
    ]);

    return user;
  }

  async getUserByUid(uid: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.get('SELECT * FROM users WHERE uid = ?', [uid]);
    return result as User || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.get('SELECT * FROM users WHERE username = ?', [username]);
    return result as User || null;
  }

  async updateUser(uid: string, updates: Partial<Omit<User, 'uid' | 'created_at'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(updates).filter(key => key !== 'uid' && key !== 'created_at');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof typeof updates]);
    values.push(new Date().toISOString()); // updated_at
    values.push(uid); // WHERE condition

    await this.run(`
      UPDATE users SET ${setClause}, updated_at = ? WHERE uid = ?
    `, values);
  }

  async deleteUser(uid: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.run('DELETE FROM users WHERE uid = ?', [uid]);
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.all('SELECT * FROM users ORDER BY created_at DESC');
    return result as User[];
  }

  async getUsersByGroup(groupId: string): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.all('SELECT * FROM users WHERE group_id = ? ORDER BY created_at DESC', [groupId]);
    return result as User[];
  }

  async getUsersByRole(role: User['role']): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.all('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC', [role]);
    return result as User[];
  }

  // 分组相关方法
  async createGroup(groupData: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>): Promise<UserGroup> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    const group: UserGroup = {
      ...groupData,
      id: uuidv4(),
      created_at: now,
      updated_at: now
    };

    await this.run(`
      INSERT INTO user_groups (id, name, description, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      group.id,
      group.name,
      group.description,
      group.created_by,
      group.created_at,
      group.updated_at
    ]);

    return group;
  }

  async getAllGroups(): Promise<UserGroup[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.all('SELECT * FROM user_groups ORDER BY created_at DESC');
    return result as UserGroup[];
  }

  async getGroupById(id: string): Promise<UserGroup | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.get('SELECT * FROM user_groups WHERE id = ?', [id]);
    return result as UserGroup || null;
  }

  async updateGroup(id: string, updates: Partial<Omit<UserGroup, 'id' | 'created_at' | 'created_by'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at' && key !== 'created_by');
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof typeof updates]);
    values.push(new Date().toISOString()); // updated_at
    values.push(id); // WHERE condition

    await this.run(`
      UPDATE user_groups SET ${setClause}, updated_at = ? WHERE id = ?
    `, values);
  }

  async deleteGroup(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 首先将该分组下的用户移动到默认分组
    await this.run('UPDATE users SET group_id = ? WHERE group_id = ?', ['default', id]);

    // 然后删除分组
    await this.run('DELETE FROM user_groups WHERE id = ?', [id]);
  }

  // 会话相关方法
  async createSession(sessionData: Omit<UserSession, 'id' | 'created_at'>): Promise<UserSession> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    const session: UserSession = {
      ...sessionData,
      id: uuidv4(),
      created_at: now
    };

    await this.run(`
      INSERT INTO user_sessions (id, uid, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      session.id,
      session.uid,
      session.token,
      session.expires_at,
      session.created_at
    ]);

    return session;
  }

  async getSessionByToken(token: string): Promise<UserSession | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.get('SELECT * FROM user_sessions WHERE token = ?', [token]);
    return result as UserSession || null;
  }

  async deleteSession(token: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.run('DELETE FROM user_sessions WHERE token = ?', [token]);
  }

  async deleteExpiredSessions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.run('DELETE FROM user_sessions WHERE expires_at < ?', [now]);
  }

  async deleteUserSessions(uid: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.run('DELETE FROM user_sessions WHERE uid = ?', [uid]);
  }

  // 关闭数据库连接
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 创建单例实例
const databaseManager = new DatabaseManager();

export default databaseManager;
