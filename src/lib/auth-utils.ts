import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import databaseManager from '@/app/auth/utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface CurrentUser {
  uid: string;
  username: string;
  role: string;
  group: string;
}

interface JwtPayload {
  uid: string;
  username?: string;
  role?: string;
  group?: string;
  iat?: number;
  exp?: number;
}

/**
 * 从请求中获取当前用户信息
 */
export async function getCurrentUser(req: NextRequest): Promise<CurrentUser | null> {
  try {
    // 从Cookie中获取token
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return null;
    }

    // 验证JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.uid) {
      return null;
    }

    // 从数据库获取最新的用户信息
    const user = await databaseManager.getUserByUid(decoded.uid);
    
    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      username: user.username,
      role: user.role,
      group: user.group
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * 从Authorization header中获取当前用户信息
 */
export async function getCurrentUserFromHeader(req: NextRequest): Promise<CurrentUser | null> {
  try {
    // 从Authorization header中获取token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.uid) {
      return null;
    }

    // 从数据库获取最新的用户信息
    const user = await databaseManager.getUserByUid(decoded.uid);
    
    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      username: user.username,
      role: user.role,
      group: user.group
    };
  } catch (error) {
    console.error('Error getting current user from header:', error);
    return null;
  }
}
