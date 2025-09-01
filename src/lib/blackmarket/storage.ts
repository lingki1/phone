import fs from 'fs';
import path from 'path';

export type BlackMarketItemType = 'character' | 'worldbook';

export interface StoredItem {
  id: string;
  type: BlackMarketItemType;
  name: string;
  description: string;
  author: string;
  uploadDate: string; // ISO string
  downloadCount: number;
  fileUrl: string; // public-accessible URL under /uploads
  thumbnailUrl?: string;
  tags: string[];
  // 新增缩略图字段
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
  metadata?: Record<string, unknown>;
}

const dataDir = path.join(process.cwd(), 'data', 'blackmarket');
const publicUploadDir = path.join(process.cwd(), 'public', 'uploads', 'blackmarket');
const dataFile = path.join(dataDir, 'items.json');

function ensureDirs() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicUploadDir)) fs.mkdirSync(publicUploadDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ items: [] }, null, 2), 'utf-8');
}

export function getUploadDir() {
  ensureDirs();
  return publicUploadDir;
}

export function readAllItems(): StoredItem[] {
  ensureDirs();
  try {
    const raw = fs.readFileSync(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function writeAllItems(items: StoredItem[]) {
  ensureDirs();
  fs.writeFileSync(dataFile, JSON.stringify({ items }, null, 2), 'utf-8');
}

export function addItem(item: StoredItem) {
  const items = readAllItems();
  items.unshift(item);
  writeAllItems(items);
}

export function findItemById(id: string): StoredItem | undefined {
  return readAllItems().find(i => i.id === id);
}

export function incrementDownload(id: string) {
  const items = readAllItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx].downloadCount = (items[idx].downloadCount || 0) + 1;
    writeAllItems(items);
  }
}

export function deleteItem(id: string): boolean {
  const items = readAllItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) {
    return false;
  }

  const item = items[idx];
  
  // 删除实际文件和所有缩略图
  try {
    // 删除原始文件
    const filePath = path.join(publicUploadDir, path.basename(item.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`删除原始文件: ${filePath}`);
    }

    // 删除缩略图文件
    if (item.thumbnails) {
      // 删除小尺寸缩略图
      if (item.thumbnails.small) {
        const smallThumbPath = path.join(publicUploadDir, 'thumbnails', path.basename(item.thumbnails.small));
        if (fs.existsSync(smallThumbPath)) {
          fs.unlinkSync(smallThumbPath);
          console.log(`删除小尺寸缩略图: ${smallThumbPath}`);
        }
      }

      // 删除中尺寸缩略图
      if (item.thumbnails.medium) {
        const mediumThumbPath = path.join(publicUploadDir, 'thumbnails', path.basename(item.thumbnails.medium));
        if (fs.existsSync(mediumThumbPath)) {
          fs.unlinkSync(mediumThumbPath);
          console.log(`删除中尺寸缩略图: ${mediumThumbPath}`);
        }
      }

      // 删除大尺寸缩略图
      if (item.thumbnails.large) {
        const largeThumbPath = path.join(publicUploadDir, 'thumbnails', path.basename(item.thumbnails.large));
        if (fs.existsSync(largeThumbPath)) {
          fs.unlinkSync(largeThumbPath);
          console.log(`删除大尺寸缩略图: ${largeThumbPath}`);
        }
      }
    } else if (item.thumbnailUrl && item.thumbnailUrl !== item.fileUrl) {
      // 如果没有thumbnails字段但有thumbnailUrl，且不是原图，则删除缩略图
      const thumbnailPath = path.join(publicUploadDir, path.basename(item.thumbnailUrl));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        console.log(`删除缩略图: ${thumbnailPath}`);
      }
    }

    // 检查并清理空的缩略图目录
    const thumbnailDir = path.join(publicUploadDir, 'thumbnails');
    if (fs.existsSync(thumbnailDir)) {
      const thumbnailFiles = fs.readdirSync(thumbnailDir);
      if (thumbnailFiles.length === 0) {
        fs.rmdirSync(thumbnailDir);
        console.log('删除空的缩略图目录');
      }
    }

  } catch (error) {
    console.error('Error deleting files:', error);
    // 即使文件删除失败，也继续删除记录
  }

  // 从列表中删除
  items.splice(idx, 1);
  writeAllItems(items);
  
  return true;
}

export function toPublicUrl(filename: string) {
  return `/api/blackmarket/files/${filename}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// 清理孤立的缩略图文件（用于维护和调试）
export function cleanupOrphanedThumbnails(): { deleted: number; errors: string[] } {
  const result = { deleted: 0, errors: [] as string[] };
  
  try {
    const thumbnailDir = path.join(publicUploadDir, 'thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      return result;
    }

    const thumbnailFiles = fs.readdirSync(thumbnailDir);
    const items = readAllItems();
    
    // 收集所有有效的缩略图文件名
    const validThumbnails = new Set<string>();
    items.forEach(item => {
      if (item.thumbnails) {
        if (item.thumbnails.small) validThumbnails.add(path.basename(item.thumbnails.small));
        if (item.thumbnails.medium) validThumbnails.add(path.basename(item.thumbnails.medium));
        if (item.thumbnails.large) validThumbnails.add(path.basename(item.thumbnails.large));
      }
    });

    // 删除孤立的缩略图文件
    thumbnailFiles.forEach(filename => {
      if (!validThumbnails.has(filename)) {
        try {
          const filePath = path.join(thumbnailDir, filename);
          fs.unlinkSync(filePath);
          result.deleted++;
          console.log(`清理孤立缩略图: ${filename}`);
        } catch (error) {
          const errorMsg = `删除孤立缩略图失败 ${filename}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    });

    // 如果缩略图目录为空，删除目录
    if (fs.readdirSync(thumbnailDir).length === 0) {
      fs.rmdirSync(thumbnailDir);
      console.log('删除空的缩略图目录');
    }

  } catch (error) {
    const errorMsg = `清理孤立缩略图时发生错误: ${error}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
  }

  return result;
}

