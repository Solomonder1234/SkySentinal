import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'shorten',
    description: 'Shorten a URL.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'url',
            description: 'The URL to shorten.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let url = '';

        if (interaction instanceof Message) {
            url = interaction.content.split(' ').slice(1).join(' ');
        } else {
            url = (interaction as ChatInputCommandInteraction).options.getString('url', true);
        }

        if (!url) return interaction.reply('Please provide a URL.');
        if (!url.startsWith('http')) url = 'http://' + url;

        try {
            // Using is.gd API (no key required)
            const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl);

            const shortUrl = res.data;

            const embed = EmbedUtils.info('URL Shortener', 'Successfully shortened your link.')
                .addFields(
                    { name: 'Original', value: `\`${url}\`` },
                    { name: 'Shortened', value: `**${shortUrl}**` }
                );

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply('Failed to shorten URL. Make sure it is valid.');
        }
    },
} as Command;
