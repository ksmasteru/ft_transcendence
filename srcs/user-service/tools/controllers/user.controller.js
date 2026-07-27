import prisma from "../conf/db.js";
import bcrypt from "bcrypt";

export const getUsers = async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    return reply
      .code(200)
      .send({ message: "All users fetched successfully!", data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return reply
      .code(500)
      .send({
        error: "An error occurred while fetching users.",
        details: error.message,
      });
  }
};

export const userInfo = async (request, reply) => {
  try {
    const userId = request.headers["x-user-id"];

    if (!userId) {
      return reply
        .code(401)
        .send({ error: "Unauthorized: User ID not provided by gateway." });
    }

    const userWithProfileData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: { include: { achievement: true } },
        recentActivities: { orderBy: { createdAt: "desc" }, take: 5 },
        Games: { orderBy: { createdAt: "desc" }, take: 100 }, // Get game records for win count
      },
    });

    if (!userWithProfileData) {
      return reply.code(404).send({ error: "User not found." });
    }

    const medals = { gold: 0, silver: 0, bronze: 0 };
    let unlockedAchievementsCount = 0;

    // Transform achievements to include full achievement details
    const transformedAchievements = userWithProfileData.achievements?.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      tier: ua.achievement.tier,
      unlockedAt: ua.unlockedAt,
      count: ua.count ?? 1,
    })) || [];

    userWithProfileData.achievements?.forEach((ua) => {
      const tier = ua.achievement.tier.toLowerCase();
      const count = ua.count ?? 1;
      if (medals[tier] !== undefined) {
        medals[tier] += count;
        unlockedAchievementsCount += count;
      }
    });

    // Get total number of achievements available in the system
    const totalAchievements = await prisma.achievement.count();

    // Transform recent activities
    const transformedActivities = userWithProfileData.recentActivities?.map((activity) => ({
      id: activity.id,
      type: activity.type,
      text: activity.text,
      createdAt: activity.createdAt,
    })) || [];

    const { password, twoFactorSecret, achievements, recentActivities, ...user } = userWithProfileData;

    // Log user data to verify XP and level are included
    console.log(`[userInfo] Fetching user data for ${userId}:`, {
      xp: user.xp,
      level: user.level,
      totalWins: userWithProfileData.Games?.length || 0,
      unlockedAchievements: transformedAchievements.length,
      totalAchievements: totalAchievements,
    });

    const responseData = { 
      ...user, 
      achievements: transformedAchievements,
      recentActivities: transformedActivities,
      medals, 
      totalAchievements,
      Games: userWithProfileData.Games || [], // Include Games array for win count
    };

    // Verify XP and level are in response
    if (responseData.xp === undefined || responseData.level === undefined) {
      console.error(`[userInfo] WARNING: XP or level missing in response! XP: ${responseData.xp}, Level: ${responseData.level}`);
    }

    return reply
      .code(200)
      .send({ 
        data: responseData
      });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};

export const getUser = async (request, reply) => {
  try {
    const { id } = request.params;

    const userWithProfileData = await prisma.user.findUnique({
      where: { id },
      include: {
        achievements: { include: { achievement: true } },
        recentActivities: { orderBy: { createdAt: "desc" }, take: 5 },
        Games: { orderBy: { createdAt: "desc" }, take: 100 }, // Get game records for win count
      },
    });

    if (!userWithProfileData) {
      return reply.code(404).send({ message: `User with ID ${id} not found.` });
    }

    const medals = { gold: 0, silver: 0, bronze: 0 };
    let unlockedAchievementsCount = 0;

    // Transform achievements to include full achievement details
    const transformedAchievements = userWithProfileData.achievements?.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      tier: ua.achievement.tier,
      unlockedAt: ua.unlockedAt,
      count: ua.count ?? 1,
    })) || [];

    userWithProfileData.achievements?.forEach((ua) => {
      const tier = ua.achievement.tier.toLowerCase();
      const count = ua.count ?? 1;
      if (medals[tier] !== undefined) {
        medals[tier] += count;
        unlockedAchievementsCount += count;
      }
    });

    // Get total number of achievements available in the system
    const totalAchievements = await prisma.achievement.count();

    // Transform recent activities
    const transformedActivities = userWithProfileData.recentActivities?.map((activity) => ({
      id: activity.id,
      type: activity.type,
      text: activity.text,
      createdAt: activity.createdAt,
    })) || [];

    const { password, twoFactorSecret, achievements, recentActivities, ...user } = userWithProfileData;

    const responseData = { 
      ...user, 
      achievements: transformedAchievements,
      recentActivities: transformedActivities,
      medals, 
      totalAchievements,
      Games: userWithProfileData.Games || [], // Include Games array for win count
    };

    return reply
      .code(200)
      .send({
        message: `User with ID ${id} fetched successfully!`,
        data: responseData,
      });
  } catch (error) {
    console.error("Error fetching user:", error);
    return reply
      .code(500)
      .send({
        error: "An error occurred while fetching the user.",
        details: error.message,
      });
  }
};

export const leaderboard = async (req, reply) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ level: "desc" }, { xp: "desc" }],
    });
    return reply
      .code(200)
      .send({ message: "Leaderboard fetched successfully!", data: users });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return reply
      .code(500)
      .send({
        error: "An error occurred while fetching the leaderboard.",
        details: error.message,
      });
  }
};

export const searchUsersByName = async (request, reply) => {
  try {
    const { name } = request.query;
    if (!name)
      return reply
        .code(400)
        .send({ message: "Name query parameter is required." });

    const users = await prisma.user.findMany({
      where: { name: { startsWith: name.toLowerCase() } },
    });

    if (!users.length)
      return reply
        .code(404)
        .send({ message: `No users found starting with "${name}".` });

    return reply
      .code(200)
      .send({
        message: `Users starting with "${name}" fetched successfully!`,
        data: users,
      });
  } catch (error) {
    console.error("Error searching users:", error);
    return reply
      .code(500)
      .send({
        error: "An error occurred while searching for users.",
        details: error.message,
      });
  }
};

export const addUser = async (request, reply) => {
  try {
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : (request.body ?? {});
    const { name, email } = body;

    if (!name || !email)
      return reply.code(400).send({ error: "Name and email are required." });

    const newUser = await prisma.user.create({ data: { name, email } });
    return reply
      .code(201)
      .send({ message: "User created successfully!", data: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return reply.code(409).send({ error: "Email already in use." });
    }
    return reply
      .code(500)
      .send({
        error: "An error occurred while creating the user.",
        details: error.message,
      });
  }
};

export const updateUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : (request.body ?? {});
    const { name, email, password, avatar } = body;

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(avatar && { avatar }),
      },
    });

    return reply
      .code(200)
      .send({
        message: `User with ID ${id} updated successfully!`,
        data: updatedUser,
      });
  } catch (error) {
    console.error("Error updating user:", error);
    return reply
      .code(500)
      .send({
        error: "An error occurred while updating the user.",
        details: error.message,
      });
  }
};

export const deleteUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const deletedUser = await prisma.user.delete({ where: { id } });
    return reply
      .code(200)
      .send({
        message: `User with ID ${id} deleted successfully!`,
        data: deletedUser,
      });
  } catch (error) {
    console.error("Error deleting user:", error);
    return reply
      .code(500)
      .send({
        error: "An error occurred while deleting the user.",
        details: error.message,
      });
  }
};

// Game result handler - updates XP, achievements, and medals
// Get match history for a user
export const getMatchHistory = async (request, reply) => {
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
      error: "Failed to fetch match history.",
      details: error.message,
    });
  }
};

export const processGameResult = async (request, reply) => {
  try {
    const body =
      typeof request.body === "string"
        ? JSON.parse(request.body)
        : (request.body ?? {});
    
    const { winnerId, loserId, winnerScore, loserScore, gameId } = body;

    if (!winnerId || !loserId) {
      return reply.code(400).send({ 
        error: "Winner and loser IDs are required." 
      });
    }

    // XP values
    const WIN_XP = 50;  // Winner gains 50 XP
    const LOSS_XP = -20; // Loser loses 20 XP (minimum 0)

    // Update winner XP and level
    const winner = await prisma.user.findUnique({ where: { id: winnerId } });
    if (!winner) {
      return reply.code(404).send({ error: "Winner not found." });
    }

    console.log(`[processGameResult] Winner before update: ${winner.userName}, XP: ${winner.xp}, Level: ${winner.level}`);
    
    const newWinnerXP = Math.max(0, winner.xp + WIN_XP);
    const winnerLevel = Math.floor(newWinnerXP / 100) + 1; // 100 XP per level

    const updatedWinner = await prisma.user.update({
      where: { id: winnerId },
      data: {
        xp: newWinnerXP,
        level: winnerLevel,
      },
    });

    console.log(`[processGameResult] Winner after update: ${updatedWinner.userName}, XP: ${updatedWinner.xp}, Level: ${updatedWinner.level}`);
    
    // Verify the update was successful
    const verifyWinner = await prisma.user.findUnique({ where: { id: winnerId }, select: { xp: true, level: true } });
    if (verifyWinner.xp !== newWinnerXP || verifyWinner.level !== winnerLevel) {
      console.error(`[processGameResult] ERROR: Winner XP/Level mismatch! Expected XP: ${newWinnerXP}, Got: ${verifyWinner.xp}, Expected Level: ${winnerLevel}, Got: ${verifyWinner.level}`);
    } else {
      console.log(`[processGameResult] Verified: Winner XP and Level correctly updated in database`);
    }

    // Update loser XP (can't go below 0)
    const loser = await prisma.user.findUnique({ where: { id: loserId } });
    if (!loser) {
      return reply.code(404).send({ error: "Loser not found." });
    }

    console.log(`[processGameResult] Loser before update: ${loser.userName}, XP: ${loser.xp}, Level: ${loser.level}`);
    
    const newLoserXP = Math.max(0, loser.xp + LOSS_XP);
    const loserLevel = Math.floor(newLoserXP / 100) + 1;

    const updatedLoser = await prisma.user.update({
      where: { id: loserId },
      data: {
        xp: newLoserXP,
        level: loserLevel,
      },
    });

    console.log(`[processGameResult] Loser after update: ${updatedLoser.userName}, XP: ${updatedLoser.xp}, Level: ${updatedLoser.level}`);
    
    // Verify the update was successful
    const verifyLoser = await prisma.user.findUnique({ where: { id: loserId }, select: { xp: true, level: true } });
    if (verifyLoser.xp !== newLoserXP || verifyLoser.level !== loserLevel) {
      console.error(`[processGameResult] ERROR: Loser XP/Level mismatch! Expected XP: ${newLoserXP}, Got: ${verifyLoser.xp}, Expected Level: ${loserLevel}, Got: ${verifyLoser.level}`);
    } else {
      console.log(`[processGameResult] Verified: Loser XP and Level correctly updated in database`);
    }

    // Create game record first (for win counting)
    try {
      await prisma.game.create({
        data: {
          title: "Pong Match",
          genre: "Arcade",
          userId: winnerId,
        },
      });
    } catch (error) {
      // Game record creation is optional, don't fail if it errors
      console.log("Note: Could not create game record:", error.message);
    }

    // Save match history with scores and opponent info
    try {
      // Determine player1 and player2 (order doesn't matter, but we need to be consistent)
      // We'll use winner as player1 and loser as player2 for consistency
      await prisma.matchHistory.create({
        data: {
          gameId: gameId || `game-${Date.now()}`,
          player1Id: winnerId,
          player2Id: loserId,
          player1Score: winnerScore,
          player2Score: loserScore,
          winnerId: winnerId,
        },
      });
      console.log(`[processGameResult] Saved match history for game ${gameId}`);
    } catch (error) {
      // Match history creation is optional, don't fail if it errors
      console.log("Note: Could not create match history:", error.message);
    }

    // Check and unlock achievements for winner
    const unlockedAchievements = [];

    // Get winner's current achievements
    const winnerAchievements = await prisma.userAchievement.findMany({
      where: { userId: winnerId },
      include: { achievement: true },
    });

    const winnerAchievementNames = new Set(
      winnerAchievements.map((ua) => ua.achievement.name)
    );

    // Helper function to get or create achievement
    const getOrCreateAchievement = async (name, description, tier) => {
      let achievement = await prisma.achievement.findUnique({
        where: { name },
      });

      if (!achievement) {
        achievement = await prisma.achievement.create({
          data: { name, description, tier },
        });
      }

      return achievement;
    };

    // Count total wins from game records (after creating this game)
    const totalWins = await prisma.game.count({
      where: { userId: winnerId },
    });

    // Check for "First Win" achievement
    if (totalWins === 1) {
      const firstWinAchievement = await getOrCreateAchievement(
        "First Win",
        "Win your first game",
        "BRONZE"
      );

      if (!winnerAchievementNames.has("First Win")) {
        await prisma.userAchievement.create({
          data: {
            userId: winnerId,
            achievementId: firstWinAchievement.id,
            count: 1,
          },
        });
        unlockedAchievements.push(firstWinAchievement);

        await prisma.recentActivity.create({
          data: {
            userId: winnerId,
            type: "ACHIEVEMENT",
            text: `Unlocked "${firstWinAchievement.name}"`,
          },
        });
      }
    }

    // Check for win count achievements
    const winMilestones = [
      { count: 10, name: "10 Wins", description: "Win 10 games", tier: "BRONZE" },
      { count: 50, name: "50 Wins", description: "Win 50 games", tier: "SILVER" },
      { count: 100, name: "100 Wins", description: "Win 100 games", tier: "GOLD" },
    ];

    for (const milestone of winMilestones) {
      if (totalWins >= milestone.count) {
        const achievement = await getOrCreateAchievement(
          milestone.name,
          milestone.description,
          milestone.tier
        );

        if (!winnerAchievementNames.has(milestone.name)) {
          await prisma.userAchievement.create({
            data: {
              userId: winnerId,
              achievementId: achievement.id,
              count: 1,
            },
          });
          unlockedAchievements.push(achievement);

          await prisma.recentActivity.create({
            data: {
              userId: winnerId,
              type: "ACHIEVEMENT",
              text: `Unlocked "${achievement.name}"`,
            },
          });
        }
      }
    }

    // Check for "Perfect Game" (winning 11-0)
    if (winnerScore === 11 && loserScore === 0) {
      const perfectGameAchievement = await getOrCreateAchievement(
        "Perfect Game",
        "Win a game without letting your opponent score",
        "GOLD"
      );

      if (!winnerAchievementNames.has("Perfect Game")) {
        await prisma.userAchievement.create({
          data: {
            userId: winnerId,
            achievementId: perfectGameAchievement.id,
            count: 1,
          },
        });
        unlockedAchievements.push(perfectGameAchievement);

        await prisma.recentActivity.create({
          data: {
            userId: winnerId,
            type: "ACHIEVEMENT",
            text: `Unlocked "${perfectGameAchievement.name}"`,
          },
        });
      }
    }


    console.log(`[processGameResult] Successfully processed game result:
      Winner: ${winnerId} - XP: ${winner.xp} -> ${newWinnerXP} (+${WIN_XP}), Level: ${winner.level} -> ${winnerLevel}
      Loser: ${loserId} - XP: ${loser.xp} -> ${newLoserXP} (${LOSS_XP}), Level: ${loser.level} -> ${loserLevel}
      Total Wins: ${totalWins}
      Unlocked Achievements: ${unlockedAchievements.length}`);

    return reply.code(200).send({
      message: "Game result processed successfully",
      data: {
        winner: {
          id: winnerId,
          newXP: newWinnerXP,
          newLevel: winnerLevel,
          xpGained: WIN_XP,
        },
        loser: {
          id: loserId,
          newXP: newLoserXP,
          newLevel: loserLevel,
          xpLost: Math.abs(LOSS_XP),
        },
        unlockedAchievements: unlockedAchievements.map((a) => ({
          name: a.name,
          tier: a.tier,
        })),
        totalWins: totalWins,
      },
    });
  } catch (error) {
    console.error("Error processing game result:", error);
    return reply.code(500).send({
      error: "An error occurred while processing the game result.",
      details: error.message,
    });
  }
};
