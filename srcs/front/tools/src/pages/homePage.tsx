import React, { useState } from 'react';
import { Header } from '../components/shared/Header';
import { Sidebar } from '../components/shared/Sidebar';
import { ProfileHeader } from '../components/shared/ProfileHeader';
import { ProgressBar } from '../components/shared/ProgressBar';
import { MedalCard } from '../components/shared/MedalCard';
import { RecentActivity } from '../components/shared/RecentActivity';
import { useUserData } from '../hooks/useUserData';
import { Logo } from '../components/shared/Logo';

import { 
  Camera, 
  Edit3, 
  Trophy, 
  Target, 
  Calendar, 
  MapPin, 
  Star,
  Users,
  Gamepad2,
  TrendingUp,
  Award,
  Clock,
  Zap,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';

// Mock player data for demonstration
const mockPlayerData = {
  id: "player_123",
  name: "Alex Champion",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  coverPhoto: "https://media.baamboozle.com/uploads/images/1193291/1677136049_129595_gif-url.gif",
  level: 47,
  rank: 156,
  winRate: 78.5,
  status: "online",
  location: "New York, USA",
  lastPlayed: "2 hours ago",
  skillLevel: "Pro",
  coins: 15420,
  achievements: 127,
  xp: 8750,
  totalAchievements: 127,
  createdAt: "January 2022",
  verified: true,
  friends: 2834,
  following: 891,
  totalMatches: 1247,
  currentStreak: 12,
  bestStreak: 28,
  favoritePaddle: "Lightning Strike",
  playTime: "347h 23m",
  badges: [
    { name: "Speed Demon", icon: "⚡", rarity: "legendary" },
    { name: "Perfectionist", icon: "🎯", rarity: "epic" },
    { name: "Marathon Player", icon: "🏃", rarity: "rare" },
    { name: "Social Butterfly", icon: "🦋", rarity: "common" }
  ],
  recentAchievements: [
    { name: "Century Club", description: "Win 100 matches", date: "2 days ago", icon: "🏆" },
    { name: "Precision Master", description: "Hit 50 perfect shots", date: "1 week ago", icon: "🎯" },
    { name: "Speed Runner", description: "Complete match in under 2 minutes", date: "2 weeks ago", icon: "⚡" }
  ],
  medals: {
    gold: 23,
    silver: 34,
    bronze: 18
  },
  recentActivities: [
    { type: "match", description: "Defeated PlayerX in Ranked Match", time: "2 hours ago" },
    { type: "achievement", description: "Unlocked 'Speed Demon' badge", time: "1 day ago" },
    { type: "level", description: "Reached Level 47", time: "3 days ago" }
  ],
  matchHistory: [
    { opponent: "ProPlayer99", result: "Win", score: "21-17", date: "2 hours ago" },
    { opponent: "TableTennis_King", result: "Win", score: "21-19", date: "5 hours ago" },
    { opponent: "SpinMaster", result: "Loss", score: "19-21", date: "1 day ago" }
  ]
};

// Component for displaying statistics
const StatCard = ({ icon: Icon, label, value, color = "text-blue-400" }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg bg-gray-700/50`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white font-semibold text-lg">{value}</p>
      </div>
    </div>
  </div>
);

// Component for badges
const BadgeCard = ({ badge }) => (
  <div className={`p-3 rounded-lg border ${
    badge.rarity === 'legendary' ? 'bg-yellow-900/20 border-yellow-500/50' :
    badge.rarity === 'epic' ? 'bg-purple-900/20 border-purple-500/50' :
    badge.rarity === 'rare' ? 'bg-blue-900/20 border-blue-500/50' :
    'bg-gray-800/50 border-gray-600/50'
  }`}>
    <div className="text-center">
      <div className="text-2xl mb-1">{badge.icon}</div>
      <p className="text-white text-sm font-medium">{badge.name}</p>
      <p className={`text-xs capitalize ${
        badge.rarity === 'legendary' ? 'text-yellow-400' :
        badge.rarity === 'epic' ? 'text-purple-400' :
        badge.rarity === 'rare' ? 'text-blue-400' :
        'text-gray-400'
      }`}>{badge.rarity}</p>
    </div>
  </div>
);

// Component for match history
const MatchHistoryCard = ({ match }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          match.result === 'Win' ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <div>
          <p className="text-white font-medium">vs {match.opponent}</p>
          <p className="text-gray-400 text-sm">{match.date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${
          match.result === 'Win' ? 'text-green-400' : 'text-red-400'
        }`}>{match.result}</p>
        <p className="text-gray-400 text-sm">{match.score}</p>
      </div>
    </div>
  </div>
);

export default function UserProfilePage() {
  const { userData: user_data, loading, error } = useUserData();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingCover, setIsEditingCover] = useState(false);
  
  // Use mock data for demo
  const userData = mockPlayerData;

  if (loading) {
    return (
      <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] flex flex-col items-center justify-center h-screen text-white">
        <Logo />
        <p className="mt-6 text-lg text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-background via-card to-muted h-screen flex items-center justify-center text-destructive text-lg">
        {error}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="bg-gradient-to-br from-background via-card to-muted h-screen flex items-center justify-center text-foreground">
        No user data available.
      </div>
    );
  }

  return (
    <div className="ping-pong-bg min-h-screen">
    {/* <div className="bg-[#1A2126] bg-[radial-gradient(ellipse_at_top_right,_rgba(0,100,255,0.3)_0%,_transparent_70%)] min-h-screen"> */}
      <div className="flex h-screen">
        <Sidebar avatar={user_data.avatar || 'https://i.pravatar.cc/150'} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header currentUser={user_data} />
          
          <main className="flex-1 overflow-y-auto">
            {/* Cover Photo Section */}
            <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
              <img 
                src={userData.coverPhoto} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30"></div>
              
              {/* Edit Cover Button */}
              <button 
                onClick={() => setIsEditingCover(true)}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              
              {/* Profile Avatar and Basic Info Overlay */}
              <div className="absolute -bottom-16 left-8 flex items-end space-x-6">
                <div className="relative">
                  <img 
                    src={user_data.avatar || 'https://i.pravatar.cc/150'} 
                    alt={user_data.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                  />
                  <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white ${
                    userData.status === 'online' ? 'bg-green-500' :
                    userData.status === 'in-game' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-white">{user_data.name}</h1>
                    {user_data.verified && <Star className="w-6 h-6 text-yellow-500 fill-current" />}
                  </div>
                  <div className="flex items-center space-x-4 text-white/80">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{userData.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {user_data.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-8 pt-20 pb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="friends" value={userData.friends.toLocaleString()} />
                <StatCard icon={Gamepad2} label="Total Matches" value={userData.totalMatches.toLocaleString()} />
                <StatCard icon={TrendingUp} label="Win Rate" value={`${userData.winRate}%`} color="text-green-400" />
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex space-x-8 border-b border-gray-700 mb-8">
                {['overview', 'achievements', 'matches', 'badges'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-2 capitalize font-medium transition-colors ${
                      activeTab === tab 
                        ? 'text-blue-400 border-b-2 border-blue-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Progress Bars */}
                    <div className="space-y-6">
                      <ProgressBar 
                        value={user_data.xp} 
                        max={10000} 
                        label={`${user_data.xp.toLocaleString()} XP`} 
                        level={user_data.level} 
                      />
                      <ProgressBar 
                        value={user_data.totalAchievements} 
                        max={200} 
                        label={`ACHIEVEMENTS ${user_data.totalAchievements}`} 
                        level={user_data.level} 
                      />
                    </div>
                    
                    {/* Medals */}
                    <div className="grid grid-cols-3 gap-6">
                      <MedalCard type="Gold" count={user_data.medals.gold} />
                      <MedalCard type="Silver" count={user_data.medals.silver} />
                      <MedalCard type="Bronze" count={user_data.medals.bronze} />
                    </div>
                    
                    {/* Recent Activity */}
                    <RecentActivity activities={user_data.recentActivities} />
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Player Stats */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                      <h3 className="text-xl font-bold text-white mb-4">Player Stats</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Streak</span>
                          <span className="text-white font-semibold">{userData.currentStreak} wins</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Best Streak</span>
                          <span className="text-green-400 font-semibold">{userData.bestStreak} wins</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Play Time</span>
                          <span className="text-white font-semibold">{userData.playTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Favorite Paddle</span>
                          <span className="text-blue-400 font-semibold">{userData.favoritePaddle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Coins</span>
                          <span className="text-yellow-400 font-semibold">{userData.coins.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent Achievements */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                      <h3 className="text-xl font-bold text-white mb-4">Recent Achievements</h3>
                      <div className="space-y-3">
                        {userData.recentAchievements.map((achievement, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="text-2xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{achievement.name}</p>
                              <p className="text-gray-400 text-sm">{achievement.description}</p>
                              <p className="text-gray-500 text-xs">{achievement.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'badges' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {userData.badges.map((badge, index) => (
                    <BadgeCard key={index} badge={badge} />
                  ))}
                </div>
              )}
              
              {activeTab === 'matches' && (
                <div className="max-w-2xl space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Matches</h3>
                  {userData.matchHistory.map((match, index) => (
                    <MatchHistoryCard key={index} match={match} />
                  ))}
                </div>
              )}
              
              {activeTab === 'achievements' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userData.recentAchievements.map((achievement, index) => (
                    <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div>
                          <h4 className="text-white font-bold">{achievement.name}</h4>
                          <p className="text-gray-400 text-sm">{achievement.description}</p>
                          <p className="text-gray-500 text-xs mt-2">{achievement.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}