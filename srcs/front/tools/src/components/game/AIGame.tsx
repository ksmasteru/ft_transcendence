import { useEffect, useRef, useState, useCallback } from "react";

interface GameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  player1Y: number;
  player2Y: number;
  player1Score: number;
  player2Score: number;
  isPaused: boolean;
  isGameOver: boolean;
  winner: string | null;
}

interface AIGameProps {
  playerName: string;
  aiName?: string;
  difficulty?: "easy" | "medium" | "hard";
  onGameEnd: (winner: string, playerScore: number, opponentScore: number) => void;
  onDisconnect: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BOOSTED_PADDLE_SPEED = 7.5; // 1.5x speed when 1 minute or less remains
const INITIAL_BALL_SPEED = 4;
const WINNING_SCORE = 11;
const GAME_UPDATE_INTERVAL = 16; // ~60 FPS
const GAME_DURATION = 120000; // 2 minutes in milliseconds
const SPEED_INCREASE_INTERVAL = 10000; // 10 seconds in milliseconds
const SPEED_MULTIPLIER_INCREMENT = 0.3; // Increase speed by 30% each interval
const PADDLE_BOOST_TIME = 60000; // Boost paddle speed when 1 minute or less remains

// AI difficulty settings
const AI_DIFFICULTY = {
  easy: { reactionSpeed: 0.3, errorRate: 0.3, maxSpeed: 3 },
  medium: { reactionSpeed: 0.6, errorRate: 0.15, maxSpeed: 4 },
  hard: { reactionSpeed: 0.9, errorRate: 0.05, maxSpeed: 5 },
};

export function AIGame({
  playerName,
  aiName = "AI Opponent",
  difficulty = "medium",
  onGameEnd,
  onDisconnect,
}: AIGameProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const gameEndedRef = useRef(false);
  const gameStartTimeRef = useRef<number | null>(null);
  const speedMultiplierRef = useRef<number>(1);
  const lastSpeedIncreaseRef = useRef<number>(0);
  
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  
  const aiSettings = AI_DIFFICULTY[difficulty];
  
  const initialGameState: GameState = {
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVelocityX: INITIAL_BALL_SPEED,
    ballVelocityY: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
    player1Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player2Y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    player1Score: 0,
    player2Score: 0,
    isPaused: false,
    isGameOver: false,
    winner: null,
  };

  const gameStateRef = useRef<GameState>(initialGameState);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Update ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keysPressed.current.add("up");
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keysPressed.current.add("down");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keysPressed.current.delete("up");
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keysPressed.current.delete("down");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Timer and speed increase effect
  useEffect(() => {
    if (gameState.isGameOver || !gameStartTimeRef.current) return;

    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - (gameStartTimeRef.current || 0);
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeRemaining(remaining);

      // Calculate speed multiplier based on elapsed time
      const intervalsPassed = Math.floor(elapsed / SPEED_INCREASE_INTERVAL);
      const newMultiplier = 1 + intervalsPassed * SPEED_MULTIPLIER_INCREMENT;
      
      if (newMultiplier !== speedMultiplierRef.current && intervalsPassed > lastSpeedIncreaseRef.current) {
        speedMultiplierRef.current = newMultiplier;
        lastSpeedIncreaseRef.current = intervalsPassed;
        
        // Update ball velocity with new speed
        setGameState((prev) => ({
          ...prev,
          ballVelocityX: (prev.ballVelocityX > 0 ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED) * newMultiplier,
          ballVelocityY: prev.ballVelocityY * (newMultiplier / (newMultiplier - SPEED_MULTIPLIER_INCREMENT || 1)),
        }));
      }

      // End game when timer reaches 0
      if (remaining <= 0 && !gameEndedRef.current) {
        gameEndedRef.current = true;
        const currentState = gameStateRef.current;
        const winner = currentState.player1Score > currentState.player2Score 
          ? playerName 
          : currentState.player2Score > currentState.player1Score 
          ? aiName 
          : "Draw";
        
        setGameState((prev) => ({
          ...prev,
          isGameOver: true,
          winner: winner === "Draw" ? null : winner,
        }));
        
        setTimeout(() => {
          onGameEnd(winner, currentState.player1Score, currentState.player2Score);
        }, 500);
      }
    }, 100); // Update every 100ms for smooth timer

    return () => clearInterval(timerInterval);
  }, [gameState.isGameOver, playerName, aiName, onGameEnd]);

  // Initialize game start time
  useEffect(() => {
    if (!gameState.isGameOver && !gameStartTimeRef.current) {
      gameStartTimeRef.current = Date.now();
      speedMultiplierRef.current = 1;
      lastSpeedIncreaseRef.current = 0;
      setTimeRemaining(GAME_DURATION);
    }
  }, [gameState.isGameOver]);

  // Game update logic
  const updateGame = useCallback(() => {
    const currentState = gameStateRef.current;
    
    if (currentState.isGameOver || currentState.isPaused) {
      return;
    }

    // Get current time remaining for paddle speed boost
    const elapsed = gameStartTimeRef.current ? Date.now() - (gameStartTimeRef.current || 0) : GAME_DURATION;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    const currentPaddleSpeed = remaining <= PADDLE_BOOST_TIME ? BOOSTED_PADDLE_SPEED : PADDLE_SPEED;

    // Update ball position (velocity already includes speed multiplier)
    let newBallX = currentState.ballX + currentState.ballVelocityX;
    let newBallY = currentState.ballY + currentState.ballVelocityY;
    let newBallVelX = currentState.ballVelocityX;
    let newBallVelY = currentState.ballVelocityY;

    // Ball collision with top/bottom walls
    if (newBallY - BALL_SIZE <= 0) {
      newBallY = BALL_SIZE;
      newBallVelY = Math.abs(newBallVelY);
    } else if (newBallY + BALL_SIZE >= CANVAS_HEIGHT) {
      newBallY = CANVAS_HEIGHT - BALL_SIZE;
      newBallVelY = -Math.abs(newBallVelY);
    }

    // Update player paddle position based on input
    let newPlayer1Y = currentState.player1Y;
    if (keysPressed.current.has("up")) {
      newPlayer1Y = Math.max(0, newPlayer1Y - currentPaddleSpeed);
    }
    if (keysPressed.current.has("down")) {
      newPlayer1Y = Math.min(
        CANVAS_HEIGHT - PADDLE_HEIGHT,
        newPlayer1Y + currentPaddleSpeed
      );
    }

    // Ball collision with left paddle (player)
    const paddle1Left = 10;
    const paddle1Right = paddle1Left + PADDLE_WIDTH;
    const paddle1Top = newPlayer1Y;
    const paddle1Bottom = newPlayer1Y + PADDLE_HEIGHT;

    if (
      newBallVelX < 0 &&
      newBallX - BALL_SIZE <= paddle1Right &&
      newBallX - BALL_SIZE >= paddle1Left - 5 &&
      newBallY + BALL_SIZE >= paddle1Top &&
      newBallY - BALL_SIZE <= paddle1Bottom
    ) {
      newBallX = paddle1Right + BALL_SIZE;
      const speedMultiplier = speedMultiplierRef.current;
      newBallVelX = Math.abs(INITIAL_BALL_SPEED * speedMultiplier);
      const hitPos = Math.max(0, Math.min(1, (newBallY - paddle1Top) / PADDLE_HEIGHT));
      newBallVelY = (hitPos - 0.5) * INITIAL_BALL_SPEED * speedMultiplier * 2;
      newBallVelY = Math.max(
        -INITIAL_BALL_SPEED * speedMultiplier * 1.5,
        Math.min(INITIAL_BALL_SPEED * speedMultiplier * 1.5, newBallVelY)
      );
    }

    // AI paddle movement - track the ball with difficulty adjustments
    // Boost AI paddle speed when 1 minute or less remains (same as player)
    const aiPaddleSpeed = remaining <= PADDLE_BOOST_TIME ? aiSettings.maxSpeed * 1.5 : aiSettings.maxSpeed;
    let newPlayer2Y = currentState.player2Y;
    const aiPaddleCenter = newPlayer2Y + PADDLE_HEIGHT / 2;
    const targetY = newBallY;
    const distance = targetY - aiPaddleCenter;

    // Add reaction delay and error based on difficulty
    if (Math.abs(distance) > 2) {
      const speed = aiPaddleSpeed * aiSettings.reactionSpeed;
      let movement = distance * speed;
      
      // Add error (imperfection) to AI
      if (Math.random() < aiSettings.errorRate) {
        movement += (Math.random() - 0.5) * 20;
      }
      
      movement = Math.max(-aiPaddleSpeed, Math.min(aiPaddleSpeed, movement));
      newPlayer2Y += movement;
      newPlayer2Y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, newPlayer2Y));
    }

    // Ball collision with right paddle (AI)
    const paddle2Right = CANVAS_WIDTH - 10;
    const paddle2Left = paddle2Right - PADDLE_WIDTH;
    const paddle2Top = newPlayer2Y;
    const paddle2Bottom = newPlayer2Y + PADDLE_HEIGHT;

    if (
      newBallVelX > 0 &&
      newBallX + BALL_SIZE >= paddle2Left &&
      newBallX + BALL_SIZE <= paddle2Right + 5 &&
      newBallY + BALL_SIZE >= paddle2Top &&
      newBallY - BALL_SIZE <= paddle2Bottom
    ) {
      newBallX = paddle2Left - BALL_SIZE;
      const speedMultiplier = speedMultiplierRef.current;
      newBallVelX = -Math.abs(INITIAL_BALL_SPEED * speedMultiplier);
      const hitPos = Math.max(0, Math.min(1, (newBallY - paddle2Top) / PADDLE_HEIGHT));
      newBallVelY = (hitPos - 0.5) * INITIAL_BALL_SPEED * speedMultiplier * 2;
      newBallVelY = Math.max(
        -INITIAL_BALL_SPEED * speedMultiplier * 1.5,
        Math.min(INITIAL_BALL_SPEED * speedMultiplier * 1.5, newBallVelY)
      );
    }

    // Check for scoring
    let newPlayer1Score = currentState.player1Score;
    let newPlayer2Score = currentState.player2Score;
    let newIsGameOver = false;
    let newWinner: string | null = null;

    if (newBallX - BALL_SIZE < 0) {
      newPlayer2Score++;
      if (newPlayer2Score >= WINNING_SCORE) {
        newIsGameOver = true;
        newWinner = aiName;
      } else {
        // Reset ball with current speed multiplier
        const speedMultiplier = speedMultiplierRef.current;
        newBallX = CANVAS_WIDTH / 2;
        newBallY = CANVAS_HEIGHT / 2;
        newBallVelX = INITIAL_BALL_SPEED * speedMultiplier;
        newBallVelY = (Math.random() - 0.5) * INITIAL_BALL_SPEED * speedMultiplier;
      }
    } else if (newBallX + BALL_SIZE > CANVAS_WIDTH) {
      newPlayer1Score++;
      if (newPlayer1Score >= WINNING_SCORE) {
        newIsGameOver = true;
        newWinner = playerName;
      } else {
        // Reset ball with current speed multiplier
        const speedMultiplier = speedMultiplierRef.current;
        newBallX = CANVAS_WIDTH / 2;
        newBallY = CANVAS_HEIGHT / 2;
        newBallVelX = -INITIAL_BALL_SPEED * speedMultiplier;
        newBallVelY = (Math.random() - 0.5) * INITIAL_BALL_SPEED * speedMultiplier;
      }
    }

    const newGameState: GameState = {
      ballX: newBallX,
      ballY: newBallY,
      ballVelocityX: newBallVelX,
      ballVelocityY: newBallVelY,
      player1Y: newPlayer1Y,
      player2Y: newPlayer2Y,
      player1Score: newPlayer1Score,
      player2Score: newPlayer2Score,
      isPaused: currentState.isPaused,
      isGameOver: newIsGameOver,
      winner: newWinner,
    };

    setGameState(newGameState);
    gameStateRef.current = newGameState;

    // Handle game end
    if (newIsGameOver && !gameEndedRef.current) {
      gameEndedRef.current = true;
      setTimeout(() => {
        onGameEnd(newWinner || "Draw", newPlayer1Score, newPlayer2Score);
      }, 500);
    }
  }, [playerName, aiName, aiSettings, onGameEnd]);

  // Game loop
  useEffect(() => {
    if (gameState.isGameOver || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastUpdate = Date.now();

    const gameLoop = () => {
      const currentState = gameStateRef.current;

      if (currentState.isGameOver) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      const now = Date.now();
      if (now - lastUpdate >= GAME_UPDATE_INTERVAL) {
        updateGame();
        lastUpdate = now;
      }

      // Draw game with modern ping-pong style matching dashboard
      const tableGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      tableGradient.addColorStop(0, "#0C185A");
      tableGradient.addColorStop(0.5, "#0B0033");
      tableGradient.addColorStop(1, "#0C185A");
      ctx.fillStyle = tableGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Texture overlay
      ctx.fillStyle = "rgba(0, 255, 255, 0.03)";
      for (let i = 0; i < CANVAS_HEIGHT; i += 6) {
        ctx.fillRect(0, i, CANVAS_WIDTH, 1);
      }

      // Draw center line
      ctx.setLineDash([20, 20]);
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // Draw paddles
      const paddleGradient1 = ctx.createLinearGradient(
        10,
        currentState.player1Y,
        10 + PADDLE_WIDTH,
        currentState.player1Y + PADDLE_HEIGHT
      );
      paddleGradient1.addColorStop(0, "#00FFFF");
      paddleGradient1.addColorStop(0.5, "#00E5E5");
      paddleGradient1.addColorStop(1, "#00CCCC");

      const paddleGradient2 = ctx.createLinearGradient(
        CANVAS_WIDTH - 10 - PADDLE_WIDTH,
        currentState.player2Y,
        CANVAS_WIDTH - 10,
        currentState.player2Y + PADDLE_HEIGHT
      );
      paddleGradient2.addColorStop(0, "#FF6B00");
      paddleGradient2.addColorStop(0.5, "#FF8500");
      paddleGradient2.addColorStop(1, "#FF9F00");

      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0, 255, 255, 0.6)";
      ctx.fillStyle = paddleGradient1;
      ctx.fillRect(10, currentState.player1Y, PADDLE_WIDTH, PADDLE_HEIGHT);

      ctx.shadowColor = "rgba(255, 107, 0, 0.6)";
      ctx.fillStyle = paddleGradient2;
      ctx.fillRect(
        CANVAS_WIDTH - 10 - PADDLE_WIDTH,
        currentState.player2Y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(10, currentState.player1Y, 2, PADDLE_HEIGHT);
      ctx.fillRect(
        CANVAS_WIDTH - 10 - 2,
        currentState.player2Y,
        2,
        PADDLE_HEIGHT
      );

      // Draw ball
      const ballGradient = ctx.createRadialGradient(
        currentState.ballX - 3,
        currentState.ballY - 3,
        0,
        currentState.ballX,
        currentState.ballY,
        BALL_SIZE
      );
      ballGradient.addColorStop(0, "#FFFFFF");
      ballGradient.addColorStop(0.7, "#F5F5F5");
      ballGradient.addColorStop(1, "#E0E0E0");

      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(currentState.ballX, currentState.ballY, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(currentState.ballX - 3, currentState.ballY - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw scores
      ctx.fillStyle = "#00FFFF";
      ctx.font = "bold 64px Oswald, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(0, 255, 255, 0.6)";
      ctx.fillText(
        (currentState.player1Score ?? 0).toString(),
        CANVAS_WIDTH / 4,
        70
      );

      ctx.fillStyle = "#FF6B00";
      ctx.shadowColor = "rgba(255, 107, 0, 0.6)";
      ctx.fillText(
        (currentState.player2Score ?? 0).toString(),
        (3 * CANVAS_WIDTH) / 4,
        70
      );
      ctx.shadowBlur = 0;

      // Draw player names
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 18px Kanit, sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.95;
      ctx.fillText(playerName, CANVAS_WIDTH / 4, 100);
      ctx.fillText(aiName, (3 * CANVAS_WIDTH) / 4, 100);
      ctx.globalAlpha = 1.0;

      // Draw timer
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      ctx.fillStyle = timeRemaining < 10000 ? "#FF4444" : "#FFD700"; // Red when less than 10 seconds
      ctx.font = "bold 32px Oswald, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowBlur = 10;
      ctx.shadowColor = timeRemaining < 10000 ? "rgba(255, 68, 68, 0.8)" : "rgba(255, 215, 0, 0.8)";
      ctx.fillText(timeString, CANVAS_WIDTH / 2, 40);
      ctx.shadowBlur = 0;

      // Draw game over overlay
      if (currentState.isGameOver) {
        ctx.fillStyle = "rgba(11, 0, 51, 0.85)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#00FFFF";
        ctx.font = "bold 48px Oswald, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(0, 255, 255, 0.6)";
        ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        ctx.shadowBlur = 0;
        
        if (currentState.winner) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "400 24px Kanit, sans-serif";
          ctx.globalAlpha = 0.9;
          ctx.fillText(
            `${currentState.winner} Wins!`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 20
          );
          ctx.globalAlpha = 1.0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameState.isGameOver, playerName, aiName, updateGame, timeRemaining]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-primary-btn/30 rounded-lg shadow-2xl"
          style={{
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          }}
        />
        <div className="absolute top-4 left-4 bg-primary-elements/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary-btn/30 font-secondary font-bold bg-gradient-to-r from-[#00FFFF] via-white to-[#FF6B00] bg-clip-text text-transparent">
          VS AI ({difficulty.toUpperCase()})
        </div>
        {timeRemaining > 0 && (
          <div className={`absolute top-4 right-4 bg-primary-elements/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary-btn/30 font-secondary font-bold ${
            timeRemaining < 10000 ? 'text-red-500' : 'text-yellow-400'
          }`}>
            {Math.floor(timeRemaining / 60000)}:{(Math.floor((timeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
          </div>
        )}
      </div>
      <div className="text-white text-sm font-primary">
        <p className="text-center">
          <span className="text-primary-btn font-bold">Controls:</span> Use{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            ↑
          </kbd>{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            ↓
          </kbd>{" "}
          or{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            W
          </kbd>{" "}
          <kbd className="px-2 py-1 bg-primary-elements rounded border border-primary-btn">
            S
          </kbd>{" "}
          to move your paddle
        </p>
      </div>
    </div>
  );
}

