import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  level: number;
  rank: number;
  winRate: number;
  status: "online" | "offline" | "in-game";
  location: string;
  lastPlayed: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  coins: number;
  achievements: number;
}

interface PlayerCardProps {
  player: Player;
  onSendRequest?: (playerId: string) => void; // 👈 new
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onSendRequest }) => {
  return (
    <Card className="bg-card border-border rounded-2xl shadow-md overflow-hidden">
      <CardContent className="p-4 flex flex-col items-center">
        {/* Avatar */}
        <img
          src={player.avatar || 'https://i.pravatar.cc/150'}
          alt={player.name}
          className="w-20 h-20 rounded-full mb-3 border-2 border-primary"
        />

        {/* Name + Status */}
        <h3 className="font-bold text-lg text-white">{player.name}</h3>
        <Badge
          variant={player.status === "online" ? "default" : "secondary"}
          className="mb-2 capitalize"
        >
          {player.status}
        </Badge>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mt-3 w-full">
          <div>
            <p className="font-semibold text-white">Level</p>
            <p>{player.level}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Rank</p>
            <p>#{player.rank}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Win Rate</p>
            <p>{player.winRate}%</p>
          </div>
          <div>
            <p className="font-semibold text-white">Skill</p>
            <p>{player.skillLevel}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Coins</p>
            <p>{player.coins}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Achievements</p>
            <p>{player.achievements}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>{player.location}</p>
          <p>Last played: {player.lastPlayed}</p>
        </div>

        {/* ✅ Add Friend Button */}
        {onSendRequest && (
          <Button
            className="mt-4 w-full bg-green-600 hover:bg-green-700"
            onClick={() => onSendRequest(player.id)}
          >
            Send Friend Request
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
