'use client';

import React, { useState, useRef, useEffect } from 'react';
import './UnicodeEmojiPicker.css';

interface UnicodeEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

// Unicode表情分类
const emojiCategories = [
  {
    name: '最近',
    icon: '🕒',
    emojis: [  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',]
  },
  {
    name: '表情',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
      '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
      '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀',
      '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
      '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦',
      '👩', '🧑', '👨', '👵', '🧓', '👴', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️',
      '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸',
      '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕', '🤵‍♀️', '🤵', '🤵‍♂️', '👰‍♀️', '👰',
      '👰‍♂️', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️',
      '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞',
      '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️'
    ]
  },
  {
    name: '手势',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
      '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋',
      '🩸'
    ]
  },
  {
    name: '动物',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
      '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕',
      '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳',
      '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛',
      '🦏', '🐪', '🐫', '🦙', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖',
      '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈',
      '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝',
      '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐉',
      '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️',
      '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄',  '🌾',
      '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌸', '🪷'
    ]
  },
  {
    name: '食物',
    icon: '🍎',
    emojis: [
      '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬',
      '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞',
      '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕',
      '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫',
      '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙',
      '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦',
      '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪',
      '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤',
       '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧉', '🍾',
      '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'
    ]
  },
  {
    name: '活动',
    icon: '⚽',
    emojis: [
      '🏀', '🏈', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁',
      '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️',
      '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️',
      '🏊‍♀️', '🏊', '🏊‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🚴‍♀️',
      '🚴', '🚴‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🎯', '🎮', '🎲', '🧩', '🎭',
      '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺',
      '🎸', '🪕', '🎻', '🎪', '🎟️', '🎫', '🎗️', '🎖️', '🏆', '🏅',
      '🥇', '🥈', '🥉'
    ]
  },
  {
    name: '旅行',
    icon: '🚗',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🚚', '🚛', '🚜', '🛴', '🛵', '🏍️', '🛺', '🚔', '🚍', '🚘',
      '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
      '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️',
      '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️',
      '⛴️', '🚢', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠',
      '⛲', '⛱️', '🏖️', '🏝️', '🏔️', '🗻', '🌋', '🗾', '🏕️', '⛺',
      '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤',
      '🏥', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍',
      '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗺️', '🗿'
    ]
  },
  {
    name: '物品',
    icon: '💡',
    emojis: [
      '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶',
      '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧',
      '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧲', '⛓️',
      '🪝', '🧱', '🪞', '🪟', '🪑', '🪣', '🪠', '🪡', '🪢', '🧶',
      '🪨', '🪦', '🪧', '🪪', '🪫', '🪬', '🪩',
      '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🎮',
      '🎰', '🎲', '🧩', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹',
      '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻', '📺', '📻', '📷',
      '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺',
      '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛',
      '⏳', '📡', '🔋', '🔌'
    ]
  },
  {
    name: '符号',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
      '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
      '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
      '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
      '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️',
      '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠',
      'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🛂', '🛃',
      '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁',
      '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕',
      '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣',
      '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏹️', '⏺️',
      '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️',
      '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️',
      '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶',
      '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️',
      '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜', '〰️', '➰', '➿', '✔️',
      '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪',
      '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️',
      '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦',
      '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕',
      '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏',
      '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗',
      '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡',
      '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'
    ]
  }
];

export default function UnicodeEmojiPicker({ 
  isOpen, 
  onClose, 
  onEmojiSelect, 
  triggerRef 
}: UnicodeEmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [pickerPosition, setPickerPosition] = useState<'bottom' | 'top'>('top');
  const pickerRef = useRef<HTMLDivElement>(null);

  // 去重函数
  const removeDuplicates = (emojis: string[]) => {
    return [...new Set(emojis)];
  };

  // 获取当前分类的表情（去重后）
  const getCurrentEmojis = () => {
    const currentCategory = emojiCategories[selectedCategory];
    if (currentCategory.name === '最近') {
      return removeDuplicates(recentEmojis.length > 0 ? recentEmojis : currentCategory.emojis);
    }
    return removeDuplicates(currentCategory.emojis);
  };

  // 加载最近使用的表情
  useEffect(() => {
    const saved = localStorage.getItem('recentEmojis');
    if (saved) {
      try {
        setRecentEmojis(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent emojis:', error);
      }
    }
  }, []);

  // 智能定位和点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        if (triggerRef?.current && !triggerRef.current.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    const calculatePosition = () => {
      if (triggerRef?.current && pickerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const pickerHeight = 400; // 表情选择器高度
        
        // 默认向上弹窗，如果上方空间不足，则显示在下方
        if (triggerRect.top < pickerHeight) {
          setPickerPosition('bottom');
        } else {
          setPickerPosition('top');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, onClose, triggerRef]);

  // 处理表情选择
  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    
    // 更新最近使用的表情
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 10);
    setRecentEmojis(newRecent);
    localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
    
    // 更新分类中的最近表情
    emojiCategories[0].emojis = newRecent;
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`unicode-emoji-picker ${pickerPosition === 'top' ? 'picker-top' : 'picker-bottom'}`} 
      ref={pickerRef}
    >
      <div className="emoji-picker-header">
        <div className="emoji-categories">
          {emojiCategories.map((category, index) => (
            <button
              key={category.name}
              className={`category-btn ${selectedCategory === index ? 'active' : ''}`}
              onClick={() => setSelectedCategory(index)}
              title={category.name}
            >
              <span className="category-icon">{category.icon}</span>
            </button>
          ))}
        </div>
      </div>
      
             <div className="emoji-picker-content">
         <div className="emoji-grid">
           {getCurrentEmojis().map((emoji, index) => (
             <button
               key={`${selectedCategory}-${index}`}
               className="emoji-btn"
               onClick={() => handleEmojiClick(emoji)}
               title={emoji}
             >
               {emoji}
             </button>
           ))}
         </div>
       </div>
    </div>
  );
}
