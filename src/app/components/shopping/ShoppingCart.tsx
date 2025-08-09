'use client';

import React, { useState } from 'react';
import { ShoppingCart as ShoppingCartType, Product } from '../../types/shopping';
import { ChatItem, Message, GroupMember } from '../../types/chat';
import { dataManager } from '../../utils/dataManager';
import { getPromptManager } from '../systemprompt';
import './ShoppingCart.css';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ShoppingCartType;
  products: Product[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

// 解析AI回复（支持多条消息）
const parseAiResponse = (content: string) => {
  const trimmedContent = content.trim();

  // 方案1：【最优先】尝试作为标准的、单一的JSON数组解析
  if (trimmedContent.startsWith('[') && trimmedContent.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmedContent);
      if (Array.isArray(parsed)) {
        console.log("解析成功：标准JSON数组格式。");
        return parsed;
      }
    } catch {
      console.warn("标准JSON数组解析失败，将尝试强力解析...");
    }
  }

  // 方案2：【强力解析】使用正则表达式，从混乱的字符串中提取出所有独立的JSON对象
  const jsonMatches = trimmedContent.match(/{[^{}]*}/g);

  if (jsonMatches) {
    const results = [];
    for (const match of jsonMatches) {
      try {
        const parsedObject = JSON.parse(match);
        results.push(parsedObject);
      } catch {
        console.warn("跳过一个无效的JSON片段:", match);
      }
    }

    if (results.length > 0) {
      console.log("解析成功：通过强力提取模式。");
      return results;
    }
  }
  
  // 方案3：【最终备用】如果以上所有方法都失败了，说明AI返回的可能就是纯文本
  console.error("所有解析方案均失败！将返回原始文本。");
  return [{ type: 'text', content: content }];
};

// 创建AI消息对象
const createAiMessage = async (msgData: Record<string, unknown>, chat: ChatItem, timestamp: number): Promise<Message | null> => {
  // 根据消息类型处理内容
  let content = '';
  let type: Message['type'] = 'text';
  let meaning: string | undefined;
  let url: string | undefined;

  switch (msgData.type) {
    case 'text':
      // 确保content字段是纯文本，不是JSON代码
      const textContent = msgData.content || msgData.message || '';
      content = String(textContent);
      // 如果content看起来像JSON，尝试提取纯文本
      if (content.startsWith('{') || content.startsWith('[')) {
        try {
          const parsed = JSON.parse(content);
          if (typeof parsed === 'object') {
            // 如果是对象，尝试提取message或content字段
            content = String(parsed.message || parsed.content || textContent);
          }
        } catch {
          // 如果解析失败，保持原内容
          content = String(textContent);
        }
      }
      type = 'text';
      break;
    case 'sticker':
      content = String(msgData.meaning || '表情');
      type = 'sticker';
      meaning = msgData.meaning ? String(msgData.meaning) : undefined;
      url = undefined;
      break;
    case 'ai_image':
      content = String(msgData.description || '图片');
      type = 'ai_image';
      break;
    case 'voice_message':
      content = String(msgData.content || '语音消息');
      type = 'voice_message';
      break;
    case 'pat_user':
      content = `拍一拍${msgData.suffix ? String(msgData.suffix) : ''}`;
      type = 'text';
      break;
    default:
      // 默认情况下也处理可能的JSON内容
      const defaultContent = msgData.content || msgData.message || '';
      content = String(defaultContent);
      if (content.startsWith('{') || content.startsWith('[')) {
        try {
          const parsed = JSON.parse(content);
          if (typeof parsed === 'object') {
            content = String(parsed.message || parsed.content || defaultContent);
          }
        } catch {
          content = String(defaultContent);
        }
      }
      type = 'text';
  }

  const aiMessage: Message = {
    id: timestamp.toString(),
    role: 'assistant',
    content,
    timestamp,
    senderName: String(msgData.name || chat.name),
    senderAvatarId: undefined, // 购物消息暂不使用头像
    type,
    meaning,
    url,
    isRead: false // AI消息默认为未读
  };

  return aiMessage;
};

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
  const [recipientOptions, setRecipientOptions] = useState<{
    id: string;
    name: string;
    avatar: string;
    chatId: string;
  }[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<'instant' | 'fast' | 'slow'>('instant');
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // 加载可选AI受赠人列表
  React.useEffect(() => {
    const loadRecipients = async () => {
      try {
        setIsLoadingRecipients(true);
        await dataManager.initDB();
        const chats: ChatItem[] = await dataManager.getAllChats();
        const options: { id: string; name: string; avatar: string; chatId: string }[] = [];

        chats.forEach((chat) => {
          if (chat.isGroup && chat.members && chat.members.length > 0) {
            chat.members.forEach((member: GroupMember) => {
              options.push({
                id: `member_${member.id}`,
                name: member.groupNickname || member.originalName,
                avatar: member.avatar,
                chatId: member.singleChatId || chat.id,
              });
            });
          } else {
            // 单聊作为一个可选的AI角色
            options.push({
              id: `chat_${chat.id}`,
              name: chat.name,
              avatar: chat.avatar,
              chatId: chat.id,
            });
          }
        });

        // 去重（按id）
        const unique = new Map<string, { id: string; name: string; avatar: string; chatId: string }>();
        options.forEach((opt) => {
          if (!unique.has(opt.id)) unique.set(opt.id, opt);
        });
        const list = Array.from(unique.values());
        setRecipientOptions(list);
        if (list.length > 0) setSelectedRecipientId(list[0].id);
      } catch (e) {
        console.warn('加载受赠人失败:', e);
        setRecipientOptions([]);
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    if (isOpen) {
      loadRecipients();
    }
  }, [isOpen]);

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

    if (!selectedRecipientId) {
      alert('请选择受赠的AI角色');
      return;
    }

    setIsCheckingOut(true);

    try {
      // 初始化数据库并获取当前余额
      await dataManager.initDB();
      const currentBalance = await dataManager.getBalance();

      if (currentBalance < total) {
        setIsCheckingOut(false);
        alert(`余额不足，当前余额：¥${currentBalance.toFixed(2)}，应付：¥${total.toFixed(2)}`);
        return;
      }

      const newBalance = parseFloat((currentBalance - total).toFixed(2));
      await dataManager.saveBalance(newBalance);

      // 记录交易（用于后续在聊天页让AI签收/接收商品）
      try {
        const me = await dataManager.getPersonalSettings();
        const recipient = recipientOptions.find(r => r.id === selectedRecipientId);
        const orderId = `order_${Date.now()}`;
        const items = cartItemsWithDetails.map(ci => ({
          productId: ci.productId,
          name: ci.product?.name || '',
          quantity: ci.quantity,
          unitPrice: ci.product?.price || 0,
        }));

        await dataManager.addTransaction({
          id: orderId,
          type: 'send',
          amount: total,
          chatId: recipient?.chatId || '',
          fromUser: me.userNickname || '我',
          toUser: recipient?.name || 'AI',
          message: JSON.stringify({ kind: 'gift_purchase', shippingMethod, items }),
          timestamp: Date.now(),
          status: 'pending',
        });
      } catch (e) {
        console.warn('记录交易失败（不影响扣款）:', e);
      }

      setIsCheckingOut(false);
      const shippingText = shippingMethod === 'instant' ? '极速立刻' : shippingMethod === 'fast' ? '快速1分钟' : '慢速10分钟';
      alert(`支付成功！已扣款 ¥${total.toFixed(2)}，快递方式：${shippingText}，剩余余额：¥${newBalance.toFixed(2)}`);

      // 即刻通知AI角色（后台发送隐藏消息，让AI在聊天页面回复）
      console.log('🎁 开始后台AI通知流程...');
      setTimeout(async () => {
        try {
          console.log('🎁 setTimeout执行，开始处理AI通知');
          const recipient = recipientOptions.find(r => r.id === selectedRecipientId);
          console.log('🎁 找到受赠者:', recipient);
          
          if (recipient?.chatId) {
            console.log('🎁 受赠者有chatId:', recipient.chatId);
            const chat = await dataManager.getChat(recipient.chatId);
            console.log('🎁 获取到聊天记录:', chat ? '成功' : '失败');
            
            const me = await dataManager.getPersonalSettings();
            console.log('🎁 获取个人信息:', me ? '成功' : '失败');
            
            const giftDesc = cartItemsWithDetails.map(ci => `${ci.product?.name}×${ci.quantity}`).join('、');
            console.log('🎁 礼物描述:', giftDesc);

            if (chat) {
              // 直接调用AI API，就像ChatInterface中的triggerAiResponse一样
              const effectiveApiConfig = {
                proxyUrl: chat.settings.proxyUrl || '',
                apiKey: chat.settings.apiKey || '',
                model: chat.settings.model || ''
              };
              
              console.log('🎁 API配置检查:', {
                proxyUrl: effectiveApiConfig.proxyUrl ? '已设置' : '未设置',
                apiKey: effectiveApiConfig.apiKey ? '已设置' : '未设置',
                model: effectiveApiConfig.model ? '已设置' : '未设置'
              });

              // 如果聊天设置中没有API配置，尝试从全局配置获取
              if (!effectiveApiConfig.proxyUrl || !effectiveApiConfig.apiKey || !effectiveApiConfig.model) {
                console.log('🎁 聊天设置中API配置不完整，尝试获取全局API配置...');
                try {
                  const globalApiConfig = await dataManager.getApiConfig();
                  effectiveApiConfig.proxyUrl = effectiveApiConfig.proxyUrl || globalApiConfig.proxyUrl;
                  effectiveApiConfig.apiKey = effectiveApiConfig.apiKey || globalApiConfig.apiKey;
                  effectiveApiConfig.model = effectiveApiConfig.model || globalApiConfig.model;
                  
                  console.log('🎁 全局API配置检查:', {
                    proxyUrl: effectiveApiConfig.proxyUrl ? '已设置' : '未设置',
                    apiKey: effectiveApiConfig.apiKey ? '已设置' : '未设置',
                    model: effectiveApiConfig.model ? '已设置' : '未设置'
                  });
                } catch (e) {
                  console.warn('🎁 获取全局API配置失败:', e);
                }
              }

              if (effectiveApiConfig.proxyUrl && effectiveApiConfig.apiKey && effectiveApiConfig.model) {
                console.log('🎁 API配置完整，开始调用AI');
                
                // 构建提示词上下文
                const promptContext = {
                  chat: chat,
                  currentTime: new Date().toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' }),
                  myNickname: me.userNickname || chat.settings.myNickname || '我',
                  myPersona: me.userBio || chat.settings.myPersona || '用户',
                  allChats: [],
                  availableContacts: [],
                  chatStatus: undefined,
                  currentPreset: undefined,
                  dbPersonalSettings: me,
                  personalSettings: me
                };

                // 使用提示词注入系统
                const promptManager = getPromptManager();
                const result = await promptManager.buildPrompt(promptContext);
                console.log('🎁 提示词构建完成，长度:', result.systemPrompt.length);

                // 调用AI API，发送隐藏的礼物通知消息
                console.log('🎁 开始调用AI API...');
                const response = await fetch(`${effectiveApiConfig.proxyUrl}/v1/chat/completions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${effectiveApiConfig.apiKey}`
                  },
                  body: JSON.stringify({
                    model: effectiveApiConfig.model,
                    messages: [
                      { role: 'system', content: result.systemPrompt },
                      ...result.messagesPayload,
                      { role: 'user', content: `${me.userNickname} 赠送了你礼物：${giftDesc}。请用一句暖心话表达感谢并@对方。` }
                    ],
                    ...result.apiParams
                  })
                });

                const data = await response.json();
                console.log('🎁 AI API响应:', {
                  status: response.status,
                  hasError: !!data.error,
                  hasChoices: !!data.choices,
                  messageContent: data.choices?.[0]?.message?.content
                });
                
                if (data.error) {
                  console.warn('🎁 AI API错误:', data.error);
                  return;
                }
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                  console.warn('🎁 AI API响应格式错误:', data);
                  return;
                }
                
                const aiResponseContent = data.choices[0].message.content;
                console.log('🎁 AI回复内容:', aiResponseContent);
                
                // 解析AI回复（支持多条消息）
                const messagesArray = parseAiResponse(aiResponseContent);
                console.log('🎁 解析后的消息数组:', messagesArray);
                
                // 处理每条AI消息，实现一条一条显示
                let messageTimestamp = Date.now();
                let currentChat = chat;
                
                for (const msgData of messagesArray) {
                  if (!msgData || typeof msgData !== 'object') {
                    console.warn("收到了格式不规范的AI指令，已跳过:", msgData);
                    continue;
                  }
                  
                  if (!msgData.type) {
                    console.warn("收到了格式不规范的AI指令（缺少type），已跳过:", msgData);
                    continue;
                  }

                  // 创建AI消息对象
                  const aiMessage = await createAiMessage(msgData, currentChat, messageTimestamp++);
                  if (aiMessage) {
                    // 更新聊天记录
                    currentChat = {
                      ...currentChat,
                      messages: [...currentChat.messages, aiMessage],
                      lastMessage: aiMessage.content,
                      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                    };
                    
                    // 立即保存到数据库
                    await dataManager.saveChat(currentChat);
                    console.log('🎁 AI消息已保存:', aiMessage.content.substring(0, 50) + '...');
                    
                    // 触发聊天消息通知（仅对AI消息）
                    if (aiMessage.role === 'assistant') {
                      window.dispatchEvent(new CustomEvent('chatMessageGenerated', {
                        detail: {
                          characterName: aiMessage.senderName || chat.name,
                          chatId: chat.id,
                          messageContent: aiMessage.content
                        }
                      }));
                    }
                    
                    // 添加延迟，模拟人类打字效果（除了最后一条消息）
                    if (messagesArray.indexOf(msgData) < messagesArray.length - 1) {
                      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 500));
                    }
                  }
                }
                
                console.log('🎁 所有AI消息处理完成');
              } else {
                console.warn('🎁 API配置不完整，跳过AI通知');
              }
            } else {
              console.warn('🎁 未找到聊天记录');
            }
          } else {
            console.warn('🎁 受赠者没有chatId');
          }
        } catch (e) {
          console.error('🎁 赠礼后台通知AI失败:', e);
        }
      }, 1000); // 延迟1秒执行，让用户先看到结账成功

      onCheckout();
      onClose();
    } catch (error) {
      console.error('结账失败:', error);
      setIsCheckingOut(false);
      alert('结账失败，请稍后重试');
    }
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
              {/* 受赠AI与快递方式 */}
              <div className="checkout-options" style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, marginRight: 8 }}>受赠AI角色：</label>
                  <select
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    disabled={isLoadingRecipients}
                    style={{ padding: '6px 10px' }}
                  >
                    {recipientOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontWeight: 600, marginRight: 8 }}>快递方式：</label>
                  <select
                    value={shippingMethod}
                    onChange={(e) => setShippingMethod(e.target.value as 'instant' | 'fast' | 'slow')}
                    style={{ padding: '6px 10px' }}
                  >
                    <option value="instant">极速立刻</option>
                    <option value="fast">快速1分钟</option>
                    <option value="slow">慢速10分钟</option>
                  </select>
                </div>
              </div>
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