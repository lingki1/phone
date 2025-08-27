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
  tags?: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
