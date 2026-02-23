import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'support',
    description: 'Get the link to the support server.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const supportUrl = 'https://discord.gg/example'; // Replace with actual support server
        const embed = EmbedUtils.info('Support Server', `[Click here to join the support server!](${supportUrl})`);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
