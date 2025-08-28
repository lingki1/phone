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
  
  // 删除实际文件
  try {
    const filePath = path.join(publicUploadDir, path.basename(item.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
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

