'use client';

import React, { useState } from 'react';
import { Product } from '../../types/shopping';
import type { ShoppingCart } from '../../types/shopping';
import './ShoppingCart.css';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ShoppingCart;
  products: Product[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  cart,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: ShoppingCartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // 获取购物车中的商品详情
  const getCartItemsWithDetails = () => {
    return cart.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product || null
      };
    }).filter(item => item.product !== null);
  };

  const cartItemsWithDetails = getCartItemsWithDetails();

  // 计算总价
  const calculateTotal = () => {
    return cartItemsWithDetails.reduce((total, item) => {
      if (item.product) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const total = calculateTotal();

  // 处理数量变化
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(productId);
    } else {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  // 处理结账
  const handleCheckout = async () => {
    if (cartItemsWithDetails.length === 0) {
      alert('购物车为空，无法结账');
      return;
    }

    setIsCheckingOut(true);
    
    // 模拟结账过程
    setTimeout(() => {
      setIsCheckingOut(false);
      onCheckout();
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="shopping-cart-overlay" onClick={onClose}>
      <div className="shopping-cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>购物车</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="cart-content">
          {cartItemsWithDetails.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <p>购物车是空的</p>
              <p>快去添加一些商品吧！</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItemsWithDetails.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="item-image">
                      <span className="product-emoji">{item.product?.image}</span>
                    </div>
                    
                    <div className="item-info">
                      <h4 className="item-name">{item.product?.name}</h4>
                      <p className="item-price">¥{item.product?.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="item-quantity">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= (item.product?.stock || 0)}
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="item-total">
                      ¥{(item.product?.price || 0) * item.quantity}
                    </div>
                    
                    <button 
                      className="remove-btn"
                      onClick={() => onRemoveItem(item.productId)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>商品总数：</span>
                  <span>{cart.totalItems} 件</span>
                </div>
                <div className="summary-row">
                  <span>商品总价：</span>
                  <span>¥{total.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>应付总额：</span>
                  <span>¥{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cartItemsWithDetails.length === 0}
                >
                  {isCheckingOut ? '处理中...' : '立即结账'}
                </button>
                
                <button 
                  className="continue-shopping-btn"
                  onClick={onClose}
                >
                  继续购物
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 