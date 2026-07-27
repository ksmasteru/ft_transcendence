import { useState, useEffect, useRef, useCallback } from "react";
import { useDashboardContext } from "../../Pages/Dashboard";
import { PongGame } from "../game/PongGame";
import { AIGame } from "../game/AIGame";
import { MatchmakingQueue } from "../game/MatchmakingQueue";
import { SpectatorMode } from "../game/SpectatorMode";
import { SpectatorGame } from "../game/SpectatorGame";
import { EndGameScreen } from "../game/EndGameScreen";
import { PrimaryButton, SecondaryButton } from "../Buttons";
import { MdVisibility, MdPlayArrow, MdSmartToy } from "react-icons/md";

type GameView = "menu" | "matchmaking" | "playing" | "playingAI" | "spectating" | "endGame";

interface GameSession {
  gameId: string;
  opponentId: string;
  opponentName: string;
  isPlayer1: boolean;
}

interface EndGameData {
  winner: string;
  playerScore: number;
  opponentScore: number;
}

export function GameSection(): JSX.Element {
  const { user, refreshUserData } = useDashboardContext();
  const [currentView, setCurrentView] = useState<GameView>("menu");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [endGameData, setEndGameData] = useState<EndGameData | null>(null);
  const [spectatorGame, setSpectatorGame] = useState<{
    gameId: string;
    player1Name: string;
    player2Name: string;
  } | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectWebSocketRef = useRef<(() => WebSocket | null) | null>(null);
  const maxReconnectAttempts = 5;

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      // Use dynamic hostname to support network access
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      const wsUrl = `${protocol}//${hostname}:9090`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setReconnectAttempts(0);
        if (user) {
          ws.send(
            JSON.stringify({
              type: "authenticate",
              userId: user.id,
              userName: user.name,
            })
          );
        }
      };

      ws.onerror = () => {
        // Silently handle WebSocket error
      };

      ws.onclose = () => {
        // Attempt to reconnect if we're in a game
        setCurrentView((prevView) => {
          if (
            prevView === "playing" ||
            prevView === "matchmaking" ||
            prevView === "spectating"
          ) {
            setReconnectAttempts((prevAttempts) => {
              if (prevAttempts < maxReconnectAttempts) {
                const delay = Math.min(1000 * Math.pow(2, prevAttempts), 10000);
                reconnectTimeoutRef.current = setTimeout(() => {
                  setReconnectAttempts((prev) => prev + 1);
                  // Use the latest connectWebSocket from ref
                  if (connectWebSocketRef.current) {
                    const latestWs = connectWebSocketRef.current();
                    if (!latestWs) {
                      alert("Failed to reconnect. Please refresh the page.");
                    }
                  }
                }, delay);
              } else {
                // Max reconnection attempts reached
                alert(
                  "Connection lost. Please refresh the page to reconnect."
                );
              }
              return prevAttempts;
            });
            return prevView;
          }
          return prevView;
        });
      };

      setSocket(ws);
      return ws;
    } catch (error) {
      // Silently handle WebSocket creation error
      return null;
    }
  }, [user, maxReconnectAttempts]);

  // Update ref when connectWebSocket changes
  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  useEffect(() => {
    // Connect WebSocket when component mounts
    const ws = connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);


  // Handle match found
  const handleMatchFound = useCallback(
    (gameId: string, opponentId: string, opponentName: string, isPlayer1: boolean) => {
      setGameSession({
        gameId,
        opponentId,
        opponentName,
        isPlayer1,
      });
      setCurrentView("playing");
    },
    []
  );

  // Global WebSocket message handler for match_found (handles reconnection)
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle match_found message (for reconnection when user tries to join queue)
        if (data.type === "match_found") {
          handleMatchFound(data.gameId, data.opponentId, data.opponentName, data.isPlayer1);
        }
      } catch (error) {
        // Ignore parsing errors, let other handlers deal with them
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, handleMatchFound]);

  // Handle game end
  const handleGameEnd = useCallback(
    async (winner: string, playerScore: number, opponentScore: number, isAIGame: boolean = false) => {
      setEndGameData({
        winner,
        playerScore,
        opponentScore,
      });
      setCurrentView("endGame");
      
      // For AI games, we still refresh user data (won't update stats but keeps data fresh)
      // For online games, refresh after delays to ensure backend has processed
      if (!isAIGame) {
        // First refresh after 1.5 seconds (backend should be done by then)
        setTimeout(async () => {
          try {
            await refreshUserData();
          } catch (error) {
            // Silently handle error
          }
        }, 1500);
        
        // Second refresh after 3 seconds as backup
        setTimeout(async () => {
          try {
            await refreshUserData();
          } catch (error) {
            // Silently handle error
          }
        }, 3000);
      } else {
        // For AI games, just refresh once after a short delay
        setTimeout(async () => {
          try {
            await refreshUserData();
          } catch (error) {
            // Silently handle error
          }
        }, 500);
      }
    },
    [refreshUserData]
  );

  // Handle disconnect/leave game
  const handleDisconnect = useCallback(async () => {
    if (socket && socket.readyState === WebSocket.OPEN && gameSession) {
      // Notify backend that user is leaving the game
      try {
        socket.send(
          JSON.stringify({
            type: "leave_game",
            gameId: gameSession.gameId,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        // Silently handle error
      }
    }
    setCurrentView("menu");
    setGameSession(null);
    
    // Refresh user data after leaving game (in case game was forfeited)
    setTimeout(async () => {
      try {
        await refreshUserData();
      } catch (error) {
        // Silently handle error
      }
    }, 1000);
  }, [socket, gameSession, refreshUserData]);

  // Start matchmaking
  const startMatchmaking = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      // Reconnect if needed
      const newSocket = connectWebSocket();
      if (newSocket) {
        newSocket.onopen = () => {
          setCurrentView("matchmaking");
        };
        newSocket.onerror = () => {
          alert("Failed to connect to game server. Please try again.");
        };
      } else {
        alert("Failed to connect to game server. Please try again.");
      }
    } else {
      setCurrentView("matchmaking");
    }
  };

  // Cancel matchmaking
  const cancelMatchmaking = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "leave_queue",
          timestamp: Date.now(),
        })
      );
    }
    setCurrentView("menu");
  };

  // Watch game as spectator
  const handleWatchGame = (
    gameId: string,
    player1Name: string,
    player2Name: string
  ) => {
    setSpectatorGame({ gameId, player1Name, player2Name });
    setCurrentView("spectating");
  };

  // Start AI game
  const startAIGame = () => {
    setCurrentView("playingAI");
  };

  // Play again
  const handlePlayAgain = async () => {
    // Check if we need to go back to AI game or matchmaking
    const endGameDataSnapshot = endGameData;
    const gameSessionSnapshot = gameSession;
    
    setEndGameData(null);
    setGameSession(null);
    
    // Determine if it was an AI game by checking if opponent was "AI Opponent"
    if (endGameDataSnapshot && endGameDataSnapshot.winner && 
        (endGameDataSnapshot.winner === "AI Opponent" || 
         (!gameSessionSnapshot && endGameDataSnapshot.opponentScore !== undefined))) {
      // Likely an AI game if no game session or winner is AI
      setCurrentView("playingAI");
    } else {
      setCurrentView("matchmaking");
    }
    
    // Refresh user data after exiting end game screen
    setTimeout(async () => {
      try {
        await refreshUserData();
      } catch (error) {
        // Silently handle error
      }
    }, 500);
  };

  // Exit to menu
  const handleExit = async () => {
    setEndGameData(null);
    setGameSession(null);
    setSpectatorGame(null);
    setCurrentView("menu");
    
    // Refresh user data after exiting end game screen
    setTimeout(async () => {
      try {
        await refreshUserData();
      } catch (error) {
        // Silently handle error
      }
    }, 500);
  };

  // Handle ESC key to navigate back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        switch (currentView) {
          case "matchmaking":
            cancelMatchmaking();
            break;
          case "playing":
            handleDisconnect();
            break;
          case "playingAI":
            setCurrentView("menu");
            break;
          case "spectating":
            if (spectatorGame) {
              setSpectatorGame(null);
            }
            setCurrentView("menu");
            break;
          case "endGame":
            handleExit();
            break;
          default:
            // Do nothing in menu view
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentView, spectatorGame, handleDisconnect, cancelMatchmaking, handleExit]);

  if (!user) {
  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center w-full text-center">
      <h1 className="text-white text-2xl font-bold">
          Please log in to play
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-start w-full text-white font-primary px-4 sm:px-6 md:px-8 py-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-btn/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary-btn/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary-btn/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-secondary bg-gradient-to-r from-[#00FFFF] via-white to-[#FF6B00] bg-clip-text text-transparent mb-4 drop-shadow-4xl" style={{
            backgroundImage: 'linear-gradient(to right, #00FFFF, #FFFFFF, #FF6B00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Pong Game
      </h1>
          <p className="text-white/70 text-lg font-primary">
            Challenge players and compete in real-time matches
          </p>
        </div>

        {/* Menu View */}
        {currentView === "menu" && (
          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
              <div className="bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-btn/30 shadow-2xl hover:border-primary-btn/50 transition-all group relative overflow-hidden">
                {/* Decorative gradient border on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-btn/20 via-secondary-btn/20 to-primary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
                <div className="text-center relative z-10">
                  <div className="mb-4">
                    <MdPlayArrow className="text-primary-btn mx-auto group-hover:scale-110 transition-transform duration-300" size={64} />
                  </div>
                  <h2 className="text-2xl font-bold font-secondary mb-4 text-white">
                    Quick Match
                  </h2>
                  <p className="text-white/70 mb-6 font-primary">
                    Find an opponent and start playing immediately
                  </p>
                  <PrimaryButton
                    func={startMatchmaking}
                    props={{ children: "Find Match" }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-btn/30 shadow-2xl hover:border-primary-btn/50 transition-all group relative overflow-hidden">
                {/* Decorative gradient border on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-btn/20 via-secondary-btn/20 to-primary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
                <div className="text-center relative z-10">
                  <div className="mb-4">
                    <MdSmartToy className="text-secondary-btn mx-auto group-hover:scale-110 transition-transform duration-300" size={64} />
                  </div>
                  <h2 className="text-2xl font-bold font-secondary mb-4 text-white">
                    VS AI
                  </h2>
                  <p className="text-white/70 mb-6 font-primary">
                    Practice against AI opponent (Hard Mode)
                  </p>
                  <SecondaryButton
                    func={startAIGame}
                    props={{ children: "Play VS AI" }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-elements/90 to-primary-elements/70 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-btn/30 shadow-2xl hover:border-primary-btn/50 transition-all group relative overflow-hidden">
                {/* Decorative gradient border on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-btn/20 via-secondary-btn/20 to-primary-btn/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
                <div className="text-center relative z-10">
                  <div className="mb-4">
                    <MdVisibility className="text-secondary-btn mx-auto group-hover:scale-110 transition-transform duration-300" size={64} />
                  </div>
                  <h2 className="text-2xl font-bold font-secondary mb-4 text-white">
                    Spectate
                  </h2>
                  <p className="text-white/70 mb-6 font-primary">
                    Watch live games from other players
                  </p>
                  <SecondaryButton
                    func={() => setCurrentView("spectating")}
                    props={{ children: "View Live Games" }}
                  />
                </div>
              </div>
            </div>

            {/* Game Rules */}
            <div className="mt-8 bg-gradient-to-br from-primary-elements/50 to-primary-elements/30 backdrop-blur-xl p-6 rounded-xl border border-primary-btn/20 max-w-2xl w-full">
              <h3 className="text-xl font-bold font-secondary mb-4 text-primary-btn">
                How to Play
              </h3>
              <ul className="space-y-2 text-white/80 font-primary text-left">
                <li className="flex items-start gap-2">
                  <span className="text-primary-btn font-bold">•</span>
                  <span>
                    Use <kbd className="px-2 py-1 bg-primary-bg/50 rounded border border-primary-btn/30">↑</kbd>{" "}
                    <kbd className="px-2 py-1 bg-primary-bg/50 rounded border border-primary-btn/30">↓</kbd> or{" "}
                    <kbd className="px-2 py-1 bg-primary-bg/50 rounded border border-primary-btn/30">W</kbd>{" "}
                    <kbd className="px-2 py-1 bg-primary-bg/50 rounded border border-primary-btn/30">S</kbd> to move your paddle
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-btn font-bold">•</span>
                  <span>First player to reach 11 points wins</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-btn font-bold">•</span>
                  <span>The game handles disconnections and lags automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-btn font-bold">•</span>
                  <span>You can reconnect if disconnected during a match</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Matchmaking View */}
        {currentView === "matchmaking" && socket && (
          <MatchmakingQueue
            onMatchFound={handleMatchFound}
            onCancel={cancelMatchmaking}
            socket={socket}
          />
        )}

        {/* Playing View */}
        {currentView === "playing" && gameSession && socket && (
          <div className="flex flex-col items-center">
            <PongGame
              gameId={gameSession.gameId}
              playerId={user.id}
              opponentId={gameSession.opponentId}
              playerName={user.name || "Player"}
              opponentName={gameSession.opponentName}
              isPlayer1={gameSession.isPlayer1}
              onGameEnd={(winner, playerScore, opponentScore) => handleGameEnd(winner, playerScore, opponentScore, false)}
              onDisconnect={handleDisconnect}
              socket={socket}
              reconnectAttempts={reconnectAttempts}
            />
            <button
              onClick={handleDisconnect}
              className="mt-4 px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors font-primary"
            >
              Leave Game
            </button>
          </div>
        )}

        {/* AI Game View */}
        {currentView === "playingAI" && user && (
          <div className="flex flex-col items-center">
            <AIGame
              playerName={user.name || "Player"}
              aiName="AI Opponent"
              difficulty="hard"
              onGameEnd={(winner, playerScore, opponentScore) => handleGameEnd(winner, playerScore, opponentScore, true)}
              onDisconnect={() => setCurrentView("menu")}
            />
            <button
              onClick={() => setCurrentView("menu")}
              className="mt-4 px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors font-primary"
            >
              Leave Game
            </button>
          </div>
        )}

        {/* Spectating View */}
        {currentView === "spectating" && !spectatorGame && (
          <SpectatorMode
            onWatchGame={handleWatchGame}
            onClose={() => setCurrentView("menu")}
            socket={socket}
          />
        )}

        {/* Watching a specific game */}
        {currentView === "spectating" && spectatorGame && socket && (
          <div className="flex flex-col items-center">
            <SpectatorGame
              gameId={spectatorGame.gameId}
              player1Name={spectatorGame.player1Name}
              player2Name={spectatorGame.player2Name}
              onClose={() => {
                setSpectatorGame(null);
                setCurrentView("menu");
              }}
              socket={socket}
            />
          </div>
        )}

        {/* End Game View */}
        {currentView === "endGame" && endGameData && (
          <EndGameScreen
            winner={endGameData.winner}
            playerScore={endGameData.playerScore}
            opponentScore={endGameData.opponentScore}
            playerName={user.name || "Player"}
            opponentName={gameSession?.opponentName || "AI Opponent"}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}
