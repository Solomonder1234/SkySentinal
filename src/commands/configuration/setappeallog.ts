import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction } from 'discord.js';
import { JSONDatabase } from '../../utils/JSONDatabase';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'setappeallog',
    description: 'Sets the channel where all formal appeals are logged for senior staff review.',
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: 'channel',
            description: 'The channel to log formal appeals in.',
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        let channelId;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            channelId = args[0]?.replace(/[<#>]/g, '');
            if (!channelId) return interaction.reply({ content: 'Please provide a valid channel mention or ID.' });
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            channelId = chatInteraction.options.getChannel('channel', true).id;
        }

        if (!interaction.guild) return;

        JSONDatabase.updateGuildConfig(interaction.guild.id, {
            appealLogChannelId: channelId
        });

        const successEmbed = EmbedUtils.success('Appeals Log Configured', `All formal infraction appeals will now be centrally forwarded to <#${channelId}>.`);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [successEmbed] });
        } else {
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
    },
} as Command;
