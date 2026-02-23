import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'urban',
    description: 'Search Urban Dictionary.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'term',
            description: 'The term to define.',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        let term = '';

        if (interaction instanceof Message) {
            term = interaction.content.split(' ').slice(1).join(' ');
        } else {
            term = (interaction as ChatInputCommandInteraction).options.getString('term', true);
        }

        if (!term) return interaction.reply('Please provide a term to search.');

        try {
            const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
            const res = await axios.get(url);
            const list = res.data.list;

            if (!list || list.length === 0) {
                return interaction.reply('No definition found.');
            }

            const def = list[0];
            // Truncate if too long (Discord limit 1024 chars in field)
            const definition = def.definition.length > 1000 ? def.definition.substring(0, 997) + '...' : def.definition;
            const example = def.example.length > 1000 ? def.example.substring(0, 997) + '...' : def.example;

            const embed = EmbedUtils.info(`Urban Dictionary: ${def.word}`, `\n**Definition:**\n${definition}\n\n**Example:**\n*${example || 'No example provided.'}*\n`)
                .setURL(def.permalink)
                .addFields(
                    { name: 'Rating', value: `👍 ${def.thumbs_up} | 👎 ${def.thumbs_down}` }
                )
                .setFooter({ text: `Author: ${def.author} • SkySentinel AV Edition` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply('Failed to fetch definition.');
        }
    },
} as Command;
