// User data interface for the profile section (may be used for other sections as well)
export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: string;
  unlockedAt?: string;
  count?: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  text: string;
  createdAt: string;
}

export interface UserDataInter {
  achievements: Achievement[] | string[]; // Can be array of objects or strings for backward compatibility
  avatar: string;
  createdAt: string;
  email: string;
  id: string;
  level: number;
  medals: { gold: number; silver: number; bronze: number };
  name: string;
  onlineStatus: boolean;
  recentActivities: RecentActivity[] | string[]; // Can be array of objects or strings
  totalAchievements: number;
  twoFactorEnabled: boolean;
  updatedAt: string;
  verified: boolean;
  xp: number;
  firstName: string;
  lastName: string;
  bio?: string;
  error?: string | null;
  Games?: Array<{ id: string; title: string; createdAt: string }>; // Game records
}

export interface UserInter {
  id: string;
  email: string;
  name: string;
}
