import { Events, GuildChannel, DMChannel } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger } from '../utils/Logger';

export default {
    name: Events.ChannelUpdate,
    run: async (client, oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
        if (newChannel instanceof DMChannel || oldChannel instanceof DMChannel) return;

        if (oldChannel.name !== newChannel.name) {
            await Logger.log(
                newChannel.guild,
                'Channel Updated',
                `Channel ${newChannel} updated.`,
                'Yellow',
                [
                    { name: 'Old Name', value: oldChannel.name },
                    { name: 'New Name', value: newChannel.name }
                ]
            );
        }
    },
} as Event<Events.ChannelUpdate>;
