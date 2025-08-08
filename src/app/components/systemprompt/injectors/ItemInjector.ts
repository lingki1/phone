import { PromptInjector, PromptContext, ItemInfo } from '../types';
import { dataManager } from '../../../utils/dataManager';

export class ItemInjector implements PromptInjector {
  priority = 15; // 物品注入优先级较低，在世界书之后

  async inject(context: PromptContext): Promise<string> {
    const { chat } = context;

    console.log('ItemInjector: 开始注入物品信息', {
      chatId: chat.id,
      chatName: chat.name
    });

    try {
      // 获取该聊天的所有交易记录
      const transactions = await dataManager.getTransactionsByChatId(chat.id);
      
      // 筛选出礼物购买记录
      const giftTransactions = transactions.filter(tx => 
        tx.message && 
        typeof tx.message === 'string' && 
        tx.message.includes('gift_purchase')
      );

      if (giftTransactions.length === 0) {
        console.log('ItemInjector: 没有收到过礼物');
        return '';
      }

      // 解析物品信息
      const items: ItemInfo[] = [];
      for (const tx of giftTransactions) {
        try {
          const parsed = JSON.parse(tx.message || '{}');
          if (parsed.kind === 'gift_purchase' && parsed.items) {
            for (const item of parsed.items) {
              items.push({
                id: item.productId,
                name: item.name,
                description: `来自${tx.fromUser}的礼物`,
                quantity: item.quantity,
                receivedAt: tx.timestamp,
                fromUser: tx.fromUser,
                shippingMethod: parsed.shippingMethod || 'instant'
              });
            }
          }
        } catch (e) {
          console.warn('ItemInjector: 解析交易记录失败:', e);
        }
      }

      if (items.length === 0) {
        console.log('ItemInjector: 没有有效的物品信息');
        return '';
      }

      // 按接收时间排序，最新的在前
      items.sort((a, b) => b.receivedAt - a.receivedAt);

      // 去重并合并相同物品的数量
      const itemMap = new Map<string, ItemInfo>();
      for (const item of items) {
        const key = item.id;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.quantity += item.quantity;
          // 更新为最新的接收时间
          if (item.receivedAt > existing.receivedAt) {
            existing.receivedAt = item.receivedAt;
            existing.fromUser = item.fromUser;
            existing.shippingMethod = item.shippingMethod;
          }
        } else {
          itemMap.set(key, { ...item });
        }
      }

      const uniqueItems = Array.from(itemMap.values());

      // 格式化物品列表
      const itemList = uniqueItems
        .map(item => {
          const date = new Date(item.receivedAt).toLocaleDateString('zh-CN');
          const shippingText = item.shippingMethod === 'instant' ? '极速立刻' : 
                              item.shippingMethod === 'fast' ? '快速1分钟' : '慢速10分钟';
          return `- ${item.name} × ${item.quantity}（来自${item.fromUser}，${date}送达，${shippingText}）`;
        })
        .join('\n');

      console.log(`ItemInjector: 成功注入 ${uniqueItems.length} 种物品`, {
        items: uniqueItems.map(item => ({ name: item.name, quantity: item.quantity }))
      });

      const injectedContent = `\n\n# 拥有的物品\n${itemList}\n\n注意：这些是你拥有的物品，在对话中可以提及、使用或展示这些物品。`;
      console.log('ItemInjector: 注入内容长度:', injectedContent.length);

      return injectedContent;
    } catch (error) {
      console.error('ItemInjector: 注入物品信息时发生错误:', error);
      return ''; // 出错时返回空字符串，不影响其他注入器
    }
  }
}
