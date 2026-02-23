import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'wikipedia',
    description: 'Search Wikipedia.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'query',
            description: 'The search query.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let query = '';

        if (interaction instanceof Message) {
            query = interaction.content.split(' ').slice(1).join(' ');
        } else {
            query = (interaction as ChatInputCommandInteraction).options.getString('query', true);
        }

        if (!query) return interaction.reply('Please provide a search query.');

        try {
            // Wikipedia API
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(query)}`;
            const searchRes = await axios.get(searchUrl);

            if (!searchRes.data.query.search || searchRes.data.query.search.length === 0) {
                return interaction.reply('No results found.');
            }

            const result = searchRes.data.query.search[0];
            const pageId = result.pageid;
            const title = result.title;
            const snippet = result.snippet.replace(/<[^>]*>?/gm, ''); // Strip HTML tags

            const pageUrl = `https://en.wikipedia.org/?curid=${pageId}`;

            const embed = EmbedUtils.info(`Wikipedia: ${title}`, `\n${snippet}...\n`)
                .setURL(pageUrl)
                .setFooter({ text: 'Wikipedia • SkySentinel AV Edition', iconURL: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply('Failed to fetch Wikipedia article.');
        }
    },
} as Command;
