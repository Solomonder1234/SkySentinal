import { Message, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Command } from '../../lib/structures/Command';

export default {
    name: 'settranscriptchannel',
    description: 'Sets the channel where closed ticket transcripts will be sent.',
    permissions: [PermissionFlagsBits.Administrator],
    aliases: ['settranscripts', 'settranscriptlog'],
    run: async (client, message: Message, args: string[]) => {
        let channelId = args[0]?.replace(/[<#!>]/g, '');

        if (!channelId) {
            return message.reply('❌ **Please provide a valid Channel ID.**');
        }

        const channel = message.guild?.channels.cache.get(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            return message.reply('❌ **That is not a valid Text Channel ID in this server.**');
        }

        try {
            await client.database.prisma.guildConfig.update({
                where: { id: message.guild!.id },
                data: { transcriptChannelId: channelId }
            });

            return message.reply(`✅ **Transcript Logs will now be sent to <#${channelId}>.**`);
        } catch (error) {
            client.logger.error('Failed to update transcript config:', error);
            return message.reply('❌ **Failed to update the database.**');
        }
    }
} as Command;
