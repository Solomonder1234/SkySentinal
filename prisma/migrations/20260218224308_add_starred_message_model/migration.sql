-- CreateTable
CREATE TABLE "StarredMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "originalMessageId" TEXT NOT NULL,
    "starboardMessageId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StarredMessage_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StarredMessage_originalMessageId_key" ON "StarredMessage"("originalMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "StarredMessage_starboardMessageId_key" ON "StarredMessage"("starboardMessageId");
