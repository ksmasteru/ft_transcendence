import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, BarChart2, User, Users, Shield, Search, Bell } from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  avatar?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ avatar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
      { icon: <LayoutDashboard size={20} />, active: false, label: 'Dashboard', link: '/' },
      { icon: <Search size={20} />, active: false, label: 'Search', link: '/search' },
      { icon: <MessageSquare size={20} />, active: false, label: 'Chat', link: '/chat' },
      { icon: <BarChart2 size={20} />, active: false, label: 'Leaderboard', link: '/leaderboard' },
      { icon: <User size={20} />, active: false, label: 'Profile', link: '/profile' },
      { icon: <Users size={20} />, active: false, label: 'Friends', link: '/friends' },
      { icon: <Bell size={20} />, active: false, label: 'Notifications', link: '/notifications' },
      { icon: <Shield size={20} />, active: false, label: 'Security', link: '/security' },
  ];
  
  return (
    
    <aside className="w-40 bg-black/20 p-3 flex flex-col items-center justify-between h-screen sticky top-0">
      {/* <div className="w-full"><Logo /></div> */}
      <div className="flex flex-col items-center gap-6">
      {/* <div className="w-full"> */}
        <Logo />
      </div>
      <div className="flex flex-col items-center gap-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.link;
          return (
            <button 
              key={item.label} 
              title={item.label} 
              onClick={() => navigate(item.link)} 
              className={`p-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-background/10 hover:text-foreground'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
      <div className="pb-4">
        {/* <img 
          src={avatar || 'https://cdn.intra.42.fr/users/d253bf077c4fb611910625bca09ce269/zel-khad.jpeg'} 
          alt="Current User" 
          className="w-10 h-10 rounded-full" 
        /> */}
      </div>
    </aside>
  );
};

