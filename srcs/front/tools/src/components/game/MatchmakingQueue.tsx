import { useEffect, useState, useRef, useCallback } from "react";
import { MdClose, MdSportsEsports } from "react-icons/md";

interface MatchmakingQueueProps {
  onMatchFound: (gameId: string, opponentId: string, opponentName: string, isPlayer1: boolean) => void;
  onCancel: () => void;
  socket: WebSocket | null;
}

export function MatchmakingQueue({
  onMatchFound,
  onCancel,
  socket,
}: MatchmakingQueueProps): JSX.Element {
  const [queueTime, setQueueTime] = useState(0);
  const [isSearching, setIsSearching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasJoinedQueue = useRef(false);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const joinQueue = useCallback(() => {
    if (!socket) {
      setError("No connection to server");
      return;
    }

    if (socket.readyState === WebSocket.CONNECTING) {
      // Wait for connection
      const checkConnection = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          joinQueue();
        } else if (socket.readyState === WebSocket.CLOSED) {
          clearInterval(checkConnection);
          setError("Connection closed. Please try again.");
        }
      }, 100);
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      setError("Connection not ready. Please try again.");
      return;
    }

    try {
      socket.send(
        JSON.stringify({
          type: "join_queue",
          timestamp: Date.now(),
        })
      );
      hasJoinedQueue.current = true;
      setError(null);
    } catch (err) {
      console.error("Error joining queue:", err);
      setError("Failed to join queue. Please try again.");
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Set up message handler
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "match_found") {
          setIsSearching(false);
          hasJoinedQueue.current = false;
          if (messageHandlerRef.current) {
            socket.removeEventListener("message", messageHandlerRef.current);
          }
          onMatchFound(data.gameId, data.opponentId, data.opponentName, data.isPlayer1);
        } else if (data.type === "error") {
          setError(data.message || "An error occurred");
          if (data.message?.includes("already in a game")) {
            setIsSearching(false);
          }
        } else if (data.type === "queue_update") {
          // Queue status update - user is in queue
          setError(null);
        } else if (data.type === "authenticated") {
          // After authentication, join queue
          if (!hasJoinedQueue.current) {
            setTimeout(() => joinQueue(), 100);
          }
        }
      } catch (error) {
        console.error("Error parsing matchmaking message:", error);
      }
    };

    messageHandlerRef.current = handleMessage;
    socket.addEventListener("message", handleMessage);

    // Join queue if socket is ready, otherwise wait for authentication
    if (socket.readyState === WebSocket.OPEN) {
      // Small delay to ensure authentication message is processed first
      const checkAuth = setTimeout(() => {
        if (!hasJoinedQueue.current) {
          joinQueue();
        }
      }, 500);
      
      return () => {
        clearTimeout(checkAuth);
        if (messageHandlerRef.current) {
          socket.removeEventListener("message", messageHandlerRef.current);
        }
      };
    }

    return () => {
      if (messageHandlerRef.current) {
        socket.removeEventListener("message", messageHandlerRef.current);
      }
    };
  }, [socket, joinQueue, onMatchFound]);

  // Retry joining queue if connection becomes ready
  useEffect(() => {
    if (!socket || hasJoinedQueue.current) return undefined;

    const checkAndJoin = () => {
      if (socket.readyState === WebSocket.OPEN && !hasJoinedQueue.current) {
        joinQueue();
      }
    };

    if (socket.readyState === WebSocket.OPEN) {
      checkAndJoin();
      return undefined;
    } else {
      socket.addEventListener("open", checkAndJoin);
      return () => {
        socket.removeEventListener("open", checkAndJoin);
      };
    }
  }, [socket, joinQueue]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socket && socket.readyState === WebSocket.OPEN && hasJoinedQueue.current) {
        try {
          socket.send(
            JSON.stringify({
              type: "leave_queue",
              timestamp: Date.now(),
            })
          );
        } catch (err) {
          console.error("Error leaving queue:", err);
        }
      }
      hasJoinedQueue.current = false;
    };
  }, [socket]);

  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setQueueTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-primary-elements/95 to-primary-elements/85 backdrop-blur-xl p-8 rounded-2xl border-2 border-primary-btn/30 shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-secondary flex items-center gap-2 bg-gradient-to-r from-[#00FFFF] via-white to-[#FF6B00] bg-clip-text text-transparent">
            <MdSportsEsports className="text-primary-btn" size={28} />
            Finding Match...
          </h2>
          <button
            onClick={onCancel}
            className="text-white/70 hover:text-white transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-4 border-primary-btn/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-btn border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MdSportsEsports className="text-primary-btn" size={48} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-lg font-primary mb-2">
              Searching for opponent...
            </p>
            <p className="text-primary-btn text-2xl font-bold font-secondary">
              {formatTime(queueTime)}
            </p>
            {error && (
              <p className="text-red-400 text-sm mt-2 font-primary">
                {error}
              </p>
            )}
          </div>

          <div className="w-full bg-primary-bg/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-secondary-btn transition-all duration-300"
              style={{
                width: `${Math.min(100, (queueTime / 60) * 100)}%`,
              }}
            ></div>
          </div>

          <button
            onClick={onCancel}
            className="px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors font-primary"
          >
            Cancel Search
          </button>
        </div>
      </div>
    </div>
  );
}

