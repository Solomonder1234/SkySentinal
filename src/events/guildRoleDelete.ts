import { Events, Role } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.GuildRoleDelete,
    run: async (client, role: Role) => {
        await Logger.log(
            role.guild,
            'Role Deleted',
            `Role \`${role.name}\` (\`${role.id}\`) was deleted.`,
            'Red',
            [],
            LogCategory.Server
        );

        // Antinuke Observation
        await client.antinuke.recordAction(role.guild, (await role.guild.fetchAuditLogs({ type: 32, limit: 1 })).entries.first()?.executor as any, 'role');
    },
} as Event<Events.GuildRoleDelete>;
