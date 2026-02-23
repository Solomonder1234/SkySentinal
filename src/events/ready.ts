import { Event } from '../lib/structures/Event';
import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    run: async (client) => {
        client.logger.info(`Ready! Logged in as ${client.user?.tag}`);

        // Scheduler for Tempbans
        setInterval(async () => {
            try {
                const now = new Date();
                const expiredBans = await client.database.prisma.case.findMany({
                    where: {
                        type: 'TEMPBAN',
                        active: true,
                    },
                });

                for (const ban of expiredBans) {
                    if (!ban.duration) continue;
                    const expiresAt = new Date(ban.createdAt.getTime() + ban.duration);

                    if (now >= expiresAt) {
                        const guild = client.guilds.cache.get(ban.guildId);
                        if (guild) {
                            try {
                                await guild.members.unban(ban.targetId, 'Tempban expired');
                                client.logger.info(`Unbanned user ${ban.targetId} in guild ${guild.name} (Tempban expired)`);
                            } catch (e) {
                                client.logger.error(`Failed to auto-unban ${ban.targetId}:`, e);
                            }
                        }

                        await client.database.prisma.case.update({
                            where: { id: ban.id },
                            data: { active: false },
                        });
                    }
                }
            } catch (error) {
                client.logger.error('Error in tempban scheduler:', error);
            }
        }, 60000); // Check every minute
    },
} as Event<Events.ClientReady>;
