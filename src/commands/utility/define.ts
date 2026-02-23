import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'define',
    description: 'Get a concise definition for any word.',
    category: 'Utility',
    slashData: new SlashCommandBuilder()
        .setName('define')
        .setDescription('Get a concise definition for any word.')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to define')
                .setRequired(true)),

    run: async (client, interaction) => {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;

        const word = interaction.options.getString('word', true);
        await interaction.deferReply();

        try {
            if (!client.ai) {
                return interaction.editReply({
                    embeds: [EmbedUtils.error('AI Offline', 'The AI service is currently unavailable.')]
                });
            }

            const context = [
                "You are a linguistic expert and dictionary.",
                `The user wants a concise, professional definition for the word: "${word}".`,
                "Include the part of speech (noun, verb, etc.) and a short usage example.",
                "Keep the total response under 500 characters."
            ];

            const response = await client.ai.generateResponse(word, context);
            const embed = EmbedUtils.info(`Definition: ${word}`, response.text);

            return interaction.editReply({ embeds: [embed] });
        } catch (error: any) {
            console.error('[define] Error:', error);
            return interaction.editReply({
                embeds: [EmbedUtils.error('Definition Failed', 'Could not retrieve a definition at this time.')]
            });
        }
    },
} as Command;
