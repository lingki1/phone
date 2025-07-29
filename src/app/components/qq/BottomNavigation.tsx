'use client';

interface BottomNavigationProps {
  activeView: 'messages' | 'moments' | 'me';
  onViewChange: (view: 'messages' | 'moments' | 'me') => void;
}

export default function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    {
      key: 'messages' as const,
      label: '消息',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      )
    },
    {
      key: 'moments' as const,
      label: '动态',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      key: 'me' as const,
      label: '我',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      )
    }
  ];

  return (
    <div className="bottom-navigation">
      {navItems.map((item) => (
        <div
          key={item.key}
          className={`nav-item ${activeView === item.key ? 'active' : ''}`}
          onClick={() => onViewChange(item.key)}
        >
          <div className="nav-icon">
            {item.icon}
          </div>
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
} 