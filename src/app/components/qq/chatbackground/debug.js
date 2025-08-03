// 调试脚本 - 用于检查聊天背景功能
console.log('=== 聊天背景调试工具 ===');

// 检查数据库中的背景数据
async function checkBackgroundData() {
  try {
    // 模拟dataManager的方法
    const db = await indexedDB.open('ChatAppDB', 8);
    
    db.onsuccess = function(event) {
      const database = event.target.result;
      const transaction = database.transaction(['chatBackgrounds'], 'readonly');
      const store = transaction.objectStore('chatBackgrounds');
      const request = store.getAll();
      
      request.onsuccess = function() {
        console.log('数据库中的背景数据:', request.result);
      };
      
      request.onerror = function() {
        console.error('读取背景数据失败:', request.error);
      };
    };
    
    db.onerror = function() {
      console.error('打开数据库失败:', db.error);
    };
  } catch (error) {
    console.error('检查背景数据时出错:', error);
  }
}

// 检查localStorage中的背景数据
function checkLocalStorageBackgrounds() {
  const backgrounds = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chatBackground_')) {
      backgrounds[key] = localStorage.getItem(key);
    }
  }
  console.log('localStorage中的背景数据:', backgrounds);
}

// 检查CSS变量
function checkThemeVariables() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const themeVars = [
    '--theme-bg-primary',
    '--theme-bg-secondary', 
    '--theme-bg-tertiary',
    '--theme-text-primary',
    '--theme-text-secondary',
    '--theme-accent-color',
    '--theme-border-color',
    '--theme-shadow-heavy'
  ];
  
  const themeValues = {};
  themeVars.forEach(varName => {
    themeValues[varName] = computedStyle.getPropertyValue(varName);
  });
  
  console.log('当前主题变量值:', themeValues);
}

// 运行所有检查
function runAllChecks() {
  console.log('开始检查...');
  checkBackgroundData();
  checkLocalStorageBackgrounds();
  checkThemeVariables();
}

// 导出到全局
window.debugChatBackground = {
  checkBackgroundData,
  checkLocalStorageBackgrounds,
  checkThemeVariables,
  runAllChecks
};

console.log('调试工具已加载，使用 window.debugChatBackground.runAllChecks() 来检查'); 