import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'vote',
    description: 'Vote for the bot.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const voteUrl = 'https://top.gg/bot/example'; // Replace with actual vote link
        const embed = EmbedUtils.info('Vote for Me', `[Click here to vote!](${voteUrl})`);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
