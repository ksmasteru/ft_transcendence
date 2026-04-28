import React from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useUserData } from '../hooks/useUserData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  Calendar,
  Users,
  GamepadIcon,
  Award,
  Flame,
  Timer,
  BarChart3,
  ArrowRight
} from 'lucide-react';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  gradient?: string;
}> = ({ title, value, change, icon, gradient = "from-primary to-primary-glow" }) => (
  <Card className="card-gaming hover:animate-glow transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold score-display">{value}</div>
      {change && (
        <div className="flex items-center text-sm text-success mt-1">
          <TrendingUp className="w-4 h-4 mr-1" />
          {change}
        </div>
      )}
    </CardContent>
  </Card>
);

const GameModeCard: React.FC<{
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Pro';
  players: string;
  icon: React.ReactNode;
}> = ({ title, description, difficulty, players, icon }) => {
  const difficultyColors = {
    Easy: 'bg-success',
    Medium: 'bg-warning', 
    Hard: 'bg-accent',
    Pro: 'bg-destructive'
  };

  return (
    <Card className="card-gaming group cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg gaming-text-glow">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{players}</p>
            </div>
          </div>
          <Badge className={`${difficultyColors[difficulty]} text-white`}>
            {difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button className="w-full btn-gaming group-hover:scale-105 transition-transform">
          Play Now
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

const RecentMatchCard: React.FC<{
  opponent: string;
  result: 'won' | 'lost' | 'draw';
  score: string;
  date: string;
  duration: string;
}> = ({ opponent, result, score, date, duration }) => {
  const resultColors = {
    won: 'text-success',
    lost: 'text-destructive', 
    draw: 'text-warning'
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${result === 'won' ? 'bg-success' : result === 'lost' ? 'bg-destructive' : 'bg-warning'}`} />
        <div>
          <p className="font-medium">vs {opponent}</p>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${resultColors[result]}`}>{score}</p>
        <p className="text-sm text-muted-foreground">{duration}</p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { userData, loading, error } = useUserData();

  if (loading || error || !userData) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            {loading && <p className="text-muted-foreground">Loading...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {!userData && !loading && <p className="text-muted-foreground">No user data available</p>}
          </div>
        </div>
      </PageLayout>
    );
  }

  const gameModes = [
    {
      title: "Quick Match",
      description: "Jump into a fast-paced 1v1 match with players of similar skill level.",
      difficulty: "Easy" as const,
      players: "1v1",
      icon: <Zap className="w-5 h-5 text-white" />
    },
    {
      title: "Tournament",
      description: "Compete in structured tournaments with multiple rounds and prizes.", 
      difficulty: "Hard" as const,
      players: "8-16 Players",
      icon: <Trophy className="w-5 h-5 text-white" />
    },
    {
      title: "Training Mode",
      description: "Practice your skills against AI opponents with adjustable difficulty.",
      difficulty: "Medium" as const, 
      players: "1vAI",
      icon: <Target className="w-5 h-5 text-white" />
    },
    {
      title: "Pro League",
      description: "Elite competitive matches for advanced players. Ranked gameplay only.",
      difficulty: "Pro" as const,
      players: "1v1 Ranked", 
      icon: <Award className="w-5 h-5 text-white" />
    }
  ];

  const recentMatches = [
    { opponent: "ProPlayer_42", result: "won" as const, score: "11-8", date: "2 hours ago", duration: "12m 34s" },
    { opponent: "SpeedDemon", result: "lost" as const, score: "9-11", date: "5 hours ago", duration: "15m 21s" },
    { opponent: "TableMaster", result: "won" as const, score: "11-6", date: "1 day ago", duration: "8m 45s" },
    { opponent: "PingPongKing", result: "draw" as const, score: "10-10", date: "2 days ago", duration: "18m 12s" },
  ];

  return (
    <PageLayout>
      <div className="ping-pong-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold mb-2 text-gaming-primary">
              Welcome back, {userData.name}!
            </h1>
            <p className="text-muted-foreground text-lg">
              Ready for your next ping pong challenge?
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Current Rank"
              value={`Level ${userData.level}`}
              change="+2 this week"
              icon={<Trophy className="w-5 h-5 text-white" />}
              gradient="from-accent to-accent-glow"
            />
            <StatCard
              title="Win Streak"
              value="7"
              change="+3 today" 
              icon={<Flame className="w-5 h-5 text-white" />}
              gradient="from-destructive to-orange-400"
            />
            <StatCard
              title="Total XP"
              value={userData.xp?.toLocaleString() || "0"}
              change="+245 today"
              icon={<Zap className="w-5 h-5 text-white" />}
              gradient="from-primary to-secondary"
            />
            <StatCard
              title="Matches Played"
              value="142"
              change="+5 this week"
              icon={<GamepadIcon className="w-5 h-5 text-white" />}
              gradient="from-secondary to-secondary-glow"
            />
          </div>

          {/* Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Level {userData.level}</span>
                    <span>{userData.xp || 0}/10000 XP</span>
                  </div>
                  <div className="progress-gaming">
                    <Progress 
                      value={(userData.xp || 0) / 100} 
                      className="h-3 bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {10000 - (userData.xp || 0)} XP until next level
                </p>
              </CardContent>
            </Card>

            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  Daily Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Win 3 matches in a row</span>
                    <Badge variant="outline">2/3</Badge>
                  </div>
                  <Progress value={66.7} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Complete to earn 500 XP bonus!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Modes */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gaming-secondary">Game Modes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {gameModes.map((mode) => (
                <GameModeCard key={mode.title} {...mode} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Matches */}
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-accent" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMatches.map((match, index) => (
                  <RecentMatchCard key={index} {...match} />
                ))}
                <Button variant="outline" className="w-full">
                  View All Matches
                </Button>
              </CardContent>
            </Card>

            {/* Friends Online */}
            <Card className="card-gaming">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Friends Online
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Alex_Paddle", status: "In Match", avatar: "/avatar/1.png" },
                  { name: "Sarah_Spin", status: "Online", avatar: "/avatar/2.png" },
                  { name: "Mike_Smash", status: "Practice Mode", avatar: "/avatar/3.png" },
                  { name: "Lisa_Loop", status: "Online", avatar: "/avatar/4.png" },
                ].map((friend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={friend.avatar} 
                        alt={friend.name}
                        className="w-8 h-8 rounded-full border-2 border-primary/50"
                      />
                      <div>
                        <p className="font-medium text-sm">{friend.name}</p>
                        <p className="text-xs text-muted-foreground">{friend.status}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Challenge
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Friends
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}