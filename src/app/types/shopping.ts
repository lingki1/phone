// 购物功能类型定义

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isOnSale: boolean;
  discountPercentage?: number;
  createdAt: number;
  relatedChatIds: string[]; // 关联的聊天ID
  generatedFrom: string; // 生成来源的聊天内容摘要
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

export interface ShoppingCart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  lastUpdated: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  shippingAddress?: string;
  paymentMethod?: string;
}

export interface ChatAnalysis {
  keywords: string[];
  interests: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  productPreferences: string[];
}

export interface ProductGenerationRequest {
  chatHistory: string;
  userInterests: string[];
  keywords: string[];
  category?: string;
  maxProducts?: number;
}

export interface ProductGenerationResponse {
  products: Product[];
  analysis: ChatAnalysis;
  generationTime: number;
} 