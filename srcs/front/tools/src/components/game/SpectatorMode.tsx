import { useEffect, useState } from "react";
import { MdVisibility, MdClose } from "react-icons/md";

interface LiveGame {
  gameId: string;
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  startedAt: string;
}

interface SpectatorModeProps {
  onWatchGame: (gameId: string, player1Name: string, player2Name: string) => void;
  onClose: () => void;
  socket: WebSocket | null;
}

export function SpectatorMode({
  onWatchGame,
  onClose,
  socket,
}: SpectatorModeProps): JSX.Element {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch live games
    const fetchLiveGames = async () => {
      try {
        // Use dynamic hostname for game service (port 4003)
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const gameServiceUrl = `${protocol}//${hostname}:4003`;
        const res = await fetch(`${gameServiceUrl}/api/v1/games/live`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setLiveGames(json.data || []);
        }
      } catch (error) {
        console.error("Error fetching live games:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 2000);

    // Listen for WebSocket updates
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "game_started") {
            setLiveGames((prev) => [
              ...prev,
              {
                gameId: data.gameId,
                player1Id: data.player1Id,
                player1Name: data.player1Name,
                player2Id: data.player2Id,
                player2Name: data.player2Name,
                player1Score: 0,
                player2Score: 0,
                startedAt: new Date().toISOString(),
              },
            ]);
          } else if (data.type === "game_ended") {
            setLiveGames((prev) =>
              prev.filter((game) => game.gameId !== data.gameId)
            );
          } else if (data.type === "game_update") {
            setLiveGames((prev) =>
              prev.map((game) =>
                game.gameId === data.gameId
                  ? {
                      ...game,
                      player1Score: data.player1Score,
                      player2Score: data.player2Score,
                    }
                  : game
              )
            );
          }
        } catch (error) {
          console.error("Error parsing spectator message:", error);
        }
      };

      socket.addEventListener("message", handleMessage);
      return () => {
        socket.removeEventListener("message", handleMessage);
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [socket]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-primary-elements/95 to-primary-elements/85 backdrop-blur-xl p-6 rounded-2xl border-2 border-primary-btn/30 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-secondary flex items-center gap-2 bg-gradient-to-r from-[#00FFFF] via-white to-[#FF6B00] bg-clip-text text-transparent">
            <MdVisibility className="text-primary-btn" size={28} />
            Live Games
          </h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-btn border-t-transparent"></div>
          </div>
        ) : liveGames.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <MdVisibility size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-primary">No live games at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {liveGames.map((game) => (
              <div
                key={game.gameId}
                className="bg-primary-bg/50 p-4 rounded-lg border border-primary-btn/20 hover:border-primary-btn/50 transition-all cursor-pointer"
                onClick={() =>
                  onWatchGame(game.gameId, game.player1Name, game.player2Name)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-white/60 font-primary">LIVE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-white font-primary">
                        <p className="font-semibold">{game.player1Name}</p>
                        <p className="text-primary-btn text-2xl font-bold font-secondary">
                          {game.player1Score}
                        </p>
                      </div>
                      <div className="text-white/40 font-secondary text-xl">VS</div>
                      <div className="text-white font-primary text-right">
                        <p className="font-semibold">{game.player2Name}</p>
                        <p className="text-primary-btn text-2xl font-bold font-secondary">
                          {game.player2Score}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatchGame(game.gameId, game.player1Name, game.player2Name);
                    }}
                    className="ml-4 px-4 py-2 bg-primary-btn/80 hover:bg-primary-btn text-primary-bg rounded-lg transition-colors font-primary font-semibold"
                  >
                    Watch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

