import { NextRequest, NextResponse } from 'next/server';
import authService from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    username: string;
    role: 'super_admin' | 'admin' | 'user';
    group: string;
  };
}

/**
 * 认证中间件
 * 验证用户是否已登录
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    const authUser = await authService.verifyToken(token);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Token无效或已过期' },
        { status: 401 }
      );
    }

    // 将用户信息添加到请求对象中
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authUser;

    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { success: false, message: '认证失败' },
      { status: 401 }
    );
  }
}

/**
 * 权限中间件
 * 验证用户是否有指定权限
 */
export function withPermission(
  requiredRole: 'super_admin' | 'admin' | 'user'
) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    try {
      const token = request.cookies.get('token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { success: false, message: '未登录' },
          { status: 401 }
        );
      }

      const authUser = await authService.verifyToken(token);
      if (!authUser) {
        return NextResponse.json(
          { success: false, message: 'Token无效或已过期' },
          { status: 401 }
        );
      }

      // 检查权限
      if (!authService.hasPermission(authUser.role, requiredRole)) {
        return NextResponse.json(
          { success: false, message: '权限不足' },
          { status: 403 }
        );
      }

      // 将用户信息添加到请求对象中
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = authUser;

      return await handler(authenticatedRequest);
    } catch (error) {
      console.error('Permission middleware error:', error);
      return NextResponse.json(
        { success: false, message: '权限验证失败' },
        { status: 403 }
      );
    }
  };
}

/**
 * 可选认证中间件
 * 如果用户已登录，将用户信息添加到请求对象中，但不强制要求登录
 */
export async function withOptionalAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('token')?.value;
    
    const authenticatedRequest = request as AuthenticatedRequest;
    
    if (token) {
      const authUser = await authService.verifyToken(token);
      if (authUser) {
        authenticatedRequest.user = authUser;
      }
    }

    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // 可选认证失败不影响请求处理
    const authenticatedRequest = request as AuthenticatedRequest;
    return await handler(authenticatedRequest);
  }
}
