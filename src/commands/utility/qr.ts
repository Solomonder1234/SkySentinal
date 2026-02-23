import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'qr',
    description: 'Generate a QR code.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'text',
            description: 'The text or URL to encode.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let text = '';

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            text = args.join(' ');
        } else {
            text = (interaction as ChatInputCommandInteraction).options.getString('text', true);
        }

        if (!text) return interaction.reply('Please provide text to encode.');

        try {
            // Using goqr.me API or quickchart.io
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

            const embed = EmbedUtils.info('QR Code Generator', `Successfully generated a QR code for your input.`)
                .setImage(url);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply('Failed to generate QR code.');
        }
    },
} as Command;
