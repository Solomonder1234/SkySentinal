import { Events, GuildChannel } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

export default {
    name: Events.ChannelCreate,
    run: async (client, channel: GuildChannel) => {
        if (!channel.guild) return;

        await Logger.log(
            channel.guild,
            'Channel Created',
            `Channel ${channel} (\`${channel.name}\`) was created.`,
            'Green',
            [
                { name: 'Type', value: `${channel.type}` }
            ],
            LogCategory.Server
        );
    },
} as Event<Events.ChannelCreate>;
