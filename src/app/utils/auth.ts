import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import databaseManager, { User } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token有效期7天

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  role?: 'user' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Omit<User, 'password'>;
}

export interface AuthUser {
  uid: string;
  username: string;
  role: User['role'];
  group: string;
}

class AuthService {
  /**
   * 用户登录
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { username, password } = loginData;

      // 验证输入
      if (!username || !password) {
        return {
          success: false,
          message: '用户名和密码不能为空'
        };
      }

      // 查找用户
      const user = await databaseManager.getUserByUsername(username);
      if (!user) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          uid: user.uid, 
          username: user.username, 
          role: user.role,
          group: user.group
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // 创建会话记录
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7天后过期

      await databaseManager.createSession({
        uid: user.uid,
        token,
        expires_at: expiresAt.toISOString()
      });

      // 更新最后登录时间
      await databaseManager.updateUser(user.uid, {
        last_login: new Date().toISOString()
      });

      // 返回用户信息（不包含密码）
      const { password: _userPassword, ...userWithoutPassword } = user;

      return {
        success: true,
        message: '登录成功',
        token,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '登录失败，请稍后重试'
      };
    }
  }

  /**
   * 用户注册
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const { username, password, email, role = 'user' } = registerData;

      // 验证输入
      if (!username || !password) {
        return {
          success: false,
          message: '用户名和密码不能为空'
        };
      }

      if (username.length < 3 || username.length > 20) {
        return {
          success: false,
          message: '用户名长度必须在3-20个字符之间'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          message: '密码长度不能少于6个字符'
        };
      }

      // 检查用户名是否已存在
      const existingUser = await databaseManager.getUserByUsername(username);
      if (existingUser) {
        return {
          success: false,
          message: '用户名已存在'
        };
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await databaseManager.createUser({
        username,
        password: hashedPassword,
        role,
        group: 'default',
        email
      });

      // 生成JWT token
      const token = jwt.sign(
        { 
          uid: user.uid, 
          username: user.username, 
          role: user.role,
          group: user.group
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // 创建会话记录
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await databaseManager.createSession({
        uid: user.uid,
        token,
        expires_at: expiresAt.toISOString()
      });

      // 返回用户信息（不包含密码）
      const { password: _userPassword, ...userWithoutPassword } = user;

      return {
        success: true,
        message: '注册成功',
        token,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试'
      };
    }
  }

  /**
   * 验证JWT token
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // 验证JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

      // 检查会话是否存在且未过期
      const session = await databaseManager.getSessionByToken(token);
      if (!session) {
        return null;
      }

      // 检查会话是否过期
      if (new Date(session.expires_at) < new Date()) {
        await databaseManager.deleteSession(token);
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * 用户登出
   */
  async logout(token: string): Promise<boolean> {
    try {
      await databaseManager.deleteSession(token);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(token: string): Promise<AuthResponse> {
    try {
      // 验证当前token
      const authUser = await this.verifyToken(token);
      if (!authUser) {
        return {
          success: false,
          message: 'Token无效或已过期'
        };
      }

      // 获取用户信息
      const user = await databaseManager.getUserByUid(authUser.uid);
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      // 删除旧会话
      await databaseManager.deleteSession(token);

      // 生成新token
      const newToken = jwt.sign(
        { 
          uid: user.uid, 
          username: user.username, 
          role: user.role,
          group: user.group
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // 创建新会话
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await databaseManager.createSession({
        uid: user.uid,
        token: newToken,
        expires_at: expiresAt.toISOString()
      });

      // 返回用户信息（不包含密码）
      const { password: _userPassword, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'Token刷新成功',
        token: newToken,
        user: userWithoutPassword
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token刷新失败'
      };
    }
  }

  /**
   * 检查用户权限
   */
  hasPermission(userRole: User['role'], requiredRole: User['role']): boolean {
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'user': 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await databaseManager.deleteExpiredSessions();
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
    }
  }
}

// 创建单例实例
const authService = new AuthService();

export default authService;
