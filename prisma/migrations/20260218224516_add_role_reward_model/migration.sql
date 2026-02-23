-- CreateTable
CREATE TABLE "RoleReward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guildId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "RoleReward_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleReward_guildId_level_key" ON "RoleReward"("guildId", "level");
