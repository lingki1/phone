import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import databaseManager, { User } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token有效期7天
const DEPLOY_VERSION = process.env.DEPLOY_VERSION || Date.now().toString(); // 部署版本标识

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  role?: 'super_admin' | 'admin' | 'user';
  activationCode?: string;
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
          group: user.group,
          deployVersion: DEPLOY_VERSION // 添加部署版本
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
      const { username, password, email, role = 'user', activationCode } = registerData;

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

      // 检查是否启用了激活码注册
      const requireSetting = await databaseManager.getSetting('register_require_activation');
      const requireActivation = requireSetting?.value === 'true';
      if (requireActivation) {
        if (!activationCode) {
          return {
            success: false,
            message: '需要提供激活码'
          };
        }
        // 预检查激活码是否可用（未被使用）
        // 这里通过尝试消费时的受影响行数判断，避免并发重复使用
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

      // 如果需要激活码，则消费该激活码（原子性由UPDATE条件保证）
      if (requireActivation) {
        const consumed = await databaseManager.consumeActivationCode(activationCode as string, user.uid);
        if (!consumed) {
          // 回滚用户创建以避免产生无效用户（简单处理：删除刚创建的用户及其会话）
          await databaseManager.deleteUser(user.uid);
          return {
            success: false,
            message: '激活码无效或已被使用'
          };
        }
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          uid: user.uid, 
          username: user.username, 
          role: user.role,
          group: user.group,
          deployVersion: DEPLOY_VERSION // 添加部署版本
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
   * 验证Token
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // 验证JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & { deployVersion?: string };
      
      // 检查部署版本是否匹配（如果不匹配，说明是旧部署的token）
      if (decoded.deployVersion && decoded.deployVersion !== DEPLOY_VERSION) {
        console.log('Token deploy version mismatch, invalidating token');
        return null;
      }
      
      // 检查会话是否存在且未过期
      const session = await databaseManager.getSessionByToken(token);
      if (!session) {
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      if (now > expiresAt) {
        // 删除过期会话
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
   * 检查权限
   */
  hasPermission(userRole: User['role'], requiredRole: 'super_admin' | 'admin' | 'user'): boolean {
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
