/*
  Warnings:

  - You are about to alter the column `balance` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `bank` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `xp` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "xp" BIGINT NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSkulled" BOOLEAN NOT NULL DEFAULT false,
    "isClowned" BOOLEAN NOT NULL DEFAULT false,
    "isNerded" BOOLEAN NOT NULL DEFAULT false,
    "isFished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "bank" BIGINT NOT NULL DEFAULT 0,
    "lastDaily" DATETIME,
    "lastWork" DATETIME,
    "lastRob" DATETIME,
    "lastBeg" DATETIME,
    "lastCrime" DATETIME,
    "lastSearch" DATETIME,
    "lastFish" DATETIME,
    "lastHunt" DATETIME,
    "lastDig" DATETIME
);
INSERT INTO "new_UserProfile" ("balance", "bank", "createdAt", "id", "isClowned", "isFished", "isNerded", "isSkulled", "isVerified", "lastBeg", "lastCrime", "lastDaily", "lastDig", "lastFish", "lastHunt", "lastRob", "lastSearch", "lastWork", "level", "updatedAt", "xp") SELECT "balance", "bank", "createdAt", "id", "isClowned", "isFished", "isNerded", "isSkulled", "isVerified", "lastBeg", "lastCrime", "lastDaily", "lastDig", "lastFish", "lastHunt", "lastRob", "lastSearch", "lastWork", "level", "updatedAt", "xp" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
