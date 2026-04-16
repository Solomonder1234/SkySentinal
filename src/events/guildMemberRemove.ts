import { Events, GuildMember, PartialGuildMember } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.GuildMemberRemove,
    run: async (client, member: GuildMember | PartialGuildMember) => {
        await Logger.log(
            member.guild,
            'Member Left',
            `${member.user?.tag} (${member.id}) has left the server.`,
            'Red',
            [
                { name: 'Member Count', value: `${member.guild.memberCount}` }
            ],
            LogCategory.Join
        );

        // Antinuke Observation (Kick Detection)
        const auditLogs = await member.guild.fetchAuditLogs({ type: 24, limit: 1 });
        const entry = auditLogs.entries.first();
        if (entry && entry.target?.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
            await client.antinuke.recordAction(member.guild, entry.executor as any, 'kick');
        }
    },
} as Event<Events.GuildMemberRemove>;
