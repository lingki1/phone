import { NextResponse, NextRequest } from 'next/server';
import { deleteItem, findItemById } from '@/lib/blackmarket/storage';
import { getCurrentUser } from '@/lib/auth-utils';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 获取当前用户信息
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 查找要删除的item
    const item = findItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 权限检查：作者可以删除自己的内容，管理员和超级管理员可以删除任意内容
    const isAuthor = item.author === currentUser.username;
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';
    
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own content' }, { status: 403 });
    }

    // 执行删除
    const success = deleteItem(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Item deleted successfully',
      deletedItem: {
        id: item.id,
        name: item.name,
        type: item.type
      }
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
