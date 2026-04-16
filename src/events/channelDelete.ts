import { Events, GuildChannel, DMChannel } from 'discord.js';
import { Event } from '../lib/structures/Event';
import { Logger, LogCategory } from '../utils/Logger';

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
            ],
            LogCategory.Server
        );

        // Antinuke Observation
        await client.antinuke.recordAction(channel.guild, (await channel.guild.fetchAuditLogs({ type: 12, limit: 1 })).entries.first()?.executor as any, 'channel');
    },
} as Event<Events.ChannelDelete>;
