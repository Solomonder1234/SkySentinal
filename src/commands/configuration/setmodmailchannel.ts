import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { JSONDatabase } from '../../utils/JSONDatabase';

export default {
    name: 'setmodmailchannel',
    description: 'Set the channel where Modmail threads will be created.',
    category: 'Configuration',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
        {
            name: 'channel',
            description: 'The forum or text channel to act as the Modmail hub.',
            type: ApplicationCommandOptionType.Channel,
            required: true
        }
    ],
    run: async (client, interaction, args) => {
        const guildId = interaction.guildId!;
        let targetChannelId: string | null = null;

        if (interaction instanceof ChatInputCommandInteraction) {
            targetChannelId = interaction.options.getChannel('channel', true).id;
        } else {
            targetChannelId = (args[0] || '').replace(/[<#>]/g, '');
        }

        if (!targetChannelId) {
            return interaction.reply({ embeds: [EmbedUtils.error('Missing Argument', 'Please provide a valid channel mention or ID. (`!setmodmailchannel #channel`)')] });
        }

        const channel = interaction.guild?.channels.cache.get(targetChannelId);
        if (!channel || !channel.isTextBased()) {
            return interaction.reply({ embeds: [EmbedUtils.error('Invalid Channel', 'Please provide a valid text-based channel.')] });
        }

        JSONDatabase.updateGuildConfig(guildId, { modmailChannelId: targetChannelId });

        return interaction.reply({ embeds: [EmbedUtils.success('Modmail Channel Set', `Modmail threads will now be created in <#${targetChannelId}>.\nEnsure the bot has permission to create Private Threads in that channel.`)] });
    }
} as Command;
