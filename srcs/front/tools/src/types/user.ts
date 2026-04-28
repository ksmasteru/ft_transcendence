export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
  onlineStatus: boolean;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled: boolean;
  xp: number;
  level: number;
  coins?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  rank?: number;
  streak?: number;
  joinDate?: string;
  totalAchievements?: number;
  medals?: {
    gold: number;
    silver: number;
    bronze: number;
  };
  recentActivities?: Array<{
    id: string;
    text: string;
    createdAt: string;
    icon?: React.ReactNode;
  }>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: 'GOLD' | 'SILVER' | 'BRONZE';
}

export interface UserAchievement {
  achievement: Achievement;
  unlockedAt: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  text: string;
  createdAt: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  requester: User;
  addressee: User;
}

export interface Chat {
  id: string;
  name?: string;
  avatar?: string;
  isGroup: boolean;
  createdAt: string;
  lastMessageAt: string;
  participants: ChatParticipant[];
  messages: Message[];
}

export interface ChatParticipant {
  userId: string;
  chatId: string;
  joinedAt: string;
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl?: string;
  replyToId?: string;
  createdAt: string;
  sender: User;
  replyTo?: Message;
  reactions: Reaction[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user: User;
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  createdAt: string;
  userId: string;
}