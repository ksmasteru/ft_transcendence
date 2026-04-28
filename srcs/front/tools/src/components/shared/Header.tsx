import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, Bell, ChevronDown, LogOut, User as UserIcon, Trophy, Gamepad2, UserPlus } from 'lucide-react';
import { User } from '../../types/user';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'game_invite' | 'friend_request' | 'achievement';
  text: string;
  timestamp: string;
  read: boolean;
  sender?: {
    name: string;
    avatar: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'game_invite',
    text: 'You have a new game invite!',
    timestamp: '5m ago',
    read: false,
    sender: { name: 'PlayerOne', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }
  },
  {
    id: '2',
    type: 'friend_request',
    text: 'sent you a friend request.',
    timestamp: '1h ago',
    read: false,
    sender: { name: 'GamerGirl99', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' }
  },
  {
    id: '3',
    type: 'achievement',
    text: 'You unlocked the "Master Pong" achievement!',
    timestamp: '1d ago',
    read: true,
  },
];


// --- NOTIFICATION SUB-COMPONENTS ---

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const iconMap = {
    game_invite: <Gamepad2 className="w-5 h-5 text-white" />,
    friend_request: <UserPlus className="w-5 h-5 text-white" />,
    achievement: <Trophy className="w-5 h-5 text-white" />,
  };
  const colorMap = {
    game_invite: 'bg-purple-500',
    friend_request: 'bg-blue-500',
    achievement: 'bg-yellow-500',
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorMap[type]}`}>
      {iconMap[type]}
    </div>
  );
};

const NotificationItem = ({ notification }: { notification: Notification }) => (
  <div className={`flex items-start gap-3 p-3 transition-colors ${!notification.read ? 'hover:bg-gray-50' : ''}`}>
    {notification.sender ? (
      <img src={notification.sender.avatar} alt={notification.sender.name} className="w-8 h-8 rounded-full" />
    ) : (
      <NotificationIcon type={notification.type} />
    )}
    <div className="flex-1">
      <p className="text-sm text-gray-800">
        {notification.sender && <strong className="font-semibold">{notification.sender.name}</strong>} {notification.text}
      </p>
      <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
    </div>
    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>}
  </div>
);

const NotificationDropdown = ({ notifications, onMarkAllRead }: {
  notifications: Notification[];
  onMarkAllRead: () => void;
}) => {
  const navigate = useNavigate(); // Initialize the navigate function

  return (
      <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button onClick={onMarkAllRead} className="text-xs font-medium text-blue-600 hover:underline">
                  Mark all as read
              </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                  notifications.map(notif => <NotificationItem key={notif.id} notification={notif} />)
              ) : (
                  <div className="p-8 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                      <p>You're all caught up!</p>
                  </div>
              )}
          </div>
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
              <button
                  onClick={() => navigate('/notifications')} 
                  className="w-full text-sm font-semibold text-blue-600 hover:underline py-1"
              >
                  View all notifications
              </button>
          </div>
      </div>
  );
};

// --- USER DROPDOWN COMPONENT ---

const UserDropdown = ({ currentUser, onLogout, onNavigate, currentPath, onClose }: { 
  currentUser?: User; 
  onLogout?: () => void; 
  onNavigate?: (path: string) => void;
  currentPath?: string;
  onClose?: () => void;
}) => {
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile button clicked');
    
    // Close dropdown first
    if (onClose) {
      onClose();
    }
    
    // Then navigate
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('/Profile');
      } else {
        window.location.href = '/Profile';
      }
    }, 100);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Settings button clicked');
    
    // Close dropdown first
    if (onClose) {
      onClose();
    }
    
    // Then navigate
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('/Security');
      } else {
        window.location.href = '/Security';
      }
    }, 100);
  };

const handleLogoutClick = async (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  console.log('Logout button clicked');

  if (onClose) {
    onClose();
  }

  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    localStorage.removeItem('userData');

    if (onLogout) {
      onLogout();
    }

    if (onNavigate) {
      onNavigate('/sign-in');
    } else {
      window.location.href = '/sign-in';
    }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      {/* User Info Header */}
      <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={currentUser?.avatar || 'https://cdn.intra.42.fr/users/d253bf077c4fb611910625bca09ce269/zel-khad.jpeg'} 
              alt="User" 
              className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {currentUser?.name || 'el khadir zakariae'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {currentUser?.email || 'elkhadirzakaria48@gmail.com'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="py-2">
        <button 
          type="button"
          onClick={handleProfileClick}
          className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors group cursor-pointer ${
            currentPath === '/Profile' 
              ? 'bg-blue-50 border-r-2 border-blue-500' 
              : 'hover:bg-gray-50'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            currentPath === '/Profile'
              ? 'bg-blue-100'
              : 'bg-gray-100 group-hover:bg-blue-100'
          }`}>
            <UserIcon size={16} className={`${
              currentPath === '/Profile'
                ? 'text-blue-600'
                : 'text-gray-600 group-hover:text-blue-600'
            }`} />
          </div>
          <span className={`font-medium ${
            currentPath === '/Profile'
              ? 'text-blue-700'
              : 'text-gray-700'
          }`}>Profile</span>
        </button>
        
        <button 
          type="button"
          onClick={handleSettingsClick}
          className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors group cursor-pointer ${
            currentPath === '/Security' 
              ? 'bg-blue-50 border-r-2 border-blue-500' 
              : 'hover:bg-gray-50'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            currentPath === '/Security'
              ? 'bg-blue-100'
              : 'bg-gray-100 group-hover:bg-blue-100'
          }`}>
            <Settings size={16} className={`${
              currentPath === '/Security'
                ? 'text-blue-600'
                : 'text-gray-600 group-hover:text-blue-600'
            }`} />
          </div>
          <span className={`font-medium ${
            currentPath === '/Security'
              ? 'text-blue-700'
              : 'text-gray-700'
          }`}>Settings</span>
        </button>
        
        <div className="border-t border-gray-100 my-2"></div>
        
        <button 
          type="button"
          onClick={handleLogoutClick}
          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 transition-colors group cursor-pointer"
        >
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <LogOut size={16} className="text-gray-600 group-hover:text-red-600" />
          </div>
          <span className="text-gray-700 font-medium group-hover:text-red-600">Logout</span>
        </button>
      </div>
    </div>
  );
};
// --- MAIN HEADER COMPONENT ---

interface HeaderProps {
  currentUser?: User;
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onNavigate, currentPath }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  // Use refs to track the dropdown elements
  const notificationRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  // Fixed outside click handler using refs
  const handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as Node;
    
    // Check if click is outside notification dropdown
    if (notificationRef.current && !notificationRef.current.contains(target)) {
      setShowNotifications(false);
    }
    
    // Check if click is outside user dropdown
    if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
      setShowUserDropdown(false);
    }
  };

  useEffect(() => {
    if (showNotifications || showUserDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showNotifications, showUserDropdown]);

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
    setShowUserDropdown(false);
  };

  const toggleUserDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserDropdown(prev => !prev);
    setShowNotifications(false);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-transparent relative z-30">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all border border-white/10"
        />
      </div>
      
      {/* Right Side Icons */}
      <div className="flex items-center gap-4">
        {/* Coins Display */}
        <div className="hidden sm:flex items-center gap-2 bg-gaming-primary/20 px-3 py-2 rounded-lg border border-gaming-primary/30">
          <Trophy className="w-4 h-4 text-gaming-accent" />
          <span className="font-bold text-gaming-accent">
            {currentUser?.coins?.toLocaleString() || '12,847'}
          </span>
        </div>
        
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={toggleNotifications}
            className={`relative transition-colors p-2 rounded-lg ${
              showNotifications ? 'text-white bg-white/20' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && <NotificationDropdown notifications={notifications} onMarkAllRead={handleMarkAllRead} />}
        </div>
        
        {/* User Profile Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button 
            onClick={toggleUserDropdown}
            className={`flex items-center gap-3 transition-colors p-2 rounded-lg ${
              showUserDropdown ? 'text-white bg-white/20' : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <img 
              src={currentUser?.avatar || 'https://cdn.intra.42.fr/users/d253bf077c4fb611910625bca09ce269/zel-khad.jpeg'} 
              alt="User" 
              className="w-8 h-8 rounded-full border-2 border-white/20" 
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-white">
                {currentUser?.name || 'el khadir zakariae'}
              </p>
              <p className="text-xs text-green-400">Online</p>
            </div>
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {showUserDropdown && (
            <UserDropdown 
              currentUser={currentUser} 
              currentPath={currentPath}
              onClose={() => setShowUserDropdown(false)}
              onLogout={onLogout}
              onNavigate={onNavigate}
              // isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </header>
  );
};