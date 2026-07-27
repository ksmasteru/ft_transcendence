import { useEffect, useRef, useState } from "react";

interface GameState {
  ballX: number;
  ballY: number;
  player1Y: number;
  player2Y: number;
  player1Score: number;
  player2Score: number;
  isPaused: boolean;
  isGameOver: boolean;
}

interface SpectatorGameProps {
  gameId: string;
  player1Name: string;
  player2Name: string;
  onClose: () => void;
  socket: WebSocket | null;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;

export function SpectatorGame({
  gameId,
  player1Name,
  player2Name,
  onClose,
  socket,
}: SpectatorGameProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    player1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player1Score: 0,
    player2Score: 0,
    isPaused: false,
    isGameOver: false,
  });

  // Handle WebSocket messages for spectator
  useEffect(() => {
    if (!socket) return;

    // Join as spectator
    socket.send(
      JSON.stringify({
        type: "spectate_game",
        gameId,
        timestamp: Date.now(),
      })
    );

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "game_state" && data.gameId === gameId) {
          setGameState({
            ballX: data.ballX ?? CANVAS_WIDTH / 2,
            ballY: data.ballY ?? CANVAS_HEIGHT / 2,
            player1Y: data.player1Y ?? CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            player2Y: data.player2Y ?? CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            player1Score: data.player1Score ?? 0,
            player2Score: data.player2Score ?? 0,
            isPaused: data.isPaused || false,
            isGameOver: data.isGameOver || false,
          });
        } else if (data.type === "game_ended" && data.gameId === gameId) {
          setGameState((prev) => ({
            ...prev,
            isGameOver: true,
            player1Score: data.player1Score ?? prev.player1Score ?? 0,
            player2Score: data.player2Score ?? prev.player2Score ?? 0,
          }));
        }
      } catch (error) {
        console.error("Error parsing spectator message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "stop_spectating",
            gameId,
            timestamp: Date.now(),
          })
        );
      }
    };
  }, [socket, gameId]);

  // Game rendering loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = "#0B0033";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw paddles
      ctx.fillStyle = "#00FFFF";
      ctx.fillRect(10, gameState.player1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(
        CANVAS_WIDTH - 10 - PADDLE_WIDTH,
        gameState.player2Y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball
      ctx.fillStyle = "#FF6B00";
      ctx.beginPath();
      ctx.arc(gameState.ballX, gameState.ballY, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Draw scores
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "48px Oswald";
      ctx.textAlign = "center";
      ctx.fillText((gameState.player1Score ?? 0).toString(), CANVAS_WIDTH / 4, 60);
      ctx.fillText(
        (gameState.player2Score ?? 0).toString(),
        (3 * CANVAS_WIDTH) / 4,
        60
      );

      // Draw player names
      ctx.font = "20px Kanit";
      ctx.fillText(player1Name, CANVAS_WIDTH / 4, 90);
      ctx.fillText(player2Name, (3 * CANVAS_WIDTH) / 4, 90);

      // Draw pause overlay
      if (gameState.isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "36px Oswald";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      // Draw game over overlay
      if (gameState.isGameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "36px Oswald";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, player1Name, player2Name]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-primary-btn rounded-lg shadow-2xl"
        />
        <div className="absolute top-4 left-4 bg-primary-elements/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary-btn/30 font-secondary font-bold bg-gradient-to-r from-[#00FFFF] via-white to-[#FF6B00] bg-clip-text text-transparent">
          Spectating
        </div>
      </div>
      <button
        onClick={onClose}
        className="px-6 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors font-primary"
      >
        Stop Watching
      </button>
    </div>
  );
}

