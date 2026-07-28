import { WebSocketServer } from "ws";
import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { GameManager } from "./game/GameManager.js";
import gameRouter from "./routes/game.routes.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();

const WS_PORT = Number(process.env.WS_PORT) || 9090;
const HTTP_PORT = Number(process.env.HTTP_PORT) || 4003;
const HOST = process.env.HOST || "0.0.0.0";
const FRONTEND_URL = process.env.FRONTEND_URL;

// Create Fastify HTTP server for REST API
const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests from localhost or any IP address on ports 8080 or 3000
    // (local dev), or the deployed frontend's own origin (e.g. Railway's public URL).
    if (
      !origin ||
      origin.includes(':8080') ||
      origin.includes(':3000') ||
      (FRONTEND_URL && origin === FRONTEND_URL)
    ) {
      cb(null, true);
      return;
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Make gameManager available to routes
const gameManager = new GameManager();
fastify.decorate("gameManager", gameManager);

fastify.register(gameRouter, { prefix: "/api/v1/games" });
fastify.register(userRouter, { prefix: "/api/v1/user" });

// WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT, host: HOST });

console.log(`🎮 Game WebSocket Server starting on ws://${HOST}:${WS_PORT}`);

wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection");

  let userId = null;
  let userName = null;
  let authenticated = false;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "authenticate":
          userId = data.userId;
          userName = data.userName;
          authenticated = true;
          
          // Check if user was in a game and reconnect them
          const existingUser = gameManager.users.get(userId);
          if (existingUser && existingUser.gameId) {
            // Reconnecting to existing game
            existingUser.ws = ws;
            const game = gameManager.games.get(existingUser.gameId);
            if (game && !game.isGameOver) {
              if (game.isPaused && game.pauseReason === "Opponent disconnected. Waiting for reconnection...") {
                game.isPaused = false;
                game.pauseReason = null;
                if (game.disconnectTimeout) {
                  clearTimeout(game.disconnectTimeout);
                  game.disconnectTimeout = null;
                }
                
                // Notify opponent
                const opponentId =
                  game.player1.userId === userId
                    ? game.player2.userId
                    : game.player1.userId;
                const opponent = gameManager.users.get(opponentId);
                if (opponent && opponent.ws && opponent.ws.readyState === 1) {
                  opponent.ws.send(
                    JSON.stringify({
                      type: "opponent_reconnected",
                      gameId: existingUser.gameId,
                    })
                  );
                }
              }
              
              // Send current game state update
              try {
                ws.send(
                  JSON.stringify({
                    type: "game_state",
                    gameId: existingUser.gameId,
                    ballX: game.ballX,
                    ballY: game.ballY,
                    ballVelocityX: game.ballVelocityX,
                    ballVelocityY: game.ballVelocityY,
                    player1Y: game.player1Y,
                    player2Y: game.player2Y,
                    player1Score: game.player1Score,
                    player2Score: game.player2Score,
                    isPaused: game.isPaused,
                    isGameOver: game.isGameOver,
                    pauseReason: game.pauseReason,
                  })
                );
              } catch (err) {
                console.error(`Error sending game state to reconnected user:`, err);
              }
            }
          } else {
            gameManager.addUser(ws, userId, userName);
          }
          
          ws.send(
            JSON.stringify({
              type: "authenticated",
              message: "Successfully authenticated",
            })
          );
          break;

        case "join_queue":
          if (!authenticated) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Please authenticate first",
              })
            );
            return;
          }
          gameManager.joinQueue(userId, userName);
          break;

        case "leave_queue":
          if (authenticated) {
            gameManager.leaveQueue(userId);
          }
          break;

        case "leave_game":
          if (authenticated && userId && data.gameId) {
            gameManager.leaveGame(data.gameId, userId);
          }
          break;

        case "paddle_move":
          if (authenticated && userId && data.gameId && typeof data.paddleY === 'number') {
            gameManager.updatePaddlePosition(
              data.gameId,
              userId,
              data.paddleY
            );
          }
          break;

        case "spectate_game":
          if (authenticated && userId) {
            gameManager.addSpectator(data.gameId, ws, userId);
          }
          break;

        case "stop_spectating":
          if (authenticated && userId) {
            gameManager.removeSpectator(data.gameId, userId);
          }
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
    if (authenticated && userId) {
      gameManager.handleDisconnect(userId);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Start HTTP server
const startHttpServer = async () => {
  try {
    await fastify.listen({ port: HTTP_PORT, host: HOST });
    fastify.log.info(`🚀 HTTP Server running at http://${HOST}:${HTTP_PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startHttpServer();

console.log(`✅ Game WebSocket Server running on ws://${HOST}:${WS_PORT}`);

