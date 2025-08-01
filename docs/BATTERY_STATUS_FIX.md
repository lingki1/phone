# 电池状态显示优化

## 问题描述
在安卓和 iOS 设备上，右上角的电量显示需要实时更新，确保用户能够看到准确的电池状态。

## 解决方案

### 1. 增强的电池API支持
- 添加了完整的 `BatteryManager` 接口定义
- 实现了异步电池信息获取
- 添加了错误处理和降级方案

### 2. 移动设备特殊处理
- 检测设备类型（移动设备 vs 桌面设备）
- 为移动设备提供更频繁的电池状态检查（15秒 vs 30秒）
- 添加页面可见性监听，当页面重新可见时更新电池状态

### 3. 改进的电池图标显示
- 更详细的电池状态指示
- 充电状态与电量级别的组合显示
- 添加了 tooltip 提示信息

### 4. 实时状态监听
- `levelchange` 事件监听电池电量变化
- `chargingchange` 事件监听充电状态变化
- 定期检查作为备用方案

## 代码改进

### 电池信息获取
```typescript
// 检测是否为移动设备
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 获取电池信息
useEffect(() => {
  const getBatteryInfo = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        const updateBatteryInfo = () => {
          const newLevel = Math.round(battery.level * 100);
          const newCharging = battery.charging;
          
          setBatteryLevel(newLevel);
          setIsCharging(newCharging);
        };

        // 初始更新和事件监听
        updateBatteryInfo();
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        // 定期检查（移动设备更频繁）
        const checkInterval = isMobileDevice() ? 15000 : 30000;
        const batteryCheckInterval = setInterval(updateBatteryInfo, checkInterval);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
          clearInterval(batteryCheckInterval);
        };
      }
    } catch (error) {
      console.error('获取电池信息失败:', error);
    }
  };

  getBatteryInfo();
}, []);
```

### 页面可见性监听
```typescript
// 监听页面可见性变化
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && isMobileDevice()) {
      // 页面重新可见时更新电池状态
      setTimeout(() => {
        if ('getBattery' in navigator) {
          navigator.getBattery().then(battery => {
            setBatteryLevel(Math.round(battery.level * 100));
            setIsCharging(battery.charging);
          });
        }
      }, 1000);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### 改进的电池图标
```typescript
const getBatteryIcon = () => {
  if (isCharging) {
    if (batteryLevel <= 20) return '🔌🔴';
    if (batteryLevel <= 50) return '🔌🟡';
    return '🔌🔋';
  }
  
  if (batteryLevel <= 10) return '🔴';
  if (batteryLevel <= 20) return '🟠';
  if (batteryLevel <= 50) return '🟡';
  if (batteryLevel <= 80) return '🟢';
  return '🔋';
};
```

## 测试方法

### 1. 运行测试脚本
```powershell
.\test-battery-fix.ps1
```

### 2. 手动测试
1. 在移动设备上打开应用
2. 查看右上角电池状态
3. 连接/断开充电器
4. 切换应用或锁屏后重新打开
5. 查看浏览器控制台日志

### 3. 支持的设备
- ✅ Android 设备（Chrome、Firefox、Samsung Internet）
- ✅ iOS 设备（Safari、Chrome）
- ✅ 桌面浏览器（Chrome、Firefox、Edge）

## 注意事项

1. **权限要求**: 某些浏览器可能需要用户授权才能访问电池信息
2. **HTTPS 要求**: 电池API 通常只在 HTTPS 环境下可用
3. **浏览器兼容性**: 不是所有浏览器都支持电池API
4. **降级处理**: 当电池API不可用时，会显示默认值并记录日志

## 日志输出

电池状态更新时会在控制台输出详细信息：
```
电池状态更新: 85%, 充电中: false, 设备类型: 移动设备
页面重新可见，尝试更新电池状态
页面可见性变化后电池状态更新完成
```

## 文件修改

- `src/app/components/DesktopPage.tsx` - 主要功能实现
- `test-battery-fix.ps1` - 测试脚本
- `docs/BATTERY_STATUS_FIX.md` - 本文档 