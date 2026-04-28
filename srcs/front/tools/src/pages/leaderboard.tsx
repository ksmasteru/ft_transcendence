import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users,
  Calendar,
  Target,
  Zap,
  Award,
  AlertCircle,
  Loader2
} from 'lucide-react';

// INTERFACES
interface LeaderboardPlayer {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  xp: number;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
  streak: number;
}

// API ENDPOINTS
const LEADERBOARD_API_URL = 'http://localhost:3000/api/v1/user/leaderboard';
const ME_API_URL = 'http://localhost:3000/api/v1/user/me';

// CHILD COMPONENTS (Unchanged)
const LeaderboardCard: React.FC<{ 
  player: LeaderboardPlayer; 
  isCurrentUser?: boolean;
}> = ({ player, isCurrentUser = false }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-accent" />;
      case 2: return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3: return <Medal className="w-6 h-6 text-orange-400" />;
      default: return <div className="w-6 h-6 flex items-center justify-center text-lg font-bold text-muted-foreground">#{rank}</div>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1: return "from-accent to-accent-glow";
      case 2: return "from-muted to-muted-foreground";
      case 3: return "from-orange-400 to-orange-500";
      default: return "from-primary/20 to-secondary/20";
    }
  };

  return (
    <Card className={`card-gaming ${isCurrentUser ? 'ring-2 ring-primary' : ''} hover:animate-glow transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${getRankGradient(player.rank)}`}>
            {getRankIcon(player.rank)}
          </div>
          <div className="flex items-center gap-4 flex-1">
            <img 
              src={player.avatar || 'https://i.pravatar.cc/150'}
              alt={player.name}
              className="w-12 h-12 rounded-full border-2 border-primary/50"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg gaming-text-glow">{player.name}</h3>
                {isCurrentUser && <Badge className="bg-primary/20 text-primary">You</Badge>}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Level {player.level}</span>
                <span>•</span>
                <span>{player.xp.toLocaleString()} XP</span>
                {player.streak > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-success flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {player.streak} streak
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-lg font-bold score-display">{player.winRate}%</div>
            <div className="text-xs text-muted-foreground">
              {player.wins}W / {player.losses}L
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient?: string;
  description?: string;
}> = ({ title, value, icon, gradient = "from-primary to-secondary", description }) => (
  <Card className="card-gaming">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold score-display">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-1">{description}</div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);


// MAIN PAGE COMPONENT
export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState('alltime');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch leaderboard and current user data concurrently
        const [leaderboardRes, meRes] = await Promise.all([
          fetch(LEADERBOARD_API_URL, { credentials: 'include' }),
          fetch(ME_API_URL, { credentials: 'include' }) // Add this object
        ]);

        if (!leaderboardRes.ok || !meRes.ok) {
          throw new Error('Failed to fetch required data');
        }

        const leaderboardResult = await leaderboardRes.json();
        const meResult = await meRes.json();
        
        // Process leaderboard data
        const rankedPlayers = leaderboardResult.data.map((player: any, index: number) => ({
          ...player,
          rank: index + 1,
          winRate: player.wins + player.losses > 0 
            ? Math.round((player.wins / (player.wins + player.losses)) * 1000) / 10
            : 0,
        }));
        
        setPlayers(rankedPlayers);
        // Assuming the /me endpoint returns { data: { id: '...' } }
        setCurrentUserId(meResult.data.id);

      } catch (err: any) {
        setError('Failed to load the leaderboard. Please try again later.');
        console.error("API Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]); // You can enhance this to pass the timeRange to the API

  const currentUserData = currentUserId ? players.find(p => p.id === currentUserId) : null;

  return (
    <PageLayout>
      <div className="ping-pong-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold mb-2 text-gaming-primary">Leaderboard</h1>
            <p className="text-muted-foreground text-lg">Compete with the best ping pong players worldwide</p>
          </div>

          {/* Current User Stats */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gaming-secondary">Your Standing</h2>
            {loading ? (
              <Card className="card-gaming">
                <CardContent className="p-6 flex items-center gap-4 animate-pulse">
                  <div className="w-16 h-16 rounded-lg bg-muted/50"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 rounded bg-muted/50"></div>
                    <div className="h-3 w-1/2 rounded bg-muted/50"></div>
                  </div>
                </CardContent>
              </Card>
            ) : currentUserData ? (
              <LeaderboardCard player={currentUserData} isCurrentUser={true} />
            ) : !error ? (
              <Card className="card-gaming">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Your rank will appear here once you've completed a match.</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <StatCard title="Total Players" value="12,847" icon={<Users className="w-5 h-5 text-white" />} gradient="from-primary to-primary-glow" description="Active this week"/>
             <StatCard title="Matches Today" value="2,341" icon={<Target className="w-5 h-h-5 text-white" />} gradient="from-secondary to-secondary-glow" description="Live matches ongoing"/>
             <StatCard title="Top Win Rate" value="94.2%" icon={<Trophy className="w-5 h-5 text-white" />} gradient="from-accent to-accent-glow" description="Best performer"/>
             <StatCard title="Average Level" value="28" icon={<TrendingUp className="w-5 h-5 text-white" />} gradient="from-destructive to-orange-400" description="All players"/>
          </div>

          {/* Leaderboard Tabs */}
          <Card className="card-gaming">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={timeRange} onValueChange={setTimeRange} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="alltime">All Time</TabsTrigger>
                </TabsList>
                
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col justify-center items-center py-20 text-destructive">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p>{error}</p>
                  </div>
                ) : (
                  <TabsContent value="alltime" className="space-y-4">
                      <div className="space-y-3">
                      {players.map((player) => (
                          <LeaderboardCard 
                            key={player.id} 
                            player={player}
                            isCurrentUser={player.id === currentUserId}
                          />
                      ))}
                      </div>
                  </TabsContent>
                )}
                {/* Add other TabsContent sections as needed */}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}