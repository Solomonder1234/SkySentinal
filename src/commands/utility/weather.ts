import { Command } from '../../lib/structures/Command';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'weather',
    description: 'Get weather information for a location.',
    category: 'Utility',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'location',
            description: 'City name or coordinates.',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'forecast',
            description: 'Get a 5-day weather forecast.',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        }
    ],
    run: async (client, interaction) => {
        let location = '';
        let showForecast = false;

        if (interaction instanceof Message) {
            const args = interaction.content.split(' ').slice(1);
            if (args[0] === 'forecast' || args[0] === '-f') {
                showForecast = true;
                location = args.slice(1).join(' ');
            } else {
                location = args.join(' ');
            }
        } else {
            const chatInteraction = interaction as ChatInputCommandInteraction;
            location = chatInteraction.options.getString('location', true);
            showForecast = chatInteraction.options.getBoolean('forecast') || false;
        }

        if (!location) return interaction.reply('Please provide a location.');

        try {
            // Defer reply as API calls might take a moment
            if (!(interaction instanceof Message)) await interaction.deferReply();

            if (!client.ai?.weatherService) {
                const msg = 'Weather service is currently unavailable.';
                return interaction instanceof Message ? interaction.reply(msg) : interaction.editReply(msg);
            }

            let result = '';
            if (showForecast) {
                result = await client.ai.weatherService.getForecast(location);
            } else {
                result = await client.ai.weatherService.getWeather(location);
            }

            if (interaction instanceof Message) {
                await interaction.reply(result);
            } else {
                await interaction.editReply(result);
            }

        } catch (error) {
            console.error(error);
            const msg = 'Failed to fetch weather data.';
            if (interaction instanceof Message) {
                interaction.reply(msg);
            } else {
                interaction.editReply(msg);
            }
        }
    },
} as Command;
