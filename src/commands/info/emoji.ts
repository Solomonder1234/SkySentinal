import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType, PermissionFlagsBits, Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'emoji',
    description: 'List server emojis.',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        if (!interaction.guild) return;

        const emojis = interaction.guild.emojis.cache;
        if (emojis.size === 0) return interaction.reply({ content: 'No emojis found.' });

        // Limit to prevent huge messages
        const emojiList = emojis.map(e => e.toString()).join(' ').slice(0, 2000);

        const embed = EmbedUtils.info(`Server Emojis (${emojis.size})`, `\n${emojiList}\n`)
            .setFooter({ text: `SkySentinel AV • Total Emojis: ${emojis.size}` });

        if (interaction instanceof Message) {
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    },
} as Command;
