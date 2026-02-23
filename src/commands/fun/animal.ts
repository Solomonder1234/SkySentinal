import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, Message, ChatInputCommandInteraction } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import axios from 'axios';

export default {
    name: 'animal',
    description: 'Get a cute animal picture.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'type',
            description: 'Can be dog or cat',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Dog', value: 'dog' },
                { name: 'Cat', value: 'cat' },
                { name: 'Fox', value: 'fox' },
            ]
        }
    ],
    run: async (client, interaction) => {
        let type = 'dog';
        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            type = args[0]?.toLowerCase() || 'dog';
        } else {
            type = (interaction as ChatInputCommandInteraction).options.getString('type', true);
        }

        let url = '';
        try {
            if (type === 'dog') {
                const res = await axios.get('https://dog.ceo/api/breeds/image/random');
                url = res.data.message;
            } else if (type === 'cat') {
                const res = await axios.get('https://api.thecatapi.com/v1/images/search');
                url = res.data[0].url;
            } else if (type === 'fox') {
                const res = await axios.get('https://randomfox.ca/floof/');
                url = res.data.image;
            } else {
                return interaction.reply('Invalid animal type. Try dog, cat, or fox.');
            }

            const embed = EmbedUtils.info(`Random ${type.charAt(0).toUpperCase() + type.slice(1)}`, '')
                .setImage(url);

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'Failed to fetch animal image.' });
        }
    },
} as Command;
