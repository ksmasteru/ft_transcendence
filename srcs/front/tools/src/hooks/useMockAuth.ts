import { useState, useEffect } from 'react';
import { User } from '../types/user';

// Mock user data for frontend-only implementation
const mockUser: User = {
  id: 'user-123',
  firstName: 'PingPong',
  lastName: 'Champion',
  name: 'PingPong Champion',
  email: 'champion@pingpong.com',
  avatar: 'https://i.pravatar.cc/150?u=champion',
  verified: true,
  onlineStatus: true,
  createdAt: '2024-01-15',
  updatedAt: '2024-09-05',
  twoFactorEnabled: false,
  joinDate: '2024-01-15',
  level: 42,
  xp: 45200,
  coins: 12847,
  wins: 128,
  losses: 12,
  winRate: 91.4,
  rank: 7,
  streak: 15,
  totalAchievements: 24,
  medals: {
    gold: 8,
    silver: 12,
    bronze: 4
  },
  recentActivities: [
    { id: '1', text: 'Won ranked match against PaddleMaster_Pro', createdAt: '2024-09-05' },
    { id: '2', text: 'Achieved 15-win streak!', createdAt: '2024-09-04' }
  ]
};

export const useMockAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check delay
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('mockUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(mockUser);
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
      }
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mockUser', JSON.stringify(userData));
  };

  return { user, isLoading, logout, login };
};