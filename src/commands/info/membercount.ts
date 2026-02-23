import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'membercount',
    description: 'Get the server member count.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        const count = interaction.guild.memberCount;
        const embed = EmbedUtils.info('Member Count', `Total Members: **${count}**`);

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
