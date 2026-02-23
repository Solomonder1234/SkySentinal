-- CreateTable
CREATE TABLE "ReactionRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "ReactionRole_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "aiModeration" BOOLEAN NOT NULL DEFAULT false,
    "starboardChannelId" TEXT,
    "starboardThreshold" INTEGER NOT NULL DEFAULT 5,
    "levelUpChannelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GuildConfig" ("adminRoleId", "aiChatChannelId", "aiGlobalChat", "createdAt", "enableAutomod", "enableLogging", "enableWelcome", "id", "modLogChannelId", "modRoleId", "prefix", "updatedAt") SELECT "adminRoleId", "aiChatChannelId", "aiGlobalChat", "createdAt", "enableAutomod", "enableLogging", "enableWelcome", "id", "modLogChannelId", "modRoleId", "prefix", "updatedAt" FROM "GuildConfig";
DROP TABLE "GuildConfig";
ALTER TABLE "new_GuildConfig" RENAME TO "GuildConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReactionRole_messageId_idx" ON "ReactionRole"("messageId");
