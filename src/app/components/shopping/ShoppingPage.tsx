'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, ShoppingCart, CartItem } from '../../types/shopping';
import { ProductGenerator } from './ProductGenerator';
import ProductCard from './ProductCard';
import ShoppingCartComponent from '@shopping/ShoppingCart';
import { useTheme } from '../../hooks/useTheme';
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
  const { currentTheme, currentThemeObject } = useTheme(); // 移除未使用的变量
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiGeneratedCount, setAiGeneratedCount] = useState(0);
  // 移除未使用的presetCount变量

  const productGenerator = useMemo(() => new ProductGenerator(apiConfig), [apiConfig]);

  // 应用主题到页面
  useEffect(() => {
    if (currentThemeObject) {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }, [currentTheme, currentThemeObject]);

  // 初始化：加载预设商品
  useEffect(() => {
    const initProducts = async () => {
      setIsLoading(true);
      try {
        // 加载预设商品
        const presetProducts = await productGenerator.getPresetProducts();
        setProducts(presetProducts);
        setAiGeneratedCount(0);
      } catch (error) {
        console.error('加载预设商品失败:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    initProducts();
  }, [productGenerator]);

  // 搜索处理函数
  const handleSearch = async (searchValue: string) => {
    setSearchTerm(searchValue);
    
    if (!searchValue.trim()) {
      // 如果搜索词为空，只显示预设商品
      const presetProducts = await productGenerator.getPresetProducts();
      setProducts(presetProducts);
      setAiGeneratedCount(0);
      return;
    }

    // 如果搜索词不为空，保留现有的AI生成商品，只过滤预设商品
    const presetProducts = await productGenerator.getPresetProducts();
    const matchingPreset = presetProducts.filter(product =>
      product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchValue.toLowerCase()))
    );

    // 获取当前的AI生成商品
    const currentAiProducts = productGenerator.getAiGeneratedProducts();
    
    console.log('🔍 搜索处理 - 保留AI商品:', {
      searchValue,
      matchingPresetCount: matchingPreset.length,
      currentAiProductsCount: currentAiProducts.length,
      totalProducts: matchingPreset.length + currentAiProducts.length
    });
    
    // 合并预设商品和AI生成商品，但不清除AI生成商品
    setProducts([...matchingPreset, ...currentAiProducts]);
    // 不清除AI生成商品计数，保持现有状态
  };

  // 执行AI搜索生成
  const executeAiSearch = async () => {
    if (!searchTerm.trim()) {
      alert('请先输入搜索词');
      return;
    }

    // 添加API配置调试信息
    console.log('🔍 购物搜索 - API配置检查:', {
      proxyUrl: apiConfig.proxyUrl,
      apiKey: apiConfig.apiKey ? '已设置' : '未设置',
      model: apiConfig.model,
      hasAllConfig: !!(apiConfig.proxyUrl && apiConfig.apiKey && apiConfig.model)
    });

    // 检查API配置是否完整
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
      alert('API配置不完整，请先在设置中配置代理地址、API密钥和模型名称。');
      return;
    }

    setIsGenerating(true);
    try {
      // 清除之前的AI生成商品
      productGenerator.clearAiGeneratedProducts();
      
      // 执行AI生成
      const aiProducts = await productGenerator.generateProductsForSearch(searchTerm, 8);
      
      console.log('🔍 AI生成结果:', {
        aiProductsLength: aiProducts.length,
        aiProducts: aiProducts.map(p => ({ id: p.id, name: p.name }))
      });
      
      // 获取预设商品中匹配的结果
      const presetProducts = await productGenerator.getPresetProducts();
      const matchingPreset = presetProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      console.log('🔍 预设商品匹配结果:', {
        matchingPresetLength: matchingPreset.length,
        matchingPreset: matchingPreset.map(p => ({ id: p.id, name: p.name }))
      });
      
      // 合并预设商品和AI生成商品
      const allProducts = [...matchingPreset, ...aiProducts];
      console.log('🔍 最终商品列表:', {
        totalProducts: allProducts.length,
        allProducts: allProducts.map(p => ({ id: p.id, name: p.name, generatedFrom: p.generatedFrom }))
      });
      
      setProducts(allProducts);
      setAiGeneratedCount(aiProducts.length);
      
      // 如果AI生成了商品，显示成功提示
      if (aiProducts.length > 0) {
        console.log('✅ AI成功生成商品:', aiProducts.length, '个');
      } else {
        console.warn('⚠️ AI没有生成任何商品');
        alert('AI生成商品失败，请重试');
      }
    } catch (error) {
      console.error('AI搜索生成失败:', error);
      alert('AI搜索生成失败，请检查网络连接或稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 清除AI生成商品
  const clearAiGeneratedProducts = async () => {
    productGenerator.clearAiGeneratedProducts();
    const presetProducts = await productGenerator.getPresetProducts();
    setProducts(presetProducts);
    setAiGeneratedCount(0);
  };

  // 重新生成AI商品
  const regenerateAiProducts = async () => {
    if (!searchTerm.trim()) {
      alert('请先输入搜索词');
      return;
    }

    // 检查API配置是否完整
    if (!apiConfig.proxyUrl || !apiConfig.apiKey || !apiConfig.model) {
      alert('API配置不完整，请先在设置中配置代理地址、API密钥和模型名称。');
      return;
    }

    setIsGenerating(true);
    try {
      // 清除之前的AI生成商品
      productGenerator.clearAiGeneratedProducts();
      
      // 重新生成
      const aiProducts = await productGenerator.generateProductsForSearch(searchTerm, 8);
      const presetProducts = await productGenerator.getPresetProducts();
      const matchingPreset = presetProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setProducts([...matchingPreset, ...aiProducts]);
      setAiGeneratedCount(aiProducts.length);
    } catch (error) {
      console.error('重新生成AI商品失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 分类标签切换
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // 获取所有可用分类
  const getAllCategories = () => {
    const categories = new Set<string>();
    products.forEach(product => {
      categories.add(product.category);
    });
    return Array.from(categories).sort();
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

  // 结账（仅余额扣款在购物车组件中处理，这里仅清空购物车）
  const handleCheckout = () => {
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      lastUpdated: Date.now()
    });
  };

  // 过滤商品
  const getFilteredProducts = () => {
    let filtered = products;

    console.log('🔍 getFilteredProducts - 初始商品:', {
      totalProducts: products.length,
      searchTerm,
      selectedCategories,
      products: products.map(p => ({ id: p.id, name: p.name, category: p.category, generatedFrom: p.generatedFrom }))
    });

    // 按分类过滤
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => selectedCategories.includes(product.category));
      console.log('🔍 分类过滤后:', filtered.length, '个商品');
    }

    // 按搜索词过滤（只有在非AI搜索模式下才过滤）
    if (searchTerm && aiGeneratedCount === 0) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      console.log('🔍 搜索词过滤后:', filtered.length, '个商品');
    }

    console.log('🔍 最终过滤结果:', {
      filteredCount: filtered.length,
      filteredProducts: filtered.map(p => ({ id: p.id, name: p.name, generatedFrom: p.generatedFrom }))
    });

    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const allCategories = getAllCategories();

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

      {/* 搜索 */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="输入关键词搜索商品..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                executeAiSearch();
              }
            }}
          />
          <button 
            className="search-btn"
            onClick={executeAiSearch}
            disabled={isGenerating || !searchTerm.trim()}
          >
            {isGenerating ? '🔄 生成中...' : '🔍 搜索'}
          </button>
        </div>
        {aiGeneratedCount > 0 && (
          <div className="ai-status">
            <span>AI生成: {aiGeneratedCount} 个商品</span>
            <button 
              className="clear-ai-btn"
              onClick={clearAiGeneratedProducts}
            >
              🗑️ 清除AI商品
            </button>
            <button 
              className="regenerate-btn"
              onClick={regenerateAiProducts}
              disabled={isGenerating}
            >
              🔄 重新生成
            </button>
          </div>
        )}
      </div>

      {/* 分类标签筛选 */}
      <div className="category-tags">
        {allCategories.map(category => (
          <button
            key={category}
            className={`category-tag ${selectedCategories.includes(category) ? 'active' : ''}`}
            onClick={() => toggleCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 商品列表 */}
      <div className="products-container">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>正在加载预设商品...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">📦</div>
            <p>没有找到相关商品</p>
            <p>尝试调整搜索条件或输入新的关键词</p>
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