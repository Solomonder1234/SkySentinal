import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils, Colors } from '../../utils/EmbedUtils';

export default {
    name: 'server-banner',
    description: 'Displays the server banner.',
    category: 'Server',
    type: ApplicationCommandType.ChatInput,
    options: [],
    run: async (client, interaction) => {
        const guild = interaction.guild;
        if (!guild) return interaction.reply('This command can only be used in a server.');

        const bannerUrl = guild.bannerURL({ size: 1024, extension: 'png' });

        if (!bannerUrl) {
            const embed = EmbedUtils.info('Server Banner', 'This server does not have a banner.');
            if (interaction instanceof Message) return interaction.reply({ embeds: [embed] });
            return interaction.reply({ embeds: [embed] });
        }

        const embed = EmbedUtils.info(`${guild.name}'s Banner`, 'High-resolution server banner view.')
            .setImage(bannerUrl)
            .setFooter({ text: `SkySentinel Supreme • Requested by ${interaction instanceof Message ? interaction.author.tag : interaction.user.tag}` });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
