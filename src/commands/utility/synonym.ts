import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'synonym',
    description: 'Find synonyms and antonyms for a word.',
    category: 'Utility',
    slashData: new SlashCommandBuilder()
        .setName('synonym')
        .setDescription('Find synonyms and antonyms for a word.')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to look up')
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
                "You are a thesaurus expert.",
                `Provide a list of synonyms and antonyms for the word: "${word}".`,
                "Format as:\n**Synonyms:** [List]\n**Antonyms:** [List]",
                "Be concise."
            ];

            const response = await client.ai.generateResponse(word, context);
            const embed = EmbedUtils.info(`Thesaurus: ${word}`, response.text);

            return interaction.editReply({ embeds: [embed] });
        } catch (error: any) {
            console.error('[synonym] Error:', error);
            return interaction.editReply({
                embeds: [EmbedUtils.error('Thesaurus Failed', 'Could not retrieve synonyms at this time.')]
            });
        }
    },
} as Command;
