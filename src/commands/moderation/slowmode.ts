import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'slowmode',
    description: 'Set the slowmode for a channel.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: 'seconds',
            description: 'The slowmode duration in seconds (0 to disable).',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
        {
            name: 'channel',
            description: 'The channel to apply slowmode to (defaults to current).',
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
    ],
    run: async (client, interaction) => {
        let seconds;
        let channel: TextChannel;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (!args[0]) return interaction.reply({ content: 'Please provide seconds.' });
            seconds = parseInt(args[0]);

            const channelId = args[1]?.replace(/[<#!>]/g, '');
            if (channelId) {
                const fetched = interaction.guild?.channels.cache.get(channelId);
                if (fetched && fetched.isTextBased()) channel = fetched as TextChannel;
                else channel = interaction.channel as TextChannel;
            } else {
                channel = interaction.channel as TextChannel;
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            seconds = chatInteraction.options.getInteger('seconds', true);
            channel = (chatInteraction.options.getChannel('channel') as TextChannel) || (interaction.channel as TextChannel);
        }

        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
            return interaction.reply({ content: 'Please provide a valid number of seconds (0-21600).' });
        }

        if (!channel || !channel.isTextBased()) return;

        try {
            await channel.setRateLimitPerUser(seconds);
            const successEmbed = EmbedUtils.success('Slowmode Set', `Slowmode for ${channel} set to **${seconds}** seconds.`);

            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [successEmbed] });
            } else {
                await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            client.logger.error(`Failed to set slowmode for ${channel.name}:`, error);
            const errorEmbed = EmbedUtils.error('Error', 'Failed to set slowmode.');
            if (interaction instanceof Message) {
                await interaction.reply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
} as Command;
