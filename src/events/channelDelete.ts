import { Events, GuildChannel, DMChannel } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.ChannelDelete,
    run: async (client, channel: DMChannel | GuildChannel) => {
        if (channel instanceof DMChannel) return;

        await Logger.log(
            channel.guild,
            'Channel Deleted',
            `Channel \`${channel.name}\` was deleted.`,
            'Red',
            [
                { name: 'Type', value: `${channel.type}` }
            ]
        );
    },
} as Event<Events.ChannelDelete>;
