import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setwatchchannel',
    description: 'Configure the designated channel for Watch list logs.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'channel',
            description: 'The channel to send watch logs to',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true,
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        let channel;
        if (interaction instanceof ChatInputCommandInteraction) {
            channel = interaction.options.getChannel('channel', true);
        } else {
            // Primitive prefix fallback
            const args = (interaction as any).content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please specify a channel mention or ID.' });
            const channelId = args[0].replace(/[<#>]/g, '');
            channel = interaction.guild.channels.cache.get(channelId);
            if (!channel || channel.type !== ChannelType.GuildText) {
                return interaction.reply({ content: 'Invalid channel specified.' });
            }
        }

        try {
            await client.database.prisma.guildConfig.upsert({
                where: { id: interaction.guild.id },
                create: {
                    id: interaction.guild.id,
                    watchLogChannelId: channel.id
                },
                update: {
                    watchLogChannelId: channel.id
                }
            });

            await interaction.reply({
                embeds: [EmbedUtils.success('Watch Logs Updated', `Watch logs will now be sent to <#${channel.id}>`)]
            });
        } catch (error) {
            console.error('Error setting watch channel:', error);
            await interaction.reply({
                embeds: [EmbedUtils.error('Configuration Error', 'An error occurred while setting the watch channel.')]
            });
        }
    }
} as Command;
