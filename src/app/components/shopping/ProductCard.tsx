'use client';

import React from 'react';
import { Product } from '../../types/shopping';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetail: (product: Product) => void;
  isInCart?: boolean;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  isInCart = false 
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };



  return (
    <div className="product-card">
      {/* 商品信息 */}
      <div className="product-info">
        <h3 className="product-name">
          名称：{product.name}
        </h3>
        
        <div className="product-price">
          价格：{formatPrice(product.price)}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="original-price">
              （原价：{formatPrice(product.originalPrice)}）
            </span>
          )}
        </div>
        
        <div className="product-description">
          详细介绍：{product.description}
        </div>

        {/* 促销信息 */}
        {product.isOnSale && product.discountPercentage && (
          <div className="sale-info">
            促销：-{product.discountPercentage}%
          </div>
        )}

        {/* 库存信息 */}
        <div className="stock-info">
          库存：{product.stock}件
        </div>

        {/* 评分信息 */}
        <div className="rating-info">
          评分：{product.rating.toFixed(1)}分（{product.reviewCount}条评论）
        </div>

        {/* 分类信息 */}
        <div className="category-info">
          分类：{product.category}
        </div>

        {/* 标签信息 */}
        {product.tags.length > 0 && (
          <div className="tags-info">
            标签：{product.tags.join('、')}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="product-actions">
        <button 
          className={`add-to-cart-btn ${isInCart ? 'in-cart' : ''}`}
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          {isInCart ? '已在购物车' : product.stock === 0 ? '缺货' : '加入购物车'}
        </button>
      </div>
    </div>
  );
} 