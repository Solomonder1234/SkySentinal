-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GuildConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "modLogChannelId" TEXT,
    "adminRoleId" TEXT,
    "modRoleId" TEXT,
    "enableAutomod" BOOLEAN NOT NULL DEFAULT false,
    "enableLogging" BOOLEAN NOT NULL DEFAULT false,
    "enableWelcome" BOOLEAN NOT NULL DEFAULT false,
    "aiChatChannelId" TEXT,
    "aiGlobalChat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GuildConfig" ("adminRoleId", "aiChatChannelId", "createdAt", "enableAutomod", "enableLogging", "enableWelcome", "id", "modLogChannelId", "modRoleId", "prefix", "updatedAt") SELECT "adminRoleId", "aiChatChannelId", "createdAt", "enableAutomod", "enableLogging", "enableWelcome", "id", "modLogChannelId", "modRoleId", "prefix", "updatedAt" FROM "GuildConfig";
DROP TABLE "GuildConfig";
ALTER TABLE "new_GuildConfig" RENAME TO "GuildConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
