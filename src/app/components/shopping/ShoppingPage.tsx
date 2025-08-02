'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, ShoppingCart, CartItem } from '../../types/shopping';
import { ProductGenerator } from './ProductGenerator';
import ProductCard from './ProductCard';
import ShoppingCartComponent from './ShoppingCart';
import './ShoppingPage.css';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

interface ShoppingPageProps {
  apiConfig: ApiConfig;
  onBack: () => void;
}

export default function ShoppingPage({ apiConfig, onBack }: ShoppingPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<ShoppingCart>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    lastUpdated: Date.now()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'rating' | 'newest'>('default');

  const productGenerator = useMemo(() => new ProductGenerator(apiConfig), [apiConfig]);

  // 初始化：生成商品
  useEffect(() => {
    const initProducts = async () => {
      if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
        setIsLoading(false);
        return;
      }

      setIsGenerating(true);
      try {
        const generatedProducts = await productGenerator.generateProductsFromAllChats();
        setProducts(generatedProducts);
      } catch (error) {
        console.error('生成商品失败:', error);
        // 如果生成失败，使用示例商品
        setProducts(getSampleProducts());
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };

    initProducts();
  }, [apiConfig, productGenerator]);

  // 生成商品
  const generateProducts = async () => {
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
      setIsLoading(false);
      return;
    }

    setIsGenerating(true);
    try {
      const generatedProducts = await productGenerator.generateProductsFromAllChats();
      setProducts(generatedProducts);
    } catch (error) {
      console.error('生成商品失败:', error);
      // 如果生成失败，使用示例商品
      setProducts(getSampleProducts());
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // 示例商品（当AI生成失败时使用）
  const getSampleProducts = (): Product[] => {
    return [
      {
        id: 'sample_1',
        name: '智能手表',
        description: '功能强大的智能手表，支持健康监测和运动追踪',
        price: 299.99,
        originalPrice: 399.99,
        image: '📦',
        category: '电子产品',
        tags: ['智能', '健康', '运动'],
        rating: 4.5,
        reviewCount: 128,
        stock: 50,
        isOnSale: true,
        discountPercentage: 25,
        createdAt: Date.now(),
        relatedChatIds: [],
        generatedFrom: '基于用户兴趣：科技产品'
      },
      {
        id: 'sample_2',
        name: '无线耳机',
        description: '高品质无线蓝牙耳机，音质清晰，续航持久',
        price: 199.99,
        originalPrice: 249.99,
        image: '📦',
        category: '电子产品',
        tags: ['无线', '蓝牙', '音质'],
        rating: 4.3,
        reviewCount: 89,
        stock: 30,
        isOnSale: true,
        discountPercentage: 20,
        createdAt: Date.now(),
        relatedChatIds: [],
        generatedFrom: '基于用户兴趣：音乐设备'
      },
      {
        id: 'sample_3',
        name: '咖啡机',
        description: '全自动咖啡机，一键制作美味咖啡',
        price: 599.99,
        originalPrice: 699.99,
        image: '📦',
        category: '家用电器',
        tags: ['咖啡', '自动', '家用'],
        rating: 4.7,
        reviewCount: 256,
        stock: 15,
        isOnSale: true,
        discountPercentage: 14,
        createdAt: Date.now(),
        relatedChatIds: [],
        generatedFrom: '基于用户兴趣：咖啡文化'
      }
    ];
  };

  // 添加到购物车
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.items.find(item => item.productId === product.id);
      
      if (existingItem) {
        // 如果商品已在购物车中，增加数量
        const updatedItems = prevCart.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        return {
          ...prevCart,
          items: updatedItems,
          totalItems: prevCart.totalItems + 1,
          totalPrice: prevCart.totalPrice + product.price,
          lastUpdated: Date.now()
        };
      } else {
        // 添加新商品到购物车
        const newItem: CartItem = {
          productId: product.id,
          quantity: 1,
          addedAt: Date.now()
        };
        
        return {
          ...prevCart,
          items: [...prevCart.items, newItem],
          totalItems: prevCart.totalItems + 1,
          totalPrice: prevCart.totalPrice + product.price,
          lastUpdated: Date.now()
        };
      }
    });
  };

  // 更新购物车商品数量
  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => {
      const product = products.find(p => p.id === productId);
      if (!product) return prevCart;

      const updatedItems = prevCart.items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      );

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
      }, 0);

      return {
        ...prevCart,
        items: updatedItems,
        totalItems,
        totalPrice,
        lastUpdated: Date.now()
      };
    });
  };

  // 从购物车移除商品
  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const item = prevCart.items.find(item => item.productId === productId);
      if (!item) return prevCart;

      const product = products.find(p => p.id === productId);
      const itemTotal = (product?.price || 0) * item.quantity;

      return {
        ...prevCart,
        items: prevCart.items.filter(item => item.productId !== productId),
        totalItems: prevCart.totalItems - item.quantity,
        totalPrice: prevCart.totalPrice - itemTotal,
        lastUpdated: Date.now()
      };
    });
  };

  // 结账
  const handleCheckout = () => {
    alert('感谢您的购买！订单已提交，我们会尽快为您处理。');
    // 清空购物车
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      lastUpdated: Date.now()
    });
  };



  // 过滤和排序商品
  const getFilteredAndSortedProducts = () => {
    let filtered = products;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 排序
    switch (sortBy) {
      case 'price':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // 检查商品是否在购物车中
  const isProductInCart = (productId: string) => {
    return cart.items.some(item => item.productId === productId);
  };

  return (
    <div className="shopping-page">
      {/* 顶部导航 */}
      <div className="shopping-header">
        <button className="back-btn" onClick={onBack}>‹</button>
        <h1>智能购物</h1>
        <button 
          className="cart-btn"
          onClick={() => setShowCart(true)}
        >
          🛒 {cart.totalItems > 0 && <span className="cart-badge">{cart.totalItems}</span>}
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="shopping-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索商品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? '全部分类' : category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'default' | 'price' | 'rating' | 'newest')}
          >
            <option value="default">默认排序</option>
            <option value="price">价格排序</option>
            <option value="rating">评分排序</option>
            <option value="newest">最新排序</option>
          </select>
        </div>
      </div>

      {/* 重新生成按钮 */}
      <div className="regenerate-section">
        <button 
          className="regenerate-btn"
          onClick={generateProducts}
          disabled={isGenerating}
        >
          {isGenerating ? '正在生成...' : '🔄 重新生成商品'}
        </button>
        <p className="regenerate-hint">
          基于您的聊天内容，AI会为您推荐相关商品
        </p>
      </div>

      {/* 商品列表 */}
      <div className="products-container">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>正在分析您的聊天内容并生成商品...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">📦</div>
            <p>没有找到相关商品</p>
            <p>尝试调整搜索条件或重新生成商品</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onViewDetail={() => {}}
                isInCart={isProductInCart(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 购物车模态框 */}
      <ShoppingCartComponent
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        products={products}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
} 