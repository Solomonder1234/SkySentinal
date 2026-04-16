import { Command } from '../../lib/structures/Command';
import { ApplicationCommandType } from 'discord.js';
import { EmbedUtils } from '../../utils/EmbedUtils';
import { AnimalService } from '../../lib/services/AnimalService';

export default {
    name: 'cat',
    description: 'Get a cute random cat picture.',
    category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const url = await AnimalService.getAnimalImage('cat');
        if (!url) {
            return interaction.reply({ content: 'Failed to fetch cat image. 🐱', ephemeral: true });
        }

        const embed = EmbedUtils.info('Random Cat', '')
            .setImage(url);

        await interaction.reply({ embeds: [embed] });
    },
} as Command;
