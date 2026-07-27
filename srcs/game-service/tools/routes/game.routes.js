export default async function gameRouter(fastify, opts) {
  // Get live games list
  fastify.get("/live", async (request, reply) => {
    const gameManager = fastify.gameManager;
    const liveGames = [];

    // Get all active games from GameManager
    gameManager.games.forEach((game, gameId) => {
      if (!game.isGameOver) {
        liveGames.push({
          gameId,
          player1Id: game.player1.userId,
          player1Name: game.player1.userName,
          player2Id: game.player2.userId,
          player2Name: game.player2.userName,
          player1Score: game.player1Score,
          player2Score: game.player2Score,
          startedAt: new Date().toISOString(), // You might want to track actual start time
        });
      }
    });

    return {
      success: true,
      data: liveGames,
    };
  });
}

