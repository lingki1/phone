export interface CharacterCard {
  id: string;
  name: string;
  description: string;
  author: string;
  uploadDate: string;
  downloadCount: number;
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface WorldBook {
  id: string;
  name: string;
  description: string;
  author: string;
  uploadDate: string;
  downloadCount: number;
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  content?: Record<string, unknown>;
}

export interface BlackMarketItem {
  id: string;
  type: 'character' | 'worldbook';
  name: string;
  description: string;
  author: string;
  uploadDate: string;
  downloadCount: number;
  fileUrl: string;
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

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
