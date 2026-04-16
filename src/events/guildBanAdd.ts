import { Events, GuildBan } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.GuildBanAdd,
    run: async (client, ban: GuildBan) => {
        await Logger.log(
            ban.guild,
            'Member Banned',
            `${ban.user.tag} (${ban.user.id}) was banned from the server.`,
            'Red',
            [
                { name: 'Reason', value: ban.reason || 'No reason provided' }
            ],
            LogCategory.Moderation
        );

        // Antinuke Observation (Ban Detection)
        const auditLogs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
        const entry = auditLogs.entries.first();
        if (entry && entry.target?.id === ban.user.id && Date.now() - entry.createdTimestamp < 5000) {
            await client.antinuke.recordAction(ban.guild, entry.executor as any, 'ban');
        }
    },
} as Event<Events.GuildBanAdd>;
