-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSkulled" BOOLEAN NOT NULL DEFAULT false,
    "isClowned" BOOLEAN NOT NULL DEFAULT false,
    "isNerded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserProfile" ("createdAt", "id", "isSkulled", "isVerified", "level", "updatedAt", "xp") SELECT "createdAt", "id", "isSkulled", "isVerified", "level", "updatedAt", "xp" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
