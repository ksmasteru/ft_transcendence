import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Gamepad2, Trophy, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// ----------------- Player Interface -----------------
interface Player {
  id: string;
  name: string;
  avatar: string;
  level: number;
  rank: number;
  winRate: number;
  status: 'online' | 'offline' | 'in-game';
  location: string;
  lastPlayed: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  coins: number;
  achievements: number;
}

// ----------------- Game Interface -----------------
interface Game {
  id: string;
  name: string;
  type: 'Ranked' | 'Casual' | 'Tournament';
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'in-progress' | 'finished';
  createdBy: string;
  skillLevel: string;
  duration: string;
}

// ----------------- Mock Games -----------------
const mockGames: Game[] = [
  {
    id: '1',
    name: 'Championship Finals',
    type: 'Tournament',
    players: 8,
    maxPlayers: 16,
    status: 'waiting',
    createdBy: 'PaddleMaster_Pro',
    skillLevel: 'Pro',
    duration: '30 min'
  },
  {
    id: '2',
    name: 'Quick Casual Match',
    type: 'Casual',
    players: 1,
    maxPlayers: 2,
    status: 'waiting',
    createdBy: 'SpinQueen_2024',
    skillLevel: 'Any',
    duration: '15 min'
  }
];

// ----------------- Status Badge -----------------
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    online: { color: 'bg-green-500', text: 'Online' },
    offline: { color: 'bg-gray-400', text: 'Offline' },
    'in-game': { color: 'bg-yellow-500', text: 'In Game' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  
  return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
};

// ----------------- Player Card -----------------
const PlayerCard: React.FC<{ player: Player }> = ({ player }) => (
  <Card className="card-gaming hover:animate-glow transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={player.avatar} 
            alt={player.name}
            className="w-16 h-16 rounded-full border-2 border-primary/50"
          />
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
              player.status === 'online'
                ? 'bg-green-500'
                : player.status === 'in-game'
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            }`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{player.name}</h3>
            <Badge className="bg-primary/20 text-primary">#{player.rank}</Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Level {player.level}</span>
            <span>•</span>
            <span>{player.winRate}% Win Rate</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {player.location}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={player.status} />
            <Badge variant="outline">{player.skillLevel}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {player.lastPlayed}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-accent font-bold flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            {player.coins.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {player.achievements} achievements
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ----------------- Game Card -----------------
const GameCard: React.FC<{ game: Game }> = ({ game }) => (
  <Card className="card-gaming hover:animate-glow transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg">{game.name}</h3>
            <Badge
              className={`${
                game.type === 'Tournament'
                  ? 'bg-yellow-500'
                  : game.type === 'Ranked'
                  ? 'bg-blue-500'
                  : 'bg-gray-500'
              } text-white`}
            >
              {game.type}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {game.players}/{game.maxPlayers} players
            </span>
            <span>•</span>
            <span>By {game.createdBy}</span>
            <span>•</span>
            <span>{game.duration}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{game.skillLevel}</Badge>
            <Badge
              className={`${
                game.status === 'waiting'
                  ? 'bg-green-500'
                  : game.status === 'in-progress'
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              } text-white`}
            >
              {game.status === 'waiting'
                ? 'Open'
                : game.status === 'in-progress'
                ? 'Playing'
                : 'Finished'}
            </Badge>
          </div>
        </div>

        <Button className="btn-gaming">
          {game.status === 'waiting' ? 'Join Game' : 'Spectate'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

// ----------------- Main Component -----------------
export const AdvancedSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlayers = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/user/search?name=${query}`);
      const json = await res.json();

      if (json.data) {
        const mappedPlayers: Player[] = json.data.map((user: any, index: number) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          level: user.level || 1,
          rank: index + 1,
          winRate: Math.floor(Math.random() * 100), // placeholder
          status: user.onlineStatus ? 'online' : 'offline',
          location: 'Unknown',
          lastPlayed: 'Recently',
          skillLevel: user.level > 10 ? 'Pro' : 'Beginner',
          coins: user.xp || 0,
          achievements: Math.floor((user.xp || 0) / 500),
        }));

        setPlayers(mappedPlayers);
      }
    } catch (err) {
      console.error('Error fetching players:', err);
    }
    setLoading(false);
  };

  // fetch when typing
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      fetchPlayers(searchQuery);
    } else {
      setPlayers([]);
    }
  }, [searchQuery]);

  // ----------------- Games Filter -----------------
  const filteredGames = mockGames.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search players, games, tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card/50 text-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary border border-border transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="players" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Players ({players.length})
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            Games ({filteredGames.length})
          </TabsTrigger>
        </TabsList>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4">
          {loading ? (
            <Card className="card-gaming">
              <CardContent className="p-6 text-center">Loading players...</CardContent>
            </Card>
          ) : players.length > 0 ? (
            players.map(player => <PlayerCard key={player.id} player={player} />)
          ) : (
            <Card className="card-gaming">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No players found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          {filteredGames.length > 0 ? (
            filteredGames.map(game => <GameCard key={game.id} game={game} />)
          ) : (
            <Card className="card-gaming">
              <CardContent className="p-12 text-center">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No games found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
