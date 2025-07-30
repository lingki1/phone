# 底部导航组件使用示例
Write-Host "=== 底部导航组件分离完成 ===" -ForegroundColor Green
Write-Host ""

Write-Host "📁 文件结构:" -ForegroundColor Yellow
Write-Host "src/app/components/qq/" -ForegroundColor Cyan
Write-Host "├── BottomNavigation.tsx          # 主组件文件" -ForegroundColor White
Write-Host "├── BottomNavigation.css          # 独立样式文件" -ForegroundColor White
Write-Host "├── BottomNavigationExample.tsx   # 使用示例" -ForegroundColor White
Write-Host "└── BottomNavigation.README.md    # 使用说明" -ForegroundColor White
Write-Host ""

Write-Host "🚀 使用方法:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣ 基本用法 (使用默认导航项):" -ForegroundColor Cyan
Write-Host "import BottomNavigation from './BottomNavigation';" -ForegroundColor White
Write-Host "import './BottomNavigation.css';" -ForegroundColor White
Write-Host ""
Write-Host "function MyPage() {" -ForegroundColor White
Write-Host "  const [activeView, setActiveView] = useState('messages');" -ForegroundColor White
Write-Host ""
Write-Host "  return (" -ForegroundColor White
Write-Host "    <div style={{ height: '100vh', position: 'relative' }}>" -ForegroundColor White
Write-Host "      <div style={{ paddingBottom: '80px' }}>" -ForegroundColor White
Write-Host "        {/* 你的页面内容 */}" -ForegroundColor White
Write-Host "      </div>" -ForegroundColor White
Write-Host "      " -ForegroundColor White
Write-Host "      <BottomNavigation" -ForegroundColor White
Write-Host "        activeView={activeView}" -ForegroundColor White
Write-Host "        onViewChange={setActiveView}" -ForegroundColor White
Write-Host "      />" -ForegroundColor White
Write-Host "    </div>" -ForegroundColor White
Write-Host "  );" -ForegroundColor White
Write-Host "}" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣ 自定义导航项:" -ForegroundColor Cyan
Write-Host "const customNavItems = [" -ForegroundColor White
Write-Host "  {" -ForegroundColor White
Write-Host "    key: 'home'," -ForegroundColor White
Write-Host "    label: '首页'," -ForegroundColor White
Write-Host "    icon: <HomeIcon />" -ForegroundColor White
Write-Host "  }," -ForegroundColor White
Write-Host "  // ... 更多导航项" -ForegroundColor White
Write-Host "];" -ForegroundColor White
Write-Host ""
Write-Host "<BottomNavigation" -ForegroundColor White
Write-Host "  activeView={activeView}" -ForegroundColor White
Write-Host "  onViewChange={setActiveView}" -ForegroundColor White
Write-Host "  navItems={customNavItems}" -ForegroundColor White
Write-Host "/>" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ 自定义样式:" -ForegroundColor Cyan
Write-Host "<BottomNavigation" -ForegroundColor White
Write-Host "  activeView={activeView}" -ForegroundColor White
Write-Host "  onViewChange={setActiveView}" -ForegroundColor White
Write-Host "  className='my-custom-nav'" -ForegroundColor White
Write-Host "/>" -ForegroundColor White
Write-Host ""

Write-Host "✅ 组件特性:" -ForegroundColor Yellow
Write-Host "• 响应式设计 - 自动适配不同屏幕尺寸" -ForegroundColor White
Write-Host "• 主题支持 - 强制白色主题，支持深色模式" -ForegroundColor White
Write-Host "• 安全区域适配 - 支持iOS安全区域" -ForegroundColor White
Write-Host "• 可自定义 - 支持自定义导航项和样式" -ForegroundColor White
Write-Host "• TypeScript支持 - 完整的类型定义" -ForegroundColor White
Write-Host ""

Write-Host "📋 组件属性:" -ForegroundColor Yellow
Write-Host "| 属性 | 类型 | 默认值 | 说明 |" -ForegroundColor White
Write-Host "|------|------|--------|------|" -ForegroundColor White
Write-Host "| activeView | string | - | 当前激活的导航项key |" -ForegroundColor White
Write-Host "| onViewChange | (view: string) => void | - | 导航项切换回调 |" -ForegroundColor White
Write-Host "| navItems | NavItem[] | defaultNavItems | 自定义导航项数组 |" -ForegroundColor White
Write-Host "| className | string | '' | 自定义CSS类名 |" -ForegroundColor White
Write-Host ""

Write-Host "🔧 测试命令:" -ForegroundColor Yellow
Write-Host "npm run build    # 构建项目" -ForegroundColor White
Write-Host "npm run dev      # 启动开发服务器" -ForegroundColor White
Write-Host ""

Write-Host "📖 更多信息:" -ForegroundColor Yellow
Write-Host "查看 src/app/components/qq/BottomNavigation.README.md 获取详细使用说明" -ForegroundColor White
Write-Host ""

Write-Host "🎉 底部导航组件已成功分离，现在可以在任何页面中复用了！" -ForegroundColor Green 