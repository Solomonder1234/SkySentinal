import { Message } from 'discord.js';
import { Command } from '../../lib/structures/Command';
import { EmbedUtils } from '../../utils/EmbedUtils';

export default {
    name: 'suggest',
    description: 'Create a suggestion ticket for staff review.',
    aliases: ['suggestion', 'ticket'],
    category: 'Utility',
    run: async (client, interaction) => {
        if (!interaction.guild || !interaction.member || !(interaction instanceof Message)) return;

        const args = interaction.content.split(' ').slice(1);
        const content = args.join(' ');
        if (!content) {
            return interaction.reply({ embeds: [EmbedUtils.error('Invalid Suggestion', 'Please provide the content for your suggestion.')] });
        }

        const result = await client.suggestions.createSuggestion(interaction.member as any, content);
        if (result.success) {
            await interaction.reply({ embeds: [EmbedUtils.success('Suggestion Received', `Your suggestion ticket has been created in <#${result.channelId}>.`)] });
        } else {
            await interaction.reply({ embeds: [EmbedUtils.error('Failed to Create Suggestion', result.message || 'An unknown error occurred.')] });
        }
    },
} as Command;
