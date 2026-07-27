-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("userId", "achievementId"),
    CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_achievements" ("achievementId", "unlockedAt", "userId") SELECT "achievementId", "unlockedAt", "userId" FROM "user_achievements";
DROP TABLE "user_achievements";
ALTER TABLE "new_user_achievements" RENAME TO "user_achievements";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
