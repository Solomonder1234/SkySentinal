-- CreateTable
CREATE TABLE "GuildConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "modLogChannelId" TEXT,
    "adminRoleId" TEXT,
    "modRoleId" TEXT,
    "enableAutomod" BOOLEAN NOT NULL DEFAULT false,
    "enableLogging" BOOLEAN NOT NULL DEFAULT false,
    "enableWelcome" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Case" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "duration" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Case_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
