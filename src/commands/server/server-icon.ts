import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'server-icon',
    description: 'Displays the server icon.',
    category: 'Server',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const guild = interaction.guild;
        if (!guild) return interaction.reply('This command can only be used in a server.');

        const iconUrl = guild.iconURL({ size: 1024, extension: 'png' });

        if (!iconUrl) {
            const embed = EmbedUtils.info('Server Icon', 'This server does not have an icon.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [embed] });
            return interaction.reply({ embeds: [embed] });
        }

        const embed = EmbedUtils.info(`${guild.name}'s Icon`, 'High-resolution server identification view.')
            .setImage(iconUrl)
            .setFooter({ text: `SkySentinel Supreme • Requested by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}` });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
