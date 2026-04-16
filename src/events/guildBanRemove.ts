import { Events, GuildBan } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.GuildBanRemove,
    run: async (client, ban: GuildBan) => {
        await Logger.log(
            ban.guild,
            'Member Unbanned',
            `${ban.user.tag} (${ban.user.id}) was unbanned.`,
            'Green',
            [
                { name: 'Reason', value: ban.reason || 'No reason provided' }
            ],
            LogCategory.Moderation
        );
    },
} as Event<Events.GuildBanRemove>;
