import { Events, Role } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.GuildRoleCreate,
    run: async (client, role: Role) => {
        await Logger.log(
            role.guild,
            'Role Created',
            `Role ${role} (\`${role.name}\`) was created.`,
            'Green',
            [
                { name: 'Color', value: `${role.hexColor}` },
                { name: 'Permissions', value: `${role.permissions.toArray().length} permissions` }
            ],
            LogCategory.Server
        );
    },
} as Event<Events.GuildRoleCreate>;
