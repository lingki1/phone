'use client';

import { ChatStatus } from './ChatStatusManager';

export interface ChatStatusPromptProps {
  chatId?: string;
  currentStatus: ChatStatus;
  onStatusUpdate: (status: ChatStatus) => void;
}

export default function ChatStatusPrompt({ currentStatus, onStatusUpdate }: ChatStatusPromptProps) {
  // 生成状态更新提示词
  const generateStatusPrompt = (): string => {
    return `# 状态更新指令

你现在需要更新你的状态信息。请根据当前时间、对话内容和你的角色设定，生成一个JSON格式的状态更新。

## 状态字段说明：
- **mood**: 你的当前心情（如：心情愉快、有点疲惫、兴奋、平静等）
- **location**: 你当前所在的位置（如：在家中、在咖啡厅、在办公室、在公园等）
- **outfit**: 你今天的穿着（如：穿着蓝色连衣裙、穿着休闲装、穿着正装等）

## 输出格式：
{
  "type": "status_update",
  "mood": "心情描述",
  "location": "位置描述", 
  "outfit": "穿着描述"
}

## 注意事项：
1. 状态应该符合你的角色设定和当前对话情境
2. 位置和穿着要合理，符合当前时间
3. 心情要反映你与用户的互动状态
4. 保持自然和真实感

请生成你的状态更新：`;
  };

  // 解析AI返回的状态更新
  const parseStatusUpdate = (aiResponse: string): Partial<ChatStatus> | null => {
    try {
      // 尝试解析JSON
      const parsed = JSON.parse(aiResponse);
      
      if (parsed.type === 'status_update') {
        return {
          mood: parsed.mood || currentStatus.mood,
          location: parsed.location || currentStatus.location,
          outfit: parsed.outfit || currentStatus.outfit,
          isOnline: true,
          lastUpdate: Date.now()
        };
      }
    } catch (error) {
      console.error('Failed to parse status update:', error);
    }
    
    return null;
  };

  // 触发状态更新（暂时未使用，保留以备将来扩展）
  // const triggerStatusUpdate = async (apiConfig: ApiConfig, chat: ChatItem) => {
  //   try {
  //     const statusPrompt = generateStatusPrompt();
  //     
  //     const response = await fetch(`${apiConfig.proxyUrl}/v1/chat/completions`, {
  //       method: 'POST',
  //       headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${apiConfig.apiKey}`
  //     },
  //     body: JSON.stringify({
  //       model: apiConfig.model,
  //       messages: [
  //       { role: 'system', content: statusPrompt },
  //       { role: 'user', content: '请更新你的状态信息' }
  //     ],
  //     temperature: 0.7,
  //     max_tokens: 200
  //   })
  // });

  //   if (!response.ok) {
  //     throw new Error(`API请求失败: ${response.status}`);
  //   }

  //   const data = await response.json();
  //   const aiResponse = data.choices[0].message.content;
  //   
  //   const statusUpdate = parseStatusUpdate(aiResponse);
  //   if (statusUpdate) {
  //     onStatusUpdate(statusUpdate as ChatStatus);
  //   }
  // } catch (error) {
  //   console.error('Status update failed:', error);
  // }
  // };

  return null; // 这是一个纯逻辑组件，不渲染UI
}

// 导出工具函数
export const injectStatusPrompt = (basePrompt: string, currentStatus: ChatStatus): string => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isMorning = currentHour >= 6 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 18;
  const isEvening = currentHour >= 18 && currentHour < 22;
  const isNight = currentHour >= 22 || currentHour < 6;

  // 根据时间动态生成状态建议
  const getTimeBasedSuggestions = () => {
    let moodSuggestions = '';
    let locationSuggestions = '';
    let outfitSuggestions = '';

    if (isMorning) {
      moodSuggestions = '心情愉快、充满活力、有点困倦、精神饱满';
      locationSuggestions = '在家中、在卧室、在厨房、在阳台、在办公室、在咖啡厅';
      outfitSuggestions = '穿着睡衣、穿着休闲装、穿着正装、穿着运动装';
    } else if (isAfternoon) {
      moodSuggestions = '心情愉快、有点疲惫、兴奋、平静、专注';
      locationSuggestions = '在办公室、在咖啡厅、在餐厅、在公园、在家中、在商场';
      outfitSuggestions = '穿着正装、穿着休闲装、穿着运动装、穿着商务装';
    } else if (isEvening) {
      moodSuggestions = '心情放松、有点疲惫、愉快、平静、期待';
      locationSuggestions = '在家中、在餐厅、在健身房、在电影院、在朋友家、在酒吧';
      outfitSuggestions = '穿着休闲装、穿着运动装、穿着晚装、穿着家居服';
    } else {
      moodSuggestions = '心情平静、有点困倦、放松、安静';
      locationSuggestions = '在家中、在卧室、在客厅、在书房';
      outfitSuggestions = '穿着睡衣、穿着家居服、穿着休闲装';
    }

    return { moodSuggestions, locationSuggestions, outfitSuggestions };
  };

  const { moodSuggestions, locationSuggestions, outfitSuggestions } = getTimeBasedSuggestions();

  const statusInfo = `
# 实时状态系统

## 当前状态信息
- 心情：${currentStatus.mood}
- 位置：${currentStatus.location}
- 穿着：${currentStatus.outfit}
- 最后更新：${new Date(currentStatus.lastUpdate).toLocaleString('zh-CN')}

## 状态更新规则
1. **实时性要求**：每次对话都应该根据当前时间、对话内容和情境实时更新状态
2. **自然性要求**：状态更新应该自然融入对话，不要刻意提及
3. **合理性要求**：状态应该符合当前时间、地点和情境的合理性

## 时间感知状态建议
当前时间：${now.toLocaleString('zh-CN')}
- 心情建议：${moodSuggestions}
- 位置建议：${locationSuggestions}
- 穿着建议：${outfitSuggestions}

## 状态更新触发场景
1. **时间变化**：早晨醒来、午休后、下班回家、睡前等
2. **活动变化**：开始工作、去咖啡厅、运动、吃饭、休息等
3. **情绪变化**：收到好消息、遇到困难、完成任务、感到疲惫等
4. **环境变化**：换衣服、换位置、天气变化等

## 状态更新格式
当需要更新状态时，使用以下JSON格式（可以单独发送，也可以与其他消息一起发送）：
{"type": "status_update", "mood": "新心情", "location": "新位置", "outfit": "新穿着"}

## 状态更新示例
- 早晨醒来：{"type": "status_update", "mood": "精神饱满", "location": "在卧室", "outfit": "穿着睡衣"}
- 准备上班：{"type": "status_update", "mood": "专注", "location": "在家中", "outfit": "穿着正装"}
- 午休时间：{"type": "status_update", "mood": "放松", "location": "在办公室", "outfit": "穿着正装"}
- 下班回家：{"type": "status_update", "mood": "愉快", "location": "在家中", "outfit": "穿着休闲装"}
- 准备睡觉：{"type": "status_update", "mood": "平静", "location": "在卧室", "outfit": "穿着睡衣"}

## 重要提醒
- 状态更新应该反映真实的日常生活节奏
- 每次状态变化都应该有合理的理由
- 状态信息会持久化保存，确保连续性
- 在对话中自然地提及状态变化，增强真实感
`;

  return basePrompt + '\n\n' + statusInfo;
}; 