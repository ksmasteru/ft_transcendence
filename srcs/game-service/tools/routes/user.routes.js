import prisma from "../conf/db.js";

export default async function userRouter(fastify, opts) {
  // Get match history for the authenticated user
  fastify.get("/match-history", async (request, reply) => {
    try {
      const userId = request.headers["x-user-id"];

      if (!userId) {
        return reply
          .code(401)
          .send({ error: "Unauthorized: User ID not provided by gateway." });
      }

      const limit = parseInt(request.query.limit) || 10;

      // Get matches where user is either player1 or player2
      const matches = await prisma.matchHistory.findMany({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId },
          ],
        },
        include: {
          player1: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          player2: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      // Transform matches to include opponent info and determine if user won
      const matchHistory = matches.map((match) => {
        const isPlayer1 = match.player1Id === userId;
        const opponent = isPlayer1 ? match.player2 : match.player1;
        const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
        const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
        const isWinner = match.winnerId === userId;

        return {
          id: match.id,
          gameId: match.gameId,
          opponentId: opponent.id,
          opponentName: opponent.name,
          opponentAvatar: opponent.avatar,
          playerScore,
          opponentScore,
          isWinner,
          createdAt: match.createdAt,
        };
      });

      return reply.code(200).send({
        success: true,
        data: matchHistory,
      });
    } catch (error) {
      console.error("Error fetching match history:", error);
      return reply.code(500).send({
        success: false,
        error: "An error occurred while fetching match history.",
        details: error.message,
      });
    }
  });
}

